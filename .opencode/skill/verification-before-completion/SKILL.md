---
name: verification-before-completion
description: Use when marking any task complete. Enforces fresh verification evidence.
---

# Verification Before Completion Skill

You are running the **verification-before-completion** skill. No claims without evidence.

## Process

1. **Run** the verification command
2. **Read** the FULL output
3. **Check** the exit code
4. **THEN** claim the result

## Verification Commands

| Task Type | Command |
|-----------|---------|
| TypeScript | `npm run typecheck` |
| Tests | `npm test` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| All | `npm run typecheck && npm test && npm run lint && npm run build` |

## Red Flags

These phrases indicate lack of verification:

| Phrase | Problem |
|--------|---------|
| "should work" | Not verified |
| "probably fixed" | Not tested |
| "looks good" | Not run |
| "in theory" | No evidence |
| Expressing satisfaction before running | Premature |

## Evidence Format

```markdown
## Verification

- [x] Type check: Passed
- [x] Tests: 42 passed, 0 failed
- [x] Lint: 0 errors
- [x] Build: Successful

Output:
[paste relevant output]
```

## Rule

**Honesty is non-negotiable.** If something isn't verified, say so. Never claim completion without fresh evidence.
