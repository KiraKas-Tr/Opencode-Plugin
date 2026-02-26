---
name: test-driven-development
description: Use when implementing any feature. Enforces strict RED-GREEN-REFACTOR cycle.
---

# Test-Driven Development Skill

You are running the **test-driven-development** skill. No code without tests. No exceptions.

## RED-GREEN-REFACTOR

### Phase 1: RED
1. Write a failing test
2. Run the test — it MUST fail
3. If it passes, the test is wrong — delete and rewrite

### Phase 2: GREEN
1. Write the MINIMUM code to make the test pass
2. Run the test — it MUST pass
3. If it fails, fix the code (not the test)

### Phase 3: REFACTOR
1. Clean up code while keeping tests green
2. Run tests after each change
3. Commit when satisfied

## Rules

| Rule | Enforcement |
|------|-------------|
| Write code before test? | DELETE the code. Don't keep as reference. |
| Test passes unexpectedly? | DELETE the test. It's testing nothing. |
| Skip RED phase? | Not allowed. Always start with failing test. |
| "Just this once"? | No. No exceptions. |

## Workflow

```
1. Think → What should this do?
2. RED → Write failing test
3. Run → Watch it fail
4. GREEN → Write minimal code
5. Run → Watch it pass
6. REFACTOR → Clean up
7. Commit
```

## Red Flags

- Writing implementation before test
- Keeping "reference code" while writing test
- Skipping "watch it fail" step
- Test that can never fail
