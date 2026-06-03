package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

// Registry manages service registrations and dispatches invocations.
// It supports both in-process (internal) services and external (HTTP) services.
type Registry struct {
	pool     *db.Pool
	mu       sync.RWMutex
	internal map[string]Service // In-process service implementations keyed by service key
	http     *HTTPAdapter
}

// NewRegistry constructs a Registry with the given database pool.
func NewRegistry(pool *db.Pool) *Registry {
	return &Registry{
		pool:     pool,
		internal: make(map[string]Service),
		http:     NewHTTPAdapter(),
	}
}

// RegisterInternal registers an in-process service implementation.
// These take priority over database-configured services with the same key.
func (r *Registry) RegisterInternal(svc Service) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.internal[svc.Key()] = svc
	slog.Info("service_registry: registered internal service", "key", svc.Key(), "methods", svc.Methods())
}

// Invoke dispatches a request to the appropriate service.
// Resolution order: internal (Go interface) → database registration (HTTP/gRPC).
func (r *Registry) Invoke(ctx context.Context, req *InvokeRequest) (*InvokeResponse, error) {
	start := time.Now()

	// Try internal first
	r.mu.RLock()
	svc, ok := r.internal[req.ServiceKey]
	r.mu.RUnlock()

	if ok {
		resp, err := svc.Invoke(ctx, req.Method, req.Input)
		duration := time.Since(start)
		if resp != nil {
			resp.Duration = duration
		}
		// Log async
		go r.logInvocation(req, resp, err, duration)
		return resp, err
	}

	// Look up from database
	reg, err := r.getRegistration(ctx, req.TenantID, req.ServiceKey)
	if err != nil {
		return nil, fmt.Errorf("service_registry: service %q not found: %w", req.ServiceKey, err)
	}

	if !reg.Enabled {
		return nil, fmt.Errorf("service_registry: service %q is disabled", req.ServiceKey)
	}

	// Dispatch based on transport
	var resp *InvokeResponse
	switch reg.Transport {
	case TransportHTTP:
		resp, err = r.http.Invoke(ctx, reg, req)
	default:
		return nil, fmt.Errorf("service_registry: unsupported transport %q for service %q", reg.Transport, req.ServiceKey)
	}

	duration := time.Since(start)
	if resp != nil {
		resp.Duration = duration
	}
	go r.logInvocation(req, resp, err, duration)
	return resp, err
}

// ListServices returns all registered services for a tenant (both internal and database).
func (r *Registry) ListServices(ctx context.Context, tenantID string) ([]*ServiceRegistration, error) {
	// Get database registrations
	dbRegs, err := r.listRegistrations(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	// Add internal services that aren't overridden in DB
	r.mu.RLock()
	defer r.mu.RUnlock()

	dbKeys := make(map[string]bool)
	for _, reg := range dbRegs {
		dbKeys[reg.ServiceKey] = true
	}

	for key, svc := range r.internal {
		if !dbKeys[key] {
			dbRegs = append(dbRegs, &ServiceRegistration{
				ServiceKey:  key,
				Name:        key,
				Transport:   TransportInternal,
				Enabled:     true,
				Description: fmt.Sprintf("Built-in service: %s (methods: %v)", key, svc.Methods()),
			})
		}
	}

	return dbRegs, nil
}

// GetService returns registration details for a specific service.
func (r *Registry) GetService(ctx context.Context, tenantID, serviceKey string) (*ServiceRegistration, error) {
	// Check internal first
	r.mu.RLock()
	svc, ok := r.internal[serviceKey]
	r.mu.RUnlock()

	if ok {
		return &ServiceRegistration{
			ServiceKey:  serviceKey,
			Name:        serviceKey,
			Transport:   TransportInternal,
			Enabled:     true,
			Description: fmt.Sprintf("Built-in service (methods: %v)", svc.Methods()),
		}, nil
	}

	return r.getRegistration(ctx, tenantID, serviceKey)
}

// CreateRegistration persists a new service registration.
func (r *Registry) CreateRegistration(ctx context.Context, tenantID, createdBy string, reg *ServiceRegistration) (*ServiceRegistration, error) {
	if reg.ID == "" {
		reg.ID = idgen.NewV4()
	}
	reg.TenantID = tenantID
	reg.CreatedBy = createdBy
	now := time.Now().UTC()
	reg.CreatedAt = now
	reg.UpdatedAt = now
	if reg.Config == nil {
		reg.Config = json.RawMessage(`{}`)
	}

	_, err := r.pool.Exec(ctx, `
		INSERT INTO service_registration (id, tenant_id, service_key, name, description, transport, config, enabled, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		reg.ID, reg.TenantID, reg.ServiceKey, reg.Name, reg.Description,
		string(reg.Transport), reg.Config, reg.Enabled, reg.CreatedBy, reg.CreatedAt, reg.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("service_registry: create registration: %w", err)
	}
	return reg, nil
}

// UpdateRegistration updates an existing service registration.
func (r *Registry) UpdateRegistration(ctx context.Context, tenantID string, reg *ServiceRegistration) error {
	reg.UpdatedAt = time.Now().UTC()
	_, err := r.pool.Exec(ctx, `
		UPDATE service_registration
		SET name = $1, description = $2, transport = $3, config = $4, enabled = $5, updated_at = $6
		WHERE id = $7 AND tenant_id = $8 AND deleted_at IS NULL`,
		reg.Name, reg.Description, string(reg.Transport), reg.Config, reg.Enabled, reg.UpdatedAt,
		reg.ID, tenantID)
	return err
}

// DeleteRegistration soft-deletes a service registration.
func (r *Registry) DeleteRegistration(ctx context.Context, tenantID, serviceID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE service_registration SET deleted_at = now() WHERE id = $1 AND tenant_id = $2`,
		serviceID, tenantID)
	return err
}

// GetInvocationLogs returns recent invocation logs for a service.
func (r *Registry) GetInvocationLogs(ctx context.Context, tenantID, serviceKey string, limit int) ([]InvocationLog, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	rows, err := r.pool.Query(ctx, `
		SELECT id, tenant_id, service_key, method, caller, input_data, output_data, status, error_message, duration_ms, created_at, completed_at
		FROM service_invocation_log
		WHERE tenant_id = $1 AND service_key = $2
		ORDER BY created_at DESC
		LIMIT $3`,
		tenantID, serviceKey, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []InvocationLog
	for rows.Next() {
		var l InvocationLog
		if err := rows.Scan(&l.ID, &l.TenantID, &l.ServiceKey, &l.Method, &l.Caller, &l.InputData, &l.OutputData, &l.Status, &l.ErrorMessage, &l.DurationMs, &l.CreatedAt, &l.CompletedAt); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, rows.Err()
}

// --- Internal helpers ---

func (r *Registry) getRegistration(ctx context.Context, tenantID, serviceKey string) (*ServiceRegistration, error) {
	reg := &ServiceRegistration{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, tenant_id, service_key, name, description, transport, config, enabled, created_by, created_at, updated_at
		FROM service_registration
		WHERE tenant_id = $1 AND service_key = $2 AND deleted_at IS NULL`,
		tenantID, serviceKey).Scan(
		&reg.ID, &reg.TenantID, &reg.ServiceKey, &reg.Name, &reg.Description,
		&reg.Transport, &reg.Config, &reg.Enabled, &reg.CreatedBy, &reg.CreatedAt, &reg.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return reg, nil
}

func (r *Registry) listRegistrations(ctx context.Context, tenantID string) ([]*ServiceRegistration, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, tenant_id, service_key, name, description, transport, config, enabled, created_by, created_at, updated_at
		FROM service_registration
		WHERE tenant_id = $1 AND deleted_at IS NULL
		ORDER BY service_key ASC`,
		tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var regs []*ServiceRegistration
	for rows.Next() {
		reg := &ServiceRegistration{}
		if err := rows.Scan(&reg.ID, &reg.TenantID, &reg.ServiceKey, &reg.Name, &reg.Description, &reg.Transport, &reg.Config, &reg.Enabled, &reg.CreatedBy, &reg.CreatedAt, &reg.UpdatedAt); err != nil {
			return nil, err
		}
		regs = append(regs, reg)
	}
	return regs, rows.Err()
}

func (r *Registry) logInvocation(req *InvokeRequest, resp *InvokeResponse, invokeErr error, duration time.Duration) {
	inputJSON, _ := json.Marshal(req.Input)
	var outputJSON []byte
	status := "success"
	var errMsg string

	if invokeErr != nil {
		status = "error"
		errMsg = invokeErr.Error()
	} else if resp != nil && !resp.Success {
		status = "error"
		errMsg = resp.Error
		outputJSON, _ = json.Marshal(resp.Output)
	} else if resp != nil {
		outputJSON, _ = json.Marshal(resp.Output)
	}

	now := time.Now().UTC()
	_, err := r.pool.Exec(context.Background(), `
		INSERT INTO service_invocation_log (id, tenant_id, service_key, method, caller, input_data, output_data, status, error_message, duration_ms, created_at, completed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		idgen.NewV4(), req.TenantID, req.ServiceKey, req.Method, req.Caller,
		inputJSON, outputJSON, status, errMsg, int(duration.Milliseconds()), now, &now)
	if err != nil {
		slog.Error("service_registry: log invocation failed", "error", err)
	}
}
