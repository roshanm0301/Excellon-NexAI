package service

import (
	"context"
	"encoding/json"
	"time"
)

// Transport defines how a service is invoked.
type Transport string

const (
	TransportInternal Transport = "internal" // In-process Go interface call
	TransportHTTP     Transport = "http"     // External HTTP endpoint
	TransportGRPC     Transport = "grpc"     // Future: gRPC endpoint
)

// InvokeRequest is the standard input to any service invocation.
type InvokeRequest struct {
	ServiceKey string         `json:"serviceKey"`
	Method     string         `json:"method"`
	TenantID   string         `json:"tenantId"`
	Caller     string         `json:"caller,omitempty"` // Who initiated (workflow step ID, rule key, etc.)
	Input      map[string]any `json:"input"`
}

// InvokeResponse is the standard output from any service invocation.
type InvokeResponse struct {
	Success  bool           `json:"success"`
	Output   map[string]any `json:"output,omitempty"`
	Error    string         `json:"error,omitempty"`
	Duration time.Duration  `json:"-"`
}

// Service is the core interface that all services implement.
// This is defined at the consumption site (per Go conventions).
type Service interface {
	// Key returns the unique identifier for this service.
	Key() string

	// Methods returns the list of supported methods.
	Methods() []string

	// Invoke executes a service method with the given input.
	Invoke(ctx context.Context, method string, input map[string]any) (*InvokeResponse, error)
}

// ServiceRegistration is the persisted metadata about a registered service.
type ServiceRegistration struct {
	ID          string          `json:"id"`
	TenantID    string          `json:"tenantId"`
	ServiceKey  string          `json:"serviceKey"`
	Name        string          `json:"name"`
	Description string          `json:"description,omitempty"`
	Transport   Transport       `json:"transport"`
	Config      json.RawMessage `json:"config"`
	Enabled     bool            `json:"enabled"`
	CreatedBy   string          `json:"createdBy"`
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
}

// HTTPServiceConfig is the configuration for HTTP-transport services.
type HTTPServiceConfig struct {
	BaseURL string            `json:"baseUrl"`
	Headers map[string]string `json:"headers,omitempty"` // Static headers
	Timeout int               `json:"timeout,omitempty"` // Milliseconds, default 30000
	Auth    *HTTPAuthConfig   `json:"auth,omitempty"`
}

// HTTPAuthConfig defines authentication for HTTP services.
type HTTPAuthConfig struct {
	Type   string `json:"type"`             // "bearer", "basic", "api_key"
	Token  string `json:"token,omitempty"`  // For bearer
	Header string `json:"header,omitempty"` // For api_key: which header
	Value  string `json:"value,omitempty"`  // For api_key: the key value
}

// InvocationLog records a service invocation for audit/debugging.
type InvocationLog struct {
	ID           string          `json:"id"`
	TenantID     string          `json:"tenantId"`
	ServiceKey   string          `json:"serviceKey"`
	Method       string          `json:"method"`
	Caller       string          `json:"caller"`
	InputData    json.RawMessage `json:"inputData,omitempty"`
	OutputData   json.RawMessage `json:"outputData,omitempty"`
	Status       string          `json:"status"` // "success", "error", "timeout"
	ErrorMessage string          `json:"errorMessage,omitempty"`
	DurationMs   int             `json:"durationMs"`
	CreatedAt    time.Time       `json:"createdAt"`
	CompletedAt  *time.Time      `json:"completedAt,omitempty"`
}
