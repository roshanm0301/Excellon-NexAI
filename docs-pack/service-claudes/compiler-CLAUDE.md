# CLAUDE.md — src/go/internal/compiler/

> This is the 6-step entity schema compiler.
> Read `docs/prd/ENTITY-DESIGNER.md` (Backend section) before modifying anything here.

## What This Package Does

Transforms a `overlay.MergedArtifact` into a compiled schema stored in `compiled_artifact`.
This is called only by the publish flow — never at request time.

## Entry Point

```go
func (c *Compiler) compileEntitySchema(ctx context.Context, merged overlay.MergedArtifact) (map[string]any, error)
```

## Critical Rules

- NEVER read raw `artifact_version.payload` here — always receive a `MergedArtifact`
- System fields injected in Step 3 always overwrite user-defined fields with the same name
- Step 2e: delete legacy `compute_mode` keys — only JSONata `compute_expression` is valid
- Step 4: call `indexmgmt.QueueIndexes()` for composite keys — never apply indexes inline
- Content hash deduplication: if compiled output matches existing `compiled_artifact.content_hash`, do not replace

## What Claude Code May Change Here

- Adding new pass-through fields (Step 5) — safe if the runtime is also updated to use them
- Adding new system fields (Step 3) — requires updating entity runtime, tests, and docs

## What Claude Code Must NOT Change Here

- The overlay merge input contract — always `MergedArtifact`, never raw payload
- The content hash deduplication logic
- The `_removed` field filtering — this is how overlay REMOVE operations work
