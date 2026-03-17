---
name: condition-based-waiting
description: Replace arbitrary timeouts with condition polling. Eliminates flaky tests from race conditions — wait for actual state, not clock time.
---

# Condition-Based Waiting

## Rule

```
NEVER: await sleep(2000)
ALWAYS: await waitFor(() => condition, { timeout: 5000 })
```

## Patterns

```js
// UI element
await page.waitForSelector('.loaded');

// Custom condition
await waitFor(() => element.isVisible());

// API state
await waitFor(async () => {
  const { ready } = await fetch('/status').then(r => r.json());
  return ready === true;
});

// DB record
await waitFor(async () => (await db.find(id)) !== null);
```

## Timeout Strategy

- Default timeout: **5000ms**
- Poll interval: **50ms**
- Include current state in error message
- External services: use exponential backoff

## Verdict Table

| Pattern | Action |
|---------|--------|
| `sleep(n)` / `wait(n)` | DELETE — replace with condition |
| `setTimeout` in tests | DELETE — use polling |
| Fixed delay "to be safe" | DELETE — not safe |
| "Flaky in CI" | Race condition — apply condition wait |

## Red Flags

- Hardcoded delay in test code
- Comment explaining why the delay is needed
- Test passes locally but flakes in CI
