# UI Studio Phase Gate Template

Use this template for every implementation phase before confirming completion.

## Phase

- Phase:
- Date:
- Implementer:
- Gatekeeper:
- Branch/worktree note:

## Implementation Checklist

| Item | Required Evidence | Status |
|---|---|---|
| Milestones completed | List milestone IDs and changed files | Pending |
| Critical findings covered | List finding IDs and proof | Pending |
| Feature scorecard items covered | List feature IDs and proof | Pending |
| API/schema changes documented | Route/schema/migration summary | Pending |
| Tests added or updated | Test file names and command output | Pending |
| Browser evidence captured | Chrome screenshot/trace paths | Pending |
| User changes preserved | `git status --short` and overlap review | Pending |

## Mandatory Commands

```powershell
git status --short
git diff --stat
docker compose run --rm --no-deps api go test ./...
cd src/react
npm.cmd run lint
npm.cmd test -- --run
npm.cmd run build
npm.cmd run e2e:chrome
```

## Gatekeeper Verdict

- Verdict: Pending
- Failed items:
- Deferred items:
- Residual risks:
- Approval note:
