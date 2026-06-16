package nodestudio

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

type Repo struct {
	pool *db.Pool
}

func NewRepo(pool *db.Pool) *Repo {
	return &Repo{pool: pool}
}

func (r *Repo) List(ctx context.Context, tenantID string) ([]Node, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT node_id::text, tenant_id, COALESCE(parent_id::text, ''), name, node_type,
		       COALESCE(metadata, '{}'::jsonb), created_at, updated_at, COALESCE(created_by, '')
		FROM studio_node
		WHERE tenant_id = $1
		ORDER BY parent_id NULLS FIRST, name`, tenantID)
	if err != nil {
		return nil, fmt.Errorf("nodestudio: list nodes: %w", err)
	}
	defer rows.Close()

	var nodes []Node
	for rows.Next() {
		var node Node
		if err := rows.Scan(
			&node.ID,
			&node.TenantID,
			&node.ParentID,
			&node.Name,
			&node.NodeType,
			&node.Metadata,
			&node.CreatedAt,
			&node.UpdatedAt,
			&node.CreatedBy,
		); err != nil {
			return nil, fmt.Errorf("nodestudio: scan node: %w", err)
		}
		nodes = append(nodes, node)
	}
	if nodes == nil {
		nodes = []Node{}
	}
	return nodes, rows.Err()
}

func (r *Repo) Create(ctx context.Context, tenantID, userID string, req CreateNodeRequest) (*Node, error) {
	metadata := req.Metadata
	if len(metadata) == 0 {
		metadata = json.RawMessage(`{}`)
	}

	nodeID := idgen.NewV4()
	now := time.Now().UTC()

	var node Node
	err := r.pool.QueryRow(ctx, `
		INSERT INTO studio_node (node_id, tenant_id, name, node_type, parent_id, metadata, created_at, updated_at, created_by)
		VALUES ($1, $2, $3, $4, NULLIF($5, '')::uuid, $6, $7, $7, $8)
		RETURNING node_id::text, tenant_id, COALESCE(parent_id::text, ''), name, node_type,
		          COALESCE(metadata, '{}'::jsonb), created_at, updated_at, COALESCE(created_by, '')`,
		nodeID, tenantID, req.Name, req.NodeType, req.ParentID, metadata, now, userID,
	).Scan(
		&node.ID,
		&node.TenantID,
		&node.ParentID,
		&node.Name,
		&node.NodeType,
		&node.Metadata,
		&node.CreatedAt,
		&node.UpdatedAt,
		&node.CreatedBy,
	)
	if err != nil {
		return nil, fmt.Errorf("nodestudio: create node: %w", err)
	}
	return &node, nil
}
