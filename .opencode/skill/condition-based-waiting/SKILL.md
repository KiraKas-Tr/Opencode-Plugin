---
name: condition-based-waiting
description: Replace arbitrary timeouts with condition polling. Wait for actual state changes. Eliminates flaky tests from race conditions.
---

# Condition-Based Waiting Skill

You are running the **condition-based-waiting** skill. Never use arbitrary sleeps. Always wait for conditions.

## The Problem

```javascript
// BAD: Arbitrary timeout
await sleep(2000);
expect(element.isVisible).toBe(true);

// Why it fails:
// - Too short: Flaky on slow CI
// - Too long: Wastes time on fast machines
// - Never correct: Race condition waiting to happen
```

## The Solution

```javascript
// GOOD: Wait for condition
await waitFor(() => expect(element.isVisible).toBe(true), { timeout: 5000 });

// Why it works:
// - Passes immediately when ready
// - Fails fast with clear error
// - No wasted time
```

## Patterns

### UI Waiting
```javascript
// Wait for element
await page.waitForSelector('.loaded');

// Wait for text
await waitFor(() => page.textContent('.status') === 'Ready');

// Wait for visibility
await waitFor(() => element.isVisible());
```

### API Waiting
```javascript
// Wait for response
await waitFor(async () => {
  const res = await fetch('/status');
  const data = await res.json();
  return data.ready === true;
});

// Wait for state
await waitFor(() => store.getState().loaded === true);
```

### Database Waiting
```javascript
// Wait for record
await waitFor(async () => {
  const record = await db.find(id);
  return record !== null;
});
```

## Rules

| Pattern | Verdict |
|---------|---------|
| `sleep(n)` or `wait(n)` | DELETE. Replace with condition. |
| `setTimeout` in tests | DELETE. Use polling. |
| "It works on my machine" | Race condition. Fix with condition. |
| Fixed delay "to be safe" | Not safe. Use condition. |

## Timeout Strategy

1. Set reasonable timeout (default: 5000ms)
2. Poll frequently (default: 50ms intervals)
3. Include state in error message
4. Consider exponential backoff for external services

## Red Flags

- Any hardcoded delay in test code
- Comments explaining why timeout is needed
- Tests that pass locally but fail in CI
- "Flaky" test label without investigation
