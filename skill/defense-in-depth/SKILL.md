---
name: defense-in-depth
description: Validate at every layer. Makes bugs structurally impossible through layered guards.
---

# Defense in Depth Skill

You are running the **defense-in-depth** skill. Trust nothing. Validate everything.

## Core Principle

Bugs slip through single validation. Multiple validation layers catch what one misses.

## Validation Layers

### Layer 1: Entry Point Validation
```javascript
// API endpoint, CLI input, user form
function handler(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input: expected object');
  }
  if (!input.id || typeof input.id !== 'string') {
    throw new Error('Invalid input: id required');
  }
  // ... continue
}
```

### Layer 2: Business Logic Validation
```javascript
// Domain rules, invariants
function processOrder(order) {
  if (order.items.length === 0) {
    throw new Error('Order must have items');
  }
  if (order.total < 0) {
    throw new Error('Order total cannot be negative');
  }
  // ... continue
}
```

### Layer 3: Environment Guards
```javascript
// Runtime environment checks
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL required in production');
}
```

### Layer 4: Debug Instrumentation
```javascript
// Developer sanity checks (removed in production)
if (process.env.NODE_ENV !== 'production') {
  console.error('[DEBUG] State:', JSON.stringify(state));
  console.error('[DEBUG] Stack:', new Error().stack);
}
```

## Validation Checklist

| Layer | Validated | Confidence |
|-------|-----------|------------|
| Entry point | Input shape, types | High |
| Business logic | Domain rules | Higher |
| Environment | Config, secrets | Highest |
| Debug | State snapshots | Debug only |

## When to Add Each Layer

| Scenario | Add Layer |
|----------|-----------|
| New API endpoint | Entry point + Business |
| New function with external callers | Entry point |
| Production deployment | Environment guards |
| Debugging session | Debug instrumentation |
| Test polluter suspected | Debug instrumentation |

## Red Flags

- Assuming caller provides valid input
- Skipping validation "for performance"
- Only validating at one layer
- Removing validation to "fix" tests

## Rule

**Validate at every layer. Make bugs structurally impossible.**
