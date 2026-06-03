package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// HTTPAdapter handles invoking external HTTP services.
type HTTPAdapter struct {
	client *http.Client
}

// NewHTTPAdapter creates an HTTPAdapter with sensible defaults.
func NewHTTPAdapter() *HTTPAdapter {
	return &HTTPAdapter{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Invoke calls an external HTTP service based on its registration config.
func (a *HTTPAdapter) Invoke(ctx context.Context, reg *ServiceRegistration, req *InvokeRequest) (*InvokeResponse, error) {
	cfg, err := a.parseConfig(reg.Config)
	if err != nil {
		return &InvokeResponse{Success: false, Error: fmt.Sprintf("invalid service config: %v", err)}, nil
	}

	// Build the URL: baseUrl + "/" + method
	url := cfg.BaseURL
	if req.Method != "" {
		url = url + "/" + req.Method
	}

	// Marshal input as JSON body
	var body io.Reader
	if req.Input != nil {
		bodyBytes, err := json.Marshal(req.Input)
		if err != nil {
			return &InvokeResponse{Success: false, Error: fmt.Sprintf("marshal input: %v", err)}, nil
		}
		body = bytes.NewReader(bodyBytes)
	}

	// Build HTTP request
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, body)
	if err != nil {
		return &InvokeResponse{Success: false, Error: fmt.Sprintf("build request: %v", err)}, nil
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")

	// Apply static headers
	for k, v := range cfg.Headers {
		httpReq.Header.Set(k, v)
	}

	// Apply auth
	a.applyAuth(httpReq, cfg.Auth)

	// Set timeout from config if specified
	if cfg.Timeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, time.Duration(cfg.Timeout)*time.Millisecond)
		defer cancel()
		httpReq = httpReq.WithContext(ctx)
	}

	// Execute
	httpResp, err := a.client.Do(httpReq)
	if err != nil {
		return &InvokeResponse{Success: false, Error: fmt.Sprintf("http call failed: %v", err)}, nil
	}
	defer httpResp.Body.Close()

	// Read response body (limit to 1MB)
	respBody, err := io.ReadAll(io.LimitReader(httpResp.Body, 1<<20))
	if err != nil {
		return &InvokeResponse{Success: false, Error: fmt.Sprintf("read response: %v", err)}, nil
	}

	// Parse response
	var output map[string]any
	if len(respBody) > 0 {
		json.Unmarshal(respBody, &output) //nolint — best-effort parse
	}

	if httpResp.StatusCode >= 200 && httpResp.StatusCode < 300 {
		return &InvokeResponse{
			Success: true,
			Output:  output,
		}, nil
	}

	errMsg := fmt.Sprintf("HTTP %d", httpResp.StatusCode)
	if output != nil {
		if msg, ok := output["error"].(string); ok {
			errMsg = msg
		} else if msg, ok := output["message"].(string); ok {
			errMsg = msg
		}
	}

	return &InvokeResponse{
		Success: false,
		Output:  output,
		Error:   errMsg,
	}, nil
}

// parseConfig unmarshals the JSON config into HTTPServiceConfig.
func (a *HTTPAdapter) parseConfig(raw json.RawMessage) (*HTTPServiceConfig, error) {
	if raw == nil || len(raw) == 0 {
		return nil, fmt.Errorf("empty config")
	}
	var cfg HTTPServiceConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return nil, err
	}
	if cfg.BaseURL == "" {
		return nil, fmt.Errorf("baseUrl is required")
	}
	return &cfg, nil
}

// applyAuth sets authentication headers on the request.
func (a *HTTPAdapter) applyAuth(req *http.Request, auth *HTTPAuthConfig) {
	if auth == nil {
		return
	}
	switch auth.Type {
	case "bearer":
		if auth.Token != "" {
			req.Header.Set("Authorization", "Bearer "+auth.Token)
		}
	case "basic":
		// Token should be base64-encoded "user:pass"
		if auth.Token != "" {
			req.Header.Set("Authorization", "Basic "+auth.Token)
		}
	case "api_key":
		header := auth.Header
		if header == "" {
			header = "X-API-Key"
		}
		if auth.Value != "" {
			req.Header.Set(header, auth.Value)
		}
	}
}
