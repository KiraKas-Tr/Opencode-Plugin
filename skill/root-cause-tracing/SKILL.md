---
name: root-cause-tracing
description: Trace bugs backward through call chain to original trigger. Never fix where error appears — fix where bad data originated.
---

# Root Cause Tracing

## Principle

Error appears at **A**. Cause is at **B**. Trace backward to **B** and fix there.

## Process

```
1. LOCATE  — find where error manifests (do NOT fix here)
2. TRACE   — walk the call chain backward (who called this? who called that?)
3. FIND    — first place wrong data/state originated
4. FIX     — apply fix at origin
5. VERIFY  — confirm symptom disappears
```

## Example

```
Error: Cannot read property 'length' of undefined
  at processItems (line 42)    ← symptom — DO NOT FIX HERE
  at handleRequest (line 28)
  at parseInput (line 15)      ← origin — FIX HERE (return [] not null)
```

## Instrumentation

```js
console.error('[TRACE]', functionName, JSON.stringify(args, null, 2));
console.error('[STACK]', new Error().stack);
```

## Test Polluter Bisection

Tests fail in batch but pass alone → shared state pollution:
1. Run first half → passes? bug in second half
2. Run first half → fails? bug in first half
3. Repeat until single test isolated

## Red Flags

- Adding a null check at the symptom location (defensive, not corrective)
- Assuming cause without tracing the full chain
- No evidence before applying fix
