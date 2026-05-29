package overlay

// deepMerge merges delta over base recursively.
// - For nested maps: recurse
// - Delta key with null value: delete key from result
// - Arrays: delta array replaces base array (no recursive merge)
func deepMerge(base, delta map[string]any) map[string]any {
	result := make(map[string]any, len(base))
	for k, v := range base {
		result[k] = v
	}
	for k, v := range delta {
		if v == nil {
			delete(result, k)
			continue
		}
		baseVal, exists := result[k]
		if exists {
			baseMap, baseIsMap := baseVal.(map[string]any)
			deltaMap, deltaIsMap := v.(map[string]any)
			if baseIsMap && deltaIsMap {
				result[k] = deepMerge(baseMap, deltaMap)
				continue
			}
		}
		result[k] = v
	}
	return result
}
