package entityruntime

import (
	"context"
	"log/slog"

	"github.com/excellon/nexai/internal/compiler"
)

// expressionEngine is an interface to avoid a direct import cycle with the expression package.
type expressionEngine interface {
	Evaluate(ctx context.Context, expr string, data map[string]any) (any, error)
}

// EvaluateComputedFields augments payload with values from computed fields in the schema.
// Returns a copy of payload with computed values added; does not mutate the input.
func EvaluateComputedFields(ctx context.Context, eng expressionEngine, payload map[string]any, schema *compiler.CompiledSchema) map[string]any {
	if eng == nil || schema == nil || len(schema.Fields) == 0 {
		return payload
	}

	augmented := make(map[string]any, len(payload))
	for k, v := range payload {
		augmented[k] = v
	}

	for _, field := range schema.Fields {
		if field.Expression == "" {
			continue
		}
		result, err := eng.Evaluate(ctx, field.Expression, augmented)
		if err != nil {
			slog.Warn("computed field evaluation failed",
				"field", field.Key, "expr", field.Expression, "error", err)
			continue
		}
		augmented[field.Key] = result
	}

	return augmented
}
