# PRD: WORKFLOW-ENGINE.md — Workflow Engine & Business Workflow Engine

> **Source documents:** 06-workflow-engine.md, 07-business-workflow-engine.md
> **Read also:** RULES-ENGINE.md, ENTITY-DESIGNER.md

---

## Part 1 — Workflow Engine (Status State Machine)

### What It Is

The Workflow Engine manages entity **status transitions**. It defines the states an entity can be in, the transitions between states, the role guards and rule guards that gate transitions, and the SLA tracking and human task creation that happen on transition.

Workflow definitions are stored as `WorkflowGraph` artifacts and linked to entity schemas via `workflow_key`.

---

### State Machine Model

```go
// WorkflowDef — the compiled workflow definition
type WorkflowDef struct {
    WorkflowKey string
    States      []StateDef
    Transitions []TransitionDef
    SLAConfig   *SLAConfig
}

type StateDef struct {
    Key       string
    Label     string
    Initial   bool
    Terminal  bool
    SLAHours  int
}

type TransitionDef struct {
    From       string
    To         string
    Command    string   // e.g. "approve", "reject", "close"
    RoleGuards []string // roles allowed to execute this transition
    RuleGuards []string // rule set keys that must pass (no BLOCK)
    Actions    []TransitionAction
}

type TransitionAction struct {
    Type    string  // notify | create_task | set_field | run_process
    Payload map[string]any
}
```

---

### Transition Execution — 7 Steps

**File:** `src/go/internal/workflow/production_runtime.go`

```
RunTransition(ctx, entityType, entityID, command, actorUserID, actorRole)
```

1. **Load compiled schema** — from `compiled_artifact`; find transition matching `command` from current `status`
2. **Validate transition exists** — no matching transition → HTTP 400 `entity.invalid_transition`
3. **Role guard** — if `RoleGuards` non-empty and actor role not in list → HTTP 403 `entity.workflow_guard_failed`
4. **Load latest entity record** — current status from `entity_record`
5. **Evaluate rule guards** — `rulesEval.EvaluateRules()` for each `RuleGuards` entry; any BLOCK → HTTP 403
6. **Execute transition** — UPDATE `entity_record.status` to new state; increment `version_no`
7. **Post-transition actions** (fire-and-forget goroutine):
   - Insert `workflow_transition_log` entry
   - Create SLA record if new state has `SLAHours` configured
   - Create human tasks if `Actions` include `create_task`
   - Send notifications if `Actions` include `notify`
   - Fire outbox event

**Rule for `entity_record.status`:** Only the Workflow Engine's `RunTransition` may update this field. Application code must never UPDATE status directly.

---

### SLA Tracking

```go
type SLAConfig struct {
    DefaultSLAHours int
    EscalationRole  string
    EscalationRules []string  // rule set keys to evaluate for escalation
}
```

SLA worker (`sla_worker.go`) runs as a background goroutine:
- Polls `workflow_sla_tracking` for overdue entries
- On breach: evaluates escalation rules, fires escalation notifications
- Frequency: configurable, default 5 minutes

---

### Human Tasks

```go
type HumanTask struct {
    TaskID        string
    TenantID      string
    EntityType    string
    EntityID      string
    TaskKey       string
    Title         string        // Template: "Review {entity.display_id}"
    AssigneeRole  string
    DueAt         time.Time
    Status        string        // pending | completed | overdue
    CompletedBy   string
    CompletedAt   *time.Time
    Outcome       string        // approved | rejected | etc.
}
```

Tasks are created by `create_task` transition actions. Completing a task can trigger a workflow transition automatically if configured.

---

### Parallel Approvals

The workflow engine supports parallel approval steps where multiple approvers must act before the workflow proceeds:

```json
{
  "type": "parallel_approval",
  "approvers": ["MANAGER", "FINANCE"],
  "required_count": 2,
  "next_state": "APPROVED"
}
```

All required approvals must complete before the state transitions. Partial approvals are stored in `workflow_parallel_approval`.

---

### Database Tables

| Table | Purpose |
|-------|---------|
| `workflow_transition_log` | Immutable history of every transition |
| `workflow_human_task` | Human review/approval tasks |
| `workflow_sla_tracking` | SLA start times and breach tracking |
| `workflow_parallel_approval` | Partial approval state for parallel steps |

---

### REST API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/entities/{type}/{id}/{command}` | Execute transition (in entity handler) |
| `GET` | `/api/v1/entities/{type}/{id}/workflow-state` | Get current state + available transitions |
| `GET` | `/api/v1/admin/tasks` | List human tasks (filter by role, status, entity_type) |
| `POST` | `/api/v1/admin/tasks/{id}/complete` | Complete a human task |

---

### Workflow Canvas Page (Frontend)

- **Route:** `/admin/workflows/:id/edit`
- **File:** `src/react/src/pages/studio/WorkflowCanvasPage.tsx`
- **Library:** `@xyflow/react` v12
- Visual node graph editor:
  - State nodes: circle/rounded rect; initial state has an arrow from a dot
  - Transition edges: labelled with command name
  - Clicking state → edit panel (SLA, terminal flag, label)
  - Clicking edge → edit panel (role guards, rule guards, actions)
- Save: serializes canvas to `WorkflowGraph` artifact payload → `POST /api/v1/artifacts`
- Publish: triggers compile → compiled workflow loaded by runtime

---

## Part 2 — Business Workflow Engine (Multi-Step Process Orchestration)

### Distinction from Workflow Engine

| Aspect | Workflow Engine | Business Workflow Engine |
|--------|----------------|-------------------------|
| Driven by | Entity status field | Separate process instance |
| Trigger | User command | Entity event or API call |
| State storage | `entity_record.status` | `business_workflow_instance` table |
| Steps | State transitions | Ordered step array |
| Compensation | Not built-in | Explicit rollback |

---

### Process Template Schema

Stored as `business_workflow_template` artifacts.

```json
{
  "template_key": "dealer_onboarding",
  "version": 1,
  "steps": [
    {
      "id": "step_background_check", "type": "command", "label": "Background Check",
      "command": "run_background_check", "target_entity_type": "dealer",
      "next_step": "step_doc_collection", "on_failure": "compensate"
    },
    {
      "id": "step_doc_collection", "type": "human_task", "label": "Document Collection",
      "task_key": "collect_dealer_docs", "title": "Collect docs for {entity.display_id}",
      "assignee_role": "RELATIONSHIP_MANAGER", "due_hours": 48,
      "next_step": "step_notify_complete"
    },
    {
      "id": "step_notify_complete", "type": "notification", "label": "Notify Completion",
      "role": "MANAGER", "message": "Dealer onboarding complete for {entity.display_id}",
      "next_step": null
    }
  ]
}
```

---

### Step Types

| `type` | Behaviour |
|--------|-----------|
| `command` | Executes a command via `command.Engine` |
| `human_task` | Creates `human_task` record; pauses the step loop (WAITING); resumes when task marked complete |
| `rule_evaluation` | Evaluates a rule set; can branch based on result |
| `notification` | Sends notification via notification service |
| `condition_branch` | Evaluates expression/rule; routes to different `next_step` — planned P3 |

---

### ProductionEngine — Step Loop

```go
// src/go/internal/business_workflow/engine.go
type Engine interface {
    StartProcess(ctx context.Context, templateKey string, trigger TriggerContext) (string, error)
    ResumeProcess(ctx context.Context, instanceID string, resumeContext map[string]interface{}) error
    GetInstanceStatus(ctx context.Context, instanceID string) (InstanceStatus, error)
}
```

**StartProcess:**
1. Load template from `compiled_artifact`
2. Create instance in `business_workflow_instance`
3. Launch `runInstance` as async goroutine — return `instanceID` immediately

**runInstance (Step Loop):**
```
currentStepID = template.Steps[0].ID
loop:
  step = findStep(steps, currentStepID)
  if step == nil → mark instance 'completed', return

  result = executeStep(ctx, step, instance)

  if result.Status == WAITING:
    → UpdateInstance(status='running', currentStepID=step.ID)
    → return (wait for ResumeProcess signal)

  if result.Status == FAILED:
    → UpdateInstance(status='failed')
    → runCompensation(ctx, instance, step)
    → return

  // SUCCESS: collect outputs, advance
  instance.StepOutputs[step.ID] = result.Output
  merge(instance.Variables, result.Variables)
  currentStepID = result.NextStepID || step.NextStep
  if currentStepID == "" → mark instance 'completed', return
```

---

### Compensation (Rollback)

When a step fails and `on_failure = "compensate"`:
- `runCompensation()` traverses steps in reverse order from before the failed step
- For each completed step with a `compensation_step_id`: executes that compensation step
- Compensation is best-effort — failures are logged, not propagated

---

### Current Implementation Status

| Feature | Status |
|---------|--------|
| `StubEngine` (no-op) | Default wiring — allows compile/run without BWF |
| `ProductionEngine` | Implemented; gated behind feature flag |
| Human task wait/resume | Implemented and tested |
| Compensation | Implemented |
| `condition_branch`, parallel steps | Planned P3 |
| Template authoring UI | Not yet built — templates via API/JSON |

---

### Database

```sql
CREATE TABLE business_workflow_instance (
    id               UUID PRIMARY KEY,
    tenant_id        VARCHAR NOT NULL,
    template_key     VARCHAR NOT NULL,
    status           VARCHAR NOT NULL DEFAULT 'running',  -- running|completed|failed|waiting
    current_step_id  VARCHAR,
    variables        JSONB DEFAULT '{}',
    entity_type      VARCHAR,
    entity_id        UUID,
    error_message    TEXT,
    error_step_id    VARCHAR,
    started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ
);
```

---

### REST API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/processes/start` | Start a process instance |
| `POST` | `/api/v1/processes/{id}/resume` | Resume a waiting instance |
| `GET` | `/api/v1/processes/{id}` | Get instance status |
| `GET` | `/api/v1/processes` | List instances (filter by entity_type, entity_id, status) |
