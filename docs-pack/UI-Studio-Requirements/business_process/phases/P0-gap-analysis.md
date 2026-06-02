# P0 — Gap Analysis

**Milestone:** M1
**Track:** Track 1 — Gap Analysis
**Implementation:** [docs/ui-studio/phases/P0-gap-analysis.md](../../ui-studio/phases/P0-gap-analysis.md)

---

## Business Goal

Understand what already exists in the codebase and what is missing before writing any code.

This phase produces the baseline understanding of current state vs. required state across all P0, P1, and P2 features. No code changes are made in this phase.

---

## Required Output

The gap analysis must produce the following for every P0, P1, and P2 feature:

| Field | Description |
|---|---|
| Feature code | e.g. P0-01, P1-32 |
| Feature name | Human-readable name |
| Priority | P0 / P1 / P2 |
| Current status | Existing / Partial / Missing |
| Existing files / tables / components | Where it lives today |
| Required changes | What needs to be added or modified |
| Risk | Low / Medium / High |
| Recommended implementation order | Sequence number |

---

## Required Skills

| Skill | Why Needed |
|---|---|
| Codebase analysis | Read and understand existing implementation |
| Product understanding | Know what P0/P1/P2 means for this system |
| Metadata-driven architecture | Identify gaps in metadata model |
| React / frontend architecture | Assess current frontend coverage |
| Backend / API understanding | Assess current API coverage |
| Database schema reading | Understand existing table structures |
| Documentation | Produce clear gap output for team |

---

## Codex Task Prompt

```
Analyze the current codebase for UI Studio.

Compare current implementation against P0, P1, P2 feature sets.

Create a gap analysis with:
- Feature code
- Feature name
- Priority
- Current status: Existing / Partial / Missing
- Existing files / tables / components
- Required changes
- Risk
- Recommended implementation order

Do not modify code in this task.
```

---

## Business Success Criteria

- Every P0, P1, and P2 feature has been classified
- Implementation team has a clear, prioritized starting point
- No assumptions made — only observed current state documented
- Output reviewed and signed off by BA team before Phase 1 begins

---

## BA Verification Checklist

- [ ] All 20 P0 features classified
- [ ] All 23 P1 features classified
- [ ] All 20 P2 features classified
- [ ] All 12 additional components classified
- [ ] Risk areas identified
- [ ] Implementation sequence agreed
- [ ] Output matches [implementation P0 file](../../ui-studio/phases/P0-gap-analysis.md) gap matrix
