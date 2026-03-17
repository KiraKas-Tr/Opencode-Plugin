---
name: verification-before-completion
description: Use before marking any task complete. Run verification commands first, show output, then claim the result.
---

# Verification Before Completion

## Process

```
Run command → read full output → check exit code → THEN claim result
```

## Commands by Task Type

| Type | Command |
|------|---------|
| TypeScript | `npm run typecheck` |
| Tests | `npm test` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| All gates | `npm run typecheck && npm test && npm run lint && npm run build` |

## Evidence Block (required output)

```
- [x] typecheck: 0 errors
- [x] tests: N passed, 0 failed
- [x] lint: 0 errors
- [x] build: exit 0
```

## Phrases That Signal No Verification

`"should work"` · `"probably fixed"` · `"looks good"` · `"in theory"` — **all invalid**.

If not run, say so. Never claim completion without fresh evidence.
