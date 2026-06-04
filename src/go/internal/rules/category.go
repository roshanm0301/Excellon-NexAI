package rules

// RuleCategory is the canonical enterprise taxonomy used by the UI, evaluator,
// workflow rule tasks, and publish-time validation.
type RuleCategory string

const (
	RuleCategoryValidation            RuleCategory = "Validation"
	RuleCategoryApproval              RuleCategory = "Approval"
	RuleCategoryPricing               RuleCategory = "Pricing"
	RuleCategoryChargeDiscount        RuleCategory = "ChargeDiscount"
	RuleCategoryTaxation              RuleCategory = "Taxation"
	RuleCategoryAccounting            RuleCategory = "Accounting"
	RuleCategoryBusinessProcess       RuleCategory = "BusinessProcess"
	RuleCategoryEligibility           RuleCategory = "Eligibility"
	RuleCategoryFieldBehavior         RuleCategory = "FieldBehavior"
	RuleCategoryDerivationCalculation RuleCategory = "DerivationCalculation"
)

type CategoryConflictStrategy string

const (
	ConflictCollectFindings       CategoryConflictStrategy = "collect_findings"
	ConflictHighestApproval       CategoryConflictStrategy = "highest_approval"
	ConflictExplicitStacking      CategoryConflictStrategy = "explicit_stacking"
	ConflictBlockOnConflict       CategoryConflictStrategy = "block_on_conflict"
	ConflictOutcomePriority       CategoryConflictStrategy = "outcome_priority"
	ConflictMostRestrictive       CategoryConflictStrategy = "most_restrictive"
	ConflictFieldResolverRequired CategoryConflictStrategy = "field_resolver_required"
)

type BuilderKind string

const (
	BuilderConditionTree BuilderKind = "condition_tree"
	BuilderDecisionTable BuilderKind = "decision_table"
	BuilderDecisionGraph BuilderKind = "decision_graph"
)

type RuleCategoryMetadata struct {
	Category         RuleCategory             `json:"category"`
	Label            string                   `json:"label"`
	DefaultBuilder   BuilderKind              `json:"default_builder"`
	ConflictStrategy CategoryConflictStrategy `json:"conflict_strategy"`
	RuntimeBehavior  string                   `json:"runtime_behavior"`
}

var enterpriseRuleCategories = []RuleCategoryMetadata{
	{RuleCategoryValidation, "Validation Rules", BuilderDecisionTable, ConflictCollectFindings, "collect errors and warnings"},
	{RuleCategoryApproval, "Approval Rules", BuilderDecisionTable, ConflictHighestApproval, "produce approval requests"},
	{RuleCategoryPricing, "Pricing Rules", BuilderDecisionTable, ConflictExplicitStacking, "produce price outputs"},
	{RuleCategoryChargeDiscount, "Charge / Discount Rules", BuilderDecisionTable, ConflictExplicitStacking, "produce charges, discounts, and stacking decisions"},
	{RuleCategoryTaxation, "Taxation Rules", BuilderDecisionTable, ConflictBlockOnConflict, "produce tax outputs and block unresolved conflicts"},
	{RuleCategoryAccounting, "Accounting Rules", BuilderDecisionTable, ConflictBlockOnConflict, "produce accounting outputs and block unresolved conflicts"},
	{RuleCategoryBusinessProcess, "Business Process Rules", BuilderDecisionGraph, ConflictOutcomePriority, "produce workflow routing outcomes"},
	{RuleCategoryEligibility, "Eligibility Rules", BuilderDecisionTable, ConflictOutcomePriority, "produce eligibility decisions"},
	{RuleCategoryFieldBehavior, "Field Behavior Rules", BuilderDecisionTable, ConflictMostRestrictive, "produce UI field behavior"},
	{RuleCategoryDerivationCalculation, "Derivation / Calculation Rules", BuilderDecisionGraph, ConflictFieldResolverRequired, "produce calculated values"},
}

func EnterpriseRuleCategories() []RuleCategoryMetadata {
	out := make([]RuleCategoryMetadata, len(enterpriseRuleCategories))
	copy(out, enterpriseRuleCategories)
	return out
}

func NormalizeRuleCategory(category string) RuleCategory {
	switch RuleCategory(category) {
	case RuleCategoryValidation,
		RuleCategoryApproval,
		RuleCategoryPricing,
		RuleCategoryChargeDiscount,
		RuleCategoryTaxation,
		RuleCategoryAccounting,
		RuleCategoryBusinessProcess,
		RuleCategoryEligibility,
		RuleCategoryFieldBehavior,
		RuleCategoryDerivationCalculation:
		return RuleCategory(category)
	case "Derivation":
		return RuleCategoryDerivationCalculation
	case "FieldControl":
		return RuleCategoryFieldBehavior
	default:
		return RuleCategoryValidation
	}
}

func CategoryMetadata(category RuleCategory) RuleCategoryMetadata {
	for _, item := range enterpriseRuleCategories {
		if item.Category == category {
			return item
		}
	}
	return enterpriseRuleCategories[0]
}

func CategoryRequiresStrictConflictPolicy(category RuleCategory) bool {
	return category == RuleCategoryAccounting || category == RuleCategoryTaxation
}
