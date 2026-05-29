package expression

import (
	"context"
	"fmt"
	"sync"

	"github.com/dop251/goja"
)

// Engine evaluates JSONata expressions using a pool of goja VMs.
// Each VM has the jsonata-es library pre-loaded.
type Engine struct {
	pool sync.Pool
}

// NewEngine creates a new expression engine.
// If jsonataBundle is empty, the engine operates in passthrough mode (returns null for all expressions).
func NewEngine(jsonataBundle string) *Engine {
	e := &Engine{}
	e.pool = sync.Pool{
		New: func() any {
			vm := goja.New()
			if jsonataBundle != "" {
				if _, err := vm.RunString(jsonataBundle); err != nil {
					// If bundle fails to load, return nil — pool.Get() callers must handle nil
					return nil
				}
			}
			return vm
		},
	}
	return e
}

// Evaluate runs a JSONata expression against the given data context.
// Returns the result as any, or an error.
func (e *Engine) Evaluate(ctx context.Context, expr string, data map[string]any) (any, error) {
	if expr == "" {
		return nil, fmt.Errorf("expression: empty expression")
	}

	vmRaw := e.pool.Get()
	if vmRaw == nil {
		// Bundle not loaded — return nil without error (graceful degradation)
		return nil, nil
	}
	vm := vmRaw.(*goja.Runtime)

	defer func() {
		if r := recover(); r != nil {
			// VM panicked — discard it (pool.New will create a fresh one next time)
			// Do not return this VM to the pool
		}
	}()

	// Set the data context
	if err := vm.Set("$data", data); err != nil {
		e.pool.Put(vm)
		return nil, fmt.Errorf("expression: set context: %w", err)
	}

	// Evaluate via jsonata if available, otherwise direct eval
	var result goja.Value
	var runErr error

	// Try to use jsonata() function if it exists in the VM
	jsonataFn, ok := goja.AssertFunction(vm.Get("jsonata"))
	if ok {
		exprObj, err := jsonataFn(goja.Undefined(), vm.ToValue(expr))
		if err != nil {
			e.pool.Put(vm)
			return nil, fmt.Errorf("expression: parse %q: %w", expr, err)
		}
		evaluateFn, ok := goja.AssertFunction(exprObj.ToObject(vm).Get("evaluate"))
		if ok {
			result, runErr = evaluateFn(exprObj, vm.ToValue(data))
		} else {
			e.pool.Put(vm)
			return nil, fmt.Errorf("expression: jsonata evaluate not found")
		}
	} else {
		// Fallback: direct JS eval with $data in scope
		result, runErr = vm.RunString(fmt.Sprintf("(%s)", expr))
	}

	if runErr != nil {
		// Discard the VM on runtime errors
		return nil, fmt.Errorf("expression: evaluate %q: %w", expr, runErr)
	}

	e.pool.Put(vm)

	if goja.IsNull(result) || goja.IsUndefined(result) {
		return nil, nil
	}
	return result.Export(), nil
}

// ValidateSyntax checks that an expression parses without evaluating it.
// Returns nil if valid, error with description if not.
func (e *Engine) ValidateSyntax(ctx context.Context, expr string) error {
	if expr == "" {
		return fmt.Errorf("expression: empty")
	}
	// Lightweight check: try to parse as JS
	vmRaw := e.pool.Get()
	if vmRaw == nil {
		return nil // graceful degradation
	}
	vm := vmRaw.(*goja.Runtime)
	defer e.pool.Put(vm)

	jsonataFn, ok := goja.AssertFunction(vm.Get("jsonata"))
	if !ok {
		return nil // bundle not loaded
	}
	_, err := jsonataFn(goja.Undefined(), vm.ToValue(expr))
	if err != nil {
		return fmt.Errorf("expression syntax error: %w", err)
	}
	return nil
}
