---
name: root-cause-tracing
description: Trace bugs backward through call chain to original trigger. Never fix where error appears.
---

# Root Cause Tracing Skill

You are running the **root-cause-tracing** skill. Fix the origin, not the symptom.

## Core Principle

The error appears at point A. The cause is at point B. Always trace backward to B.

## Tracing Process

### Step 1: Locate the Error
- Find where the error manifests
- DO NOT fix here yet
- This is the symptom location

### Step 2: Trace the Call Chain
- Who called this function?
- Who called that function?
- Keep going until you find the trigger

### Step 3: Find the Root Cause
- The first place where incorrect data/state originated
- The decision point that led to wrong path
- The missing validation that allowed bad input

### Step 4: Fix at Origin
- Apply fix at the root cause location
- NOT where the error appeared
- Verify symptom disappears

## Instrumentation

```javascript
// At each layer, add:
console.error('[TRACE] Function:', functionName);
console.error('[TRACE] Args:', JSON.stringify(args, null, 2));
console.error('[TRACE] Stack:', new Error().stack);
```

## Bisection for Test Polluters

When tests fail in batch but pass individually:

1. Run first half of tests → passing?
2. If yes: bug in second half
3. If no: bug in first half
4. Repeat until isolated to single test
5. That test is polluting shared state

## Red Flags

- Fixing where error is thrown (not where caused)
- "Let me add a null check here" (defensive, not corrective)
- Not tracing the full call chain
- Assuming you know the cause without evidence

## Example

```
Error: Cannot read property 'length' of undefined
  at processItems (line 42)      ← DO NOT FIX HERE
  at handleRequest (line 28)
  at parseInput (line 15)        ← FIX HERE: null should be []
```

## Rule

**Never fix at the symptom. Always trace to the root.**
