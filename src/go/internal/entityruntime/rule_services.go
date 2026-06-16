package entityruntime

import (
	"context"
	"fmt"
	"strings"

	"github.com/excellon/nexai/internal/service"
)

func (h *Handler) executeRuleServiceInvocations(ctx context.Context, tenantID, entityType, entityID string, result *EvalResultV2) error {
	if result == nil || len(result.ServiceInvocations) == 0 {
		return nil
	}
	for _, invocation := range result.ServiceInvocations {
		method := ServiceMethod(invocation.Method, invocation.Params)
		policy := FailurePolicy("block", invocation.Params)
		entry := ServiceInvocationResult{
			ServiceKey: invocation.ServiceKey,
			Method:     method,
			RuleKey:    invocation.RuleKey,
		}

		if strings.TrimSpace(invocation.ServiceKey) == "" {
			entry.Error = "service_key is required"
			result.ServiceResults = append(result.ServiceResults, entry)
			if ShouldBlockOnFailure(policy) {
				return fmt.Errorf("rule service invocation failed: %s", entry.Error)
			}
			continue
		}
		if h.policy == nil || h.policy.serviceInvoker == nil {
			entry.Error = "service registry is not wired"
			result.ServiceResults = append(result.ServiceResults, entry)
			if ShouldBlockOnFailure(policy) {
				return fmt.Errorf("rule service invocation failed: %s", entry.Error)
			}
			continue
		}

		resp, err := h.policy.serviceInvoker.Invoke(ctx, &service.InvokeRequest{
			ServiceKey: invocation.ServiceKey,
			Method:     method,
			TenantID:   tenantID,
			Caller:     fmt.Sprintf("rule:%s:entity:%s/%s", invocation.RuleKey, entityType, entityID),
			Input:      ServiceInput(invocation.Params),
		})
		if err != nil {
			entry.Error = err.Error()
			result.ServiceResults = append(result.ServiceResults, entry)
			if ShouldBlockOnFailure(policy) {
				return fmt.Errorf("rule service invocation failed: %w", err)
			}
			continue
		}
		entry.Success = resp.Success
		entry.Output = resp.Output
		entry.Error = resp.Error
		result.ServiceResults = append(result.ServiceResults, entry)
		if !resp.Success && ShouldBlockOnFailure(policy) {
			if entry.Error == "" {
				entry.Error = "service returned an unsuccessful response"
			}
			return fmt.Errorf("rule service invocation failed: %s", entry.Error)
		}
	}
	return nil
}
