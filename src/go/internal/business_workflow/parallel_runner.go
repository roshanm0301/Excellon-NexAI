package business_workflow

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/expression"
)

// ParallelRunner executes multiple DAG branches concurrently using sync.WaitGroup.
type ParallelRunner struct {
	pool   *db.Pool
	expr   *expression.Engine
	logger *ExecutionLogger
}

// NewParallelRunner constructs a ParallelRunner.
func NewParallelRunner(pool *db.Pool, expr *expression.Engine, logger *ExecutionLogger) *ParallelRunner {
	return &ParallelRunner{pool: pool, expr: expr, logger: logger}
}

// BranchResult captures the outcome of a single parallel branch execution.
type BranchResult struct {
	NodeID string
	Output map[string]any
	Error  error
	Status NodeStatus
}

// ExecuteParallelBranches runs multiple node step functions concurrently and collects results.
// Each stepFn is responsible for executing a single node and returning its output.
func (pr *ParallelRunner) ExecuteParallelBranches(ctx context.Context, nodeIDs []string, stepFn func(ctx context.Context, nodeID string) (map[string]any, error)) []BranchResult {
	results := make([]BranchResult, len(nodeIDs))
	var wg sync.WaitGroup

	for i, nodeID := range nodeIDs {
		wg.Add(1)
		go func(idx int, nid string) {
			defer wg.Done()
			defer func() {
				if r := recover(); r != nil {
					results[idx] = BranchResult{
						NodeID: nid,
						Error:  fmt.Errorf("panic in branch %s: %v", nid, r),
						Status: NodeFailed,
					}
				}
			}()

			output, err := stepFn(ctx, nid)
			if err != nil {
				results[idx] = BranchResult{
					NodeID: nid,
					Error:  err,
					Status: NodeFailed,
				}
			} else {
				results[idx] = BranchResult{
					NodeID: nid,
					Output: output,
					Status: NodeCompleted,
				}
			}
		}(i, nodeID)
	}

	wg.Wait()
	return results
}

// ApplyBranchResults updates the DAGState with results from parallel execution.
func (pr *ParallelRunner) ApplyBranchResults(state *DAGState, results []BranchResult) {
	for _, r := range results {
		ns := state.NodeStates[r.NodeID]
		if ns == nil {
			continue
		}

		nowMs := time.Now().UnixMilli()
		ns.CompletedAt = &nowMs

		switch r.Status {
		case NodeCompleted:
			ns.Status = NodeCompleted
			ns.Output = r.Output
			state.CompletedNodes = append(state.CompletedNodes, r.NodeID)
			// Merge output into variables
			for k, v := range r.Output {
				state.Variables[k] = v
			}

		case NodeFailed:
			ns.Status = NodeFailed
			if r.Error != nil {
				ns.Error = r.Error.Error()
			}

		default:
			ns.Status = r.Status
		}

		state.ActiveNodes = removeFromSlice(state.ActiveNodes, r.NodeID)
	}
}

// ExecuteParallelGateway handles a parallel split gateway: activates all targets and executes them concurrently.
func (pr *ParallelRunner) ExecuteParallelGateway(ctx context.Context, tenantID string, dag *DAGDefinition, state *DAGState, gatewayID string, execFn func(ctx context.Context, nodeID string) (map[string]any, error)) error {
	// Find outgoing edges from gateway
	var targetNodeIDs []string
	for _, edge := range dag.Edges {
		if edge.Source == gatewayID {
			targetNodeIDs = append(targetNodeIDs, edge.Target)
		}
	}

	if len(targetNodeIDs) == 0 {
		slog.Warn("parallel_runner: no targets for gateway", "gateway", gatewayID)
		return nil
	}

	// Mark all targets as running
	for _, nid := range targetNodeIDs {
		ns := state.NodeStates[nid]
		if ns != nil {
			nowMs := time.Now().UnixMilli()
			ns.Status = NodeRunning
			ns.StartedAt = &nowMs
			state.ActiveNodes = append(state.ActiveNodes, nid)
		}
	}

	// Execute in parallel
	results := pr.ExecuteParallelBranches(ctx, targetNodeIDs, execFn)

	// Apply results
	pr.ApplyBranchResults(state, results)

	// Log results
	for _, r := range results {
		status := "completed"
		var outputData map[string]any
		if r.Error != nil {
			status = "failed"
			outputData = map[string]any{"error": r.Error.Error()}
		} else {
			outputData = r.Output
		}
		pr.logger.LogAsync(ctx, tenantID, "", r.NodeID, "", status, nil, outputData)
	}

	return nil
}

// WaitForJoin checks if a parallel join gateway has all its incoming branches completed.
func (pr *ParallelRunner) WaitForJoin(dag *DAGDefinition, state *DAGState, joinGatewayID string, policy string) bool {
	// Find all incoming edges to this gateway
	var sourceNodeIDs []string
	for _, edge := range dag.Edges {
		if edge.Target == joinGatewayID {
			sourceNodeIDs = append(sourceNodeIDs, edge.Source)
		}
	}

	if len(sourceNodeIDs) == 0 {
		return true
	}

	switch policy {
	case "any":
		// At least one source is completed
		for _, nid := range sourceNodeIDs {
			ns := state.NodeStates[nid]
			if ns != nil && (ns.Status == NodeCompleted || ns.Status == NodeSkipped) {
				return true
			}
		}
		return false

	default: // "all"
		return state.AllNodesInStatus(sourceNodeIDs, NodeCompleted, NodeSkipped, NodeFailed)
	}
}
