---
name: test-driven-development
description: Use when implementing any feature. Enforces strict RED-GREEN-REFACTOR cycle. No code before a failing test exists.
---

# Test-Driven Development

## Cycle

```
RED   → write failing test → run → must fail
GREEN → write minimum code → run → must pass
REFACTOR → clean up, keep green → commit
```

## Hard Rules

| Situation | Action |
|-----------|--------|
| Code written before test | DELETE the code. Start over. |
| Test passes on first run | DELETE the test. It's testing nothing. |
| Tempted to skip RED | Not allowed. Always see it fail first. |

## Red Flags

- Implementation exists before test
- Keeping "reference code" while writing test
- Skipping "watch it fail" step
- Test body mirrors the implementation
