package retention

// RetentionPolicy describes the lifecycle configuration for an entity type.
type RetentionPolicy struct {
	PipelineMode  string // SIMPLE | ARCHIVE | GDPR
	RetentionDays int
	ArchiveDays   int
	PurgeDays     int
	LegalHold     bool
}

// Service resolves retention policies from compiled_artifact payload JSON.
type Service struct{}

func NewService() *Service {
	return &Service{}
}

// ResolvePolicy reads the retention config from a compiled artifact payload map.
func (s *Service) ResolvePolicy(compiledPayload map[string]any) RetentionPolicy {
	policy := RetentionPolicy{
		PipelineMode:  "SIMPLE",
		RetentionDays: 90,
		ArchiveDays:   365,
		PurgeDays:     730,
		LegalHold:     false,
	}

	ret, ok := compiledPayload["retention"]
	if !ok {
		return policy
	}
	retMap, ok := ret.(map[string]any)
	if !ok {
		return policy
	}

	if v, ok := retMap["pipeline_mode"].(string); ok && v != "" {
		policy.PipelineMode = v
	}
	if v, ok := retMap["retention_days"].(float64); ok {
		policy.RetentionDays = int(v)
	}
	if v, ok := retMap["archive_threshold_days"].(float64); ok {
		policy.ArchiveDays = int(v)
	}
	if v, ok := retMap["purge_days"].(float64); ok {
		policy.PurgeDays = int(v)
	}
	if v, ok := retMap["legal_hold"].(bool); ok {
		policy.LegalHold = v
	}

	return policy
}
