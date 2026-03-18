---
name: systematic-debugging
description: "Use when encountering a bug. Enforces evidence-based 4-phase process: Reproduce → Isolate → Identify → Verify. No guessing."
---

# Systematic Debugging

## 4 Phases

```
REPRODUCE → ISOLATE → IDENTIFY → VERIFY
```

**Reproduce** — Minimal repro case. Document exact trigger. Confirm it's not intermittent.

**Isolate** — Binary search: comment out half the code. Which half has the bug? Repeat until smallest unit.

**Identify** — Read isolated code. Trace variable values. Understand *why* it fails, not just *where*.

**Verify** — Fix root cause. Run tests. Check for similar issues. Add regression test.

## Instrumentation

```js
console.error('[DBG]', JSON.stringify({ var1, var2 }, null, 2));
console.error('[STACK]', new Error().stack);
```

## Rules

| Situation | Action |
|-----------|--------|
| 3+ failed fixes | Question architectural assumptions |
| Error appears at A | Trace backward — cause is at B, fix B |
| No repro steps | Don't touch code yet |

## Red Flags

- Changing code without a hypothesis
- Fixing where error appears, not where it originates
- No regression test after fix

## References

- [Debugging patterns](references/patterns.md) — binary search template, instrumentation helpers, async bug patterns, hypothesis template
