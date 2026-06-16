package viewstudio

import (
	"encoding/json"
	"fmt"
	"regexp"
)

var viewCodePattern = regexp.MustCompile(`^[a-z][a-z0-9_]{2,49}$`)

// componentCodePattern matches canonical snake_case component codes: [a-z][a-z0-9_]*
var componentCodePattern = regexp.MustCompile(`^[a-z][a-z0-9_]*$`)

func validateCreateView(req CreateViewRequest) error {
	if req.ViewLabel == "" {
		return fmt.Errorf("view_label is required")
	}
	if len(req.ViewLabel) > 255 {
		return fmt.Errorf("view_label must be 255 characters or less")
	}
	if req.SurfaceType == "" {
		return fmt.Errorf("surface_type is required")
	}
	if !SurfaceType(req.SurfaceType).Valid() {
		return fmt.Errorf("invalid surface_type %q", req.SurfaceType)
	}
	if req.PrimaryEntity == "" {
		return fmt.Errorf("primary_entity is required")
	}
	if len(req.PrimaryEntity) > 100 {
		return fmt.Errorf("primary_entity must be 100 characters or less")
	}
	if req.ViewCode != "" && !viewCodePattern.MatchString(req.ViewCode) {
		return fmt.Errorf("view_code must match pattern: lowercase letters, digits, underscores; 3-50 chars; start with letter")
	}
	if req.ViewCategory != "" && len(req.ViewCategory) > 50 {
		return fmt.Errorf("view_category must be 50 characters or less")
	}
	return nil
}

// ─── Publish Validator ───────────────────────────────────────────────────────

// publishPayload is the minimal shape we inspect during publish validation.
type publishPayload struct {
	ComponentTree *componentNode `json:"component_tree"`
}

type componentNode struct {
	ComponentKey  string           `json:"component_key"`
	ComponentCode string           `json:"component_code"`
	Children      []*componentNode `json:"children"`
}

const maxPublishDepth = 20

// ValidatePublish validates a view payload before publishing.
// It returns a ValidationResult with structured errors and warnings.
// A non-nil error means the payload itself could not be parsed.
func ValidatePublish(rawPayload json.RawMessage) (ValidationResult, error) {
	result := ValidationResult{
		Errors:   []ValidationIssue{},
		Warnings: []ValidationIssue{},
	}

	// V001: payload must decode and have component_tree
	var payload publishPayload
	if err := json.Unmarshal(rawPayload, &payload); err != nil {
		return result, fmt.Errorf("viewstudio: invalid payload JSON: %w", err)
	}
	if payload.ComponentTree == nil {
		result.Errors = append(result.Errors, ValidationIssue{
			Code:    "V001",
			Message: "payload must contain a non-null component_tree",
			Field:   "component_tree",
		})
		return result, nil
	}

	root := payload.ComponentTree

	// V001 (cont): root component_code must be non-empty
	if root.ComponentCode == "" {
		result.Errors = append(result.Errors, ValidationIssue{
			Code:    "V001",
			Message: "component_tree root must have a non-empty component_code",
			Field:   "component_tree.component_code",
		})
	}

	// V002: root must be page_root
	if root.ComponentCode != "" && root.ComponentCode != "page_root" {
		result.Errors = append(result.Errors, ValidationIssue{
			Code:    "V002",
			Message: fmt.Sprintf(`root component must be "page_root", found %q`, root.ComponentCode),
			Field:   "component_tree.component_code",
		})
	}

	// V003 + V004 + V005: walk the tree
	seenKeys := make(map[string]bool)
	validateTree(root, &result, seenKeys, 0)

	return result, nil
}

func validateTree(node *componentNode, result *ValidationResult, seenKeys map[string]bool, depth int) {
	// V004: depth guard
	if depth > maxPublishDepth {
		result.Errors = append(result.Errors, ValidationIssue{
			Code:    "V004",
			Message: fmt.Sprintf("component tree exceeds maximum depth of %d", maxPublishDepth),
			Field:   node.ComponentKey,
		})
		return // stop recursing into this branch
	}

	// V003: component_code must be a non-empty string
	if node.ComponentCode == "" {
		result.Errors = append(result.Errors, ValidationIssue{
			Code:    "V003",
			Message: "all nodes must have a non-empty component_code",
			Field:   node.ComponentKey,
		})
	}

	// V005: component_code must match snake_case pattern
	if node.ComponentCode != "" && !componentCodePattern.MatchString(node.ComponentCode) {
		result.Errors = append(result.Errors, ValidationIssue{
			Code:    "V005",
			Message: fmt.Sprintf("component_code %q does not match snake_case pattern [a-z][a-z0-9_]*", node.ComponentCode),
			Field:   node.ComponentKey,
		})
	}

	// Duplicate key detection (warning — keys must be unique within a tree)
	if node.ComponentKey != "" {
		if seenKeys[node.ComponentKey] {
			result.Warnings = append(result.Warnings, ValidationIssue{
				Code:    "V003",
				Message: fmt.Sprintf("duplicate component_key %q found in tree", node.ComponentKey),
				Field:   node.ComponentKey,
			})
		}
		seenKeys[node.ComponentKey] = true
	}

	for _, child := range node.Children {
		if child != nil {
			validateTree(child, result, seenKeys, depth+1)
		}
	}
}
