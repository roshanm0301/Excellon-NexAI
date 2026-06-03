package business_workflow

// DAG model for workflow definitions — supports parallel branches, gateways, and conditional routing.

// GatewayType controls flow splitting/joining behavior.
type GatewayType string

const (
	GatewayParallel  GatewayType = "parallel"  // All outgoing branches execute concurrently
	GatewayExclusive GatewayType = "exclusive" // First matching condition wins
	GatewayInclusive GatewayType = "inclusive" // All matching conditions execute
)

// DAGNode represents a single node in the workflow graph.
type DAGNode struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Type        StepType          `json:"type"`
	Config      map[string]any    `json:"config,omitempty"`      // Step-type-specific configuration
	TimeoutMins int               `json:"timeoutMins,omitempty"` // 0 = no timeout
	RetryCount  int               `json:"retryCount,omitempty"`  // For automated steps
	Metadata    map[string]string `json:"metadata,omitempty"`    // UI positioning, labels
}

// DAGEdge represents a directed edge between two nodes.
type DAGEdge struct {
	ID        string `json:"id"`
	Source    string `json:"source"`              // Source node ID
	Target    string `json:"target"`              // Target node ID
	Condition string `json:"condition,omitempty"` // JSONata expression — empty = unconditional
	Label     string `json:"label,omitempty"`     // Display label for the edge
	Priority  int    `json:"priority,omitempty"`  // For exclusive gateways: lower = higher priority
}

// DAGGateway defines a split or join point in the workflow.
type DAGGateway struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Type        GatewayType `json:"type"`
	IsJoin      bool        `json:"isJoin"`               // true = join (wait for incoming), false = split
	JoinPolicy  string      `json:"joinPolicy,omitempty"` // "all" (default) or "any" for inclusive joins
}

// DAGDefinition is the complete workflow graph persisted in process_definition.dag_definition.
type DAGDefinition struct {
	StartNodeID string       `json:"startNodeId"`
	EndNodeID   string       `json:"endNodeId,omitempty"`  // Optional explicit end node
	Nodes       []DAGNode    `json:"nodes"`
	Edges       []DAGEdge    `json:"edges"`
	Gateways    []DAGGateway `json:"gateways,omitempty"`
}

// NodeState tracks execution status of an individual node within a running instance.
type NodeState struct {
	NodeID      string         `json:"nodeId"`
	Status      NodeStatus     `json:"status"`
	StartedAt   *int64         `json:"startedAt,omitempty"`   // Unix ms
	CompletedAt *int64         `json:"completedAt,omitempty"` // Unix ms
	Output      map[string]any `json:"output,omitempty"`
	Error       string         `json:"error,omitempty"`
	RetryLeft   int            `json:"retryLeft,omitempty"`
}

// NodeStatus represents the execution state of a DAG node.
type NodeStatus string

const (
	NodePending   NodeStatus = "pending"
	NodeReady     NodeStatus = "ready"     // All predecessors satisfied
	NodeRunning   NodeStatus = "running"
	NodeCompleted NodeStatus = "completed"
	NodeFailed    NodeStatus = "failed"
	NodeSkipped   NodeStatus = "skipped"
	NodeWaiting   NodeStatus = "waiting"   // Waiting for external input (approval, human task)
)

// DAGState is the runtime state persisted in process_instance.dag_state.
type DAGState struct {
	NodeStates     map[string]*NodeState `json:"nodeStates"`
	ActiveNodes    []string              `json:"activeNodes"`    // Currently executing/waiting node IDs
	CompletedNodes []string              `json:"completedNodes"` // Already finished
	Variables      map[string]any        `json:"variables"`      // Workflow-scoped variables accumulated during execution
}

// NewDAGState initializes a fresh DAGState for a given DAG definition.
func NewDAGState(dag *DAGDefinition) *DAGState {
	states := make(map[string]*NodeState, len(dag.Nodes)+len(dag.Gateways))
	for _, n := range dag.Nodes {
		states[n.ID] = &NodeState{NodeID: n.ID, Status: NodePending}
	}
	for _, g := range dag.Gateways {
		states[g.ID] = &NodeState{NodeID: g.ID, Status: NodePending}
	}
	// Mark start node as ready
	if dag.StartNodeID != "" {
		if s, ok := states[dag.StartNodeID]; ok {
			s.Status = NodeReady
		}
	}
	return &DAGState{
		NodeStates:     states,
		ActiveNodes:    []string{},
		CompletedNodes: []string{},
		Variables:      map[string]any{},
	}
}

// IsTerminal returns true if no more nodes can be executed.
func (ds *DAGState) IsTerminal() bool {
	for _, ns := range ds.NodeStates {
		switch ns.Status {
		case NodePending, NodeReady, NodeRunning, NodeWaiting:
			return false
		}
	}
	return true
}

// AllNodesInStatus checks if all node IDs are in one of the given statuses.
func (ds *DAGState) AllNodesInStatus(nodeIDs []string, statuses ...NodeStatus) bool {
	statusSet := make(map[NodeStatus]bool, len(statuses))
	for _, s := range statuses {
		statusSet[s] = true
	}
	for _, id := range nodeIDs {
		ns, ok := ds.NodeStates[id]
		if !ok || !statusSet[ns.Status] {
			return false
		}
	}
	return true
}
