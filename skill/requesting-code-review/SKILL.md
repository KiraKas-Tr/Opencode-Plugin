---
name: requesting-code-review
description: Use after completing a task. Dispatch @review subagent for quality gate before merging.
---

# Requesting Code Review

## Trigger

Request review after: major features, significant refactors, before merge, when unsure of approach.

## What to Provide to @review

| Item | Example |
|------|---------|
| Diff range | `a1b2c3d..e4f5g6h` |
| What changed | "Added JWT auth with refresh tokens" |
| Plan ref | `.opencode/memory/plans/auth.md` |
| Known gaps | "Edge case X not handled yet" |

## Dispatch

```
@review: review changes from <sha>..<sha>
Context: <what was built>
Plan: <path>
Known issues: <list or none>
```

## Severity Response

| Severity | Action |
|----------|--------|
| Critical | Fix now, re-review |
| High | Fix before merge |
| Medium | Create beads ticket |
| Low | Document, defer |

## Red Flags

- Skipping review "because it's small"
- Merging with unresolved Critical issues
- No context given to reviewer
