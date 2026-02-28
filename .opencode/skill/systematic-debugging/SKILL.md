---
name: systematic-debugging
description: Use when encountering a bug. Enforces evidence-based 4-phase debugging process.
---

# Systematic Debugging Skill

You are running the **systematic-debugging** skill. No guessing. No random changes.

## 4-Phase Process

### Phase 1: Reproduce
- Create a minimal reproduction case
- Document exact steps to trigger
- Verify it's reproducible (not intermittent)

### Phase 2: Isolate
- Binary search: Comment out half the code
- Which half contains the bug?
- Repeat until isolated to smallest possible unit

### Phase 3: Identify
- Read the isolated code carefully
- Trace variable values
- Add instrumentation (console.log, debugger)
- Understand WHY it fails, not just WHERE

### Phase 4: Verify
- Fix the root cause
- Run tests to confirm fix
- Check for similar issues elsewhere
- Add regression test

## Rules

| Rule | Why |
|------|-----|
| No random changes | Masks symptoms, doesn't fix cause |
| After 3+ failed fixes | Question architectural assumptions |
| Always reproduce first | Can't fix what you can't trigger |
| Add regression test | Prevent recurrence |

## Instrumentation

```javascript
// Stack trace
console.error('Debug:', new Error().stack);

// Variable dump
console.error('Context:', JSON.stringify({ var1, var2 }, null, 2));
```

## Red Flags

- Changing code without understanding why
- "Let me try this" without hypothesis
- Fixing symptoms instead of root cause
- No reproduction steps
