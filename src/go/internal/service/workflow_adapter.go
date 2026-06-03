package service

import (
	"context"

	"github.com/excellon/nexai/internal/business_workflow"
)

// WorkflowServiceAdapter bridges the service.Registry to the
// business_workflow.ServiceInvoker interface.
type WorkflowServiceAdapter struct {
	registry *Registry
}

// NewWorkflowServiceAdapter creates an adapter for use by the DAG executor.
func NewWorkflowServiceAdapter(registry *Registry) *WorkflowServiceAdapter {
	return &WorkflowServiceAdapter{registry: registry}
}

// Invoke satisfies business_workflow.ServiceInvoker.
func (a *WorkflowServiceAdapter) Invoke(ctx context.Context, req *business_workflow.ServiceInvokeRequest) (*business_workflow.ServiceInvokeResponse, error) {
	resp, err := a.registry.Invoke(ctx, &InvokeRequest{
		ServiceKey: req.ServiceKey,
		Method:     req.Method,
		TenantID:   req.TenantID,
		Caller:     req.Caller,
		Input:      req.Input,
	})
	if err != nil {
		return nil, err
	}
	return &business_workflow.ServiceInvokeResponse{
		Success: resp.Success,
		Output:  resp.Output,
		Error:   resp.Error,
	}, nil
}
