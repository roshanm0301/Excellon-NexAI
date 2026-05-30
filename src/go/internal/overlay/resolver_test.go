package overlay

import (
	"testing"
)

// ── deepMerge tests ───────────────────────────────────────────────────────────

func TestDeepMerge_AddField(t *testing.T) {
	base := map[string]any{
		"title": "Base Title",
		"color": "blue",
	}
	delta := map[string]any{
		"icon": "star",
	}

	result := deepMerge(base, delta)

	if result["title"] != "Base Title" {
		t.Errorf("title should be preserved: got %v", result["title"])
	}
	if result["color"] != "blue" {
		t.Errorf("color should be preserved: got %v", result["color"])
	}
	if result["icon"] != "star" {
		t.Errorf("icon should be added from delta: got %v", result["icon"])
	}
}

func TestDeepMerge_OverrideField(t *testing.T) {
	base := map[string]any{
		"display_name": "Customer",
		"color":        "red",
	}
	delta := map[string]any{
		"display_name": "Enterprise Customer",
	}

	result := deepMerge(base, delta)

	if result["display_name"] != "Enterprise Customer" {
		t.Errorf("delta should override base: got %v", result["display_name"])
	}
	if result["color"] != "red" {
		t.Errorf("non-overridden field should remain: got %v", result["color"])
	}
}

func TestDeepMerge_LayerPriority(t *testing.T) {
	// Simulate platform → vertical → tenant → node → role ordering
	platform := map[string]any{"value": "platform", "p_only": "platform"}
	vertical := map[string]any{"value": "vertical", "v_only": "vertical"}
	tenant := map[string]any{"value": "tenant", "t_only": "tenant"}
	node := map[string]any{"value": "node", "n_only": "node"}
	role := map[string]any{"value": "role", "r_only": "role"}

	result := deepMerge(platform, vertical)
	result = deepMerge(result, tenant)
	result = deepMerge(result, node)
	result = deepMerge(result, role)

	// Last layer (role) should win on the shared "value" key
	if result["value"] != "role" {
		t.Errorf("role layer should win, got %v", result["value"])
	}
	// Each layer's unique keys should be present
	for _, key := range []string{"p_only", "v_only", "t_only", "n_only", "r_only"} {
		if _, ok := result[key]; !ok {
			t.Errorf("key %q should be present from its layer", key)
		}
	}
}

func TestDeepMerge_ArrayReplacement(t *testing.T) {
	base := map[string]any{
		"options": []any{"a", "b", "c"},
	}
	delta := map[string]any{
		"options": []any{"x", "y"},
	}

	result := deepMerge(base, delta)

	opts, ok := result["options"].([]any)
	if !ok {
		t.Fatalf("options should be a slice, got %T", result["options"])
	}
	if len(opts) != 2 {
		t.Errorf("arrays should replace (not append): expected 2 items, got %d", len(opts))
	}
	if opts[0] != "x" || opts[1] != "y" {
		t.Errorf("array should be delta values [x, y], got %v", opts)
	}
}

func TestDeepMerge_NilDelta(t *testing.T) {
	base := map[string]any{
		"name": "test",
		"val":  42,
	}

	result := deepMerge(base, nil)

	if result["name"] != "test" {
		t.Errorf("name should be preserved with nil delta: got %v", result["name"])
	}
	if result["val"] != 42 {
		t.Errorf("val should be preserved with nil delta: got %v", result["val"])
	}
}

func TestDeepMerge_EmptyDelta(t *testing.T) {
	base := map[string]any{"name": "base"}
	result := deepMerge(base, map[string]any{})
	if result["name"] != "base" {
		t.Errorf("empty delta should return base unchanged, got %v", result["name"])
	}
}

func TestDeepMerge_NullValueDeletesKey(t *testing.T) {
	base := map[string]any{
		"keep":   "yes",
		"remove": "this",
	}
	delta := map[string]any{
		"remove": nil,
	}

	result := deepMerge(base, delta)

	if _, ok := result["remove"]; ok {
		t.Error("key with nil delta value should be deleted from result")
	}
	if result["keep"] != "yes" {
		t.Errorf("keep should remain: got %v", result["keep"])
	}
}

func TestDeepMerge_RecursiveMerge(t *testing.T) {
	base := map[string]any{
		"settings": map[string]any{
			"color":     "blue",
			"icon":      "circle",
			"font_size": 14,
		},
	}
	delta := map[string]any{
		"settings": map[string]any{
			"color": "red",
			"bold":  true,
		},
	}

	result := deepMerge(base, delta)

	settings, ok := result["settings"].(map[string]any)
	if !ok {
		t.Fatalf("settings should be a map, got %T", result["settings"])
	}
	if settings["color"] != "red" {
		t.Errorf("color should be overridden to red, got %v", settings["color"])
	}
	if settings["icon"] != "circle" {
		t.Errorf("icon should be preserved from base, got %v", settings["icon"])
	}
	if settings["bold"] != true {
		t.Errorf("bold should be added from delta, got %v", settings["bold"])
	}
	if settings["font_size"] != 14 {
		t.Errorf("font_size should be preserved, got %v", settings["font_size"])
	}
}

func TestDeepMerge_EmptyBase(t *testing.T) {
	base := map[string]any{}
	delta := map[string]any{"key": "value"}
	result := deepMerge(base, delta)
	if result["key"] != "value" {
		t.Errorf("key from delta should be in result, got %v", result["key"])
	}
}

// ── Resolver tests with mock ──────────────────────────────────────────────────
// The Resolver uses a DB pool that is difficult to mock without pgxmock.
// We test the deepMerge layer ordering logic directly as a proxy for Resolve behaviour,
// since Resolve just calls deepMerge in platform→vertical→tenant→node→role order.

func TestResolve_NoDeltas(t *testing.T) {
	// When no deltas exist, resolved result is an empty map (no overlay applied).
	// Simulate with empty base + no delta applications.
	result := deepMerge(map[string]any{}, map[string]any{})
	if len(result) != 0 {
		t.Errorf("empty base + empty delta should yield empty map, got %v", result)
	}
}

func TestResolve_TenantDelta(t *testing.T) {
	// Simulate applying a single tenant delta over an empty base
	base := map[string]any{}
	tenantDelta := map[string]any{
		"display_name": "Acme Corp View",
		"color":        "green",
	}
	result := deepMerge(base, tenantDelta)
	if result["display_name"] != "Acme Corp View" {
		t.Errorf("tenant delta not applied: %v", result["display_name"])
	}
}

func TestResolve_MultipleLayerDeltas(t *testing.T) {
	// Simulate the 5-layer resolution:  platform → vertical → tenant → node → role
	base := map[string]any{}

	platformDelta := map[string]any{"source": "platform", "shared": "platform_val", "p": 1}
	verticalDelta := map[string]any{"source": "vertical", "shared": "vertical_val", "v": 2}
	tenantDelta := map[string]any{"source": "tenant", "shared": "tenant_val", "t": 3}
	nodeDelta := map[string]any{"source": "node", "shared": "node_val", "n": 4}
	roleDelta := map[string]any{"source": "role", "shared": "role_val", "r": 5}

	result := deepMerge(base, platformDelta)
	result = deepMerge(result, verticalDelta)
	result = deepMerge(result, tenantDelta)
	result = deepMerge(result, nodeDelta)
	result = deepMerge(result, roleDelta)

	// Role layer should win
	if result["source"] != "role" {
		t.Errorf("role should win: got %v", result["source"])
	}
	if result["shared"] != "role_val" {
		t.Errorf("shared should be role_val: got %v", result["shared"])
	}
	// All layers' unique keys present
	for _, k := range []string{"p", "v", "t", "n", "r"} {
		if _, ok := result[k]; !ok {
			t.Errorf("key %q from its layer should be present", k)
		}
	}
}
