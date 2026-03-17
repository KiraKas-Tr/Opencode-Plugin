---
name: defense-in-depth
description: Validate at every layer. Makes bugs structurally impossible through entry point, domain, and environment guards.
---

# Defense in Depth

## Validation Layers

| Layer | Where | What to validate |
|-------|-------|-----------------|
| 1 — Entry point | API handler, CLI input, form | Input shape, required fields, types |
| 2 — Business logic | Domain functions | Domain rules, invariants, state |
| 3 — Environment | App startup | Required env vars, config in prod |
| 4 — Debug | Dev only | State snapshots, stack traces |

## Minimal Patterns

```js
// Layer 1 — entry
if (!input?.id || typeof input.id !== 'string') throw new Error('id required');

// Layer 2 — domain
if (order.items.length === 0) throw new Error('Order must have items');

// Layer 3 — environment
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL)
  throw new Error('DATABASE_URL required in production');

// Layer 4 — debug (dev only)
if (process.env.NODE_ENV !== 'production')
  console.error('[DBG]', JSON.stringify(state));
```

## When to Add Each Layer

| Situation | Add |
|-----------|-----|
| New API endpoint | L1 + L2 |
| New function with external callers | L1 |
| Production deploy | L3 |
| Debugging / test pollution | L4 |

## Red Flags

- Assuming callers always provide valid input
- Skipping validation "for performance"
- Only one layer total
- Removing validation to make tests pass
