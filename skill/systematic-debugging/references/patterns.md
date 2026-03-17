# Debugging Patterns

## Binary Search (Isolate Phase)

```js
// 1. Comment out second half of suspect function
// 2. Does bug disappear? → bug was in that half
// 3. Restore, comment out first half
// 4. Repeat until isolated to single expression

function process(input) {
  const a = step1(input);    // ← comment from here down
  const b = step2(a);
  const c = step3(b);        // ← to here
  return c;
}
```

## Instrumentation Templates

```js
// Entry/exit trace
function traced(name, fn) {
  return function(...args) {
    console.error(`[ENTER] ${name}`, JSON.stringify(args));
    const result = fn.apply(this, args);
    console.error(`[EXIT]  ${name}`, JSON.stringify(result));
    return result;
  };
}

// State snapshot at a point
function snapshot(label, state) {
  console.error(`[SNAP] ${label}`, JSON.stringify(state, null, 2));
  console.error(`[STACK]`, new Error().stack.split('\n').slice(1,5).join('\n'));
}
```

## Test Polluter Isolation

```bash
# Run individual test — passes?
npx jest path/to/test.spec.ts

# Run full suite — fails?
npx jest

# Binary search: run subsets
npx jest --testPathPattern="a|b|c"     # first half
npx jest --testPathPattern="d|e|f"     # second half
# isolate to single file, then single test
```

## Async Bug Patterns

| Symptom | Likely Cause |
|---------|-------------|
| Passes locally, fails CI | Race condition — missing await or setTimeout |
| Intermittent failure | Shared mutable state between tests |
| Works in isolation, fails in batch | Test polluter — global state mutation |
| Wrong value but no error | Stale closure or captured reference |

## Hypothesis Template

Before changing anything, write:
```
Hypothesis: [specific cause]
Evidence:   [what I observed]
Test:       [how I will verify or falsify]
Expected:   [what should happen if hypothesis is correct]
```
