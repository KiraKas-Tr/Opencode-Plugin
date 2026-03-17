---
name: testing-anti-patterns
description: Prevents testing mock behavior instead of real code, test-only production methods, and mocking without understanding boundaries.
---

# Testing Anti-Patterns

## Anti-Pattern 1 — Testing the Mock

```js
// BAD: proves nothing about service.doThing
expect(mock).toHaveBeenCalled();

// GOOD: verify actual behavior
expect(result.status).toBe('success');
expect(sideEffectHappened).toBe(true);
```

## Anti-Pattern 2 — Test-Only Production Methods

```js
// BAD
class UserService {
  _validateEmailForTesting(email) { ... }  // NEVER
}

// GOOD: test through the public API
const result = userService.register(email);
expect(result.isValid).toBe(true);
```

## Anti-Pattern 3 — Over-Mocking

```js
// BAD: mocking everything means testing nothing
jest.mock('./database');
jest.mock('./logger');
jest.mock('./config');

// GOOD: mock only external boundaries
// Mock: network calls, filesystem, external services, time/date
// Keep real: domain logic, internal utilities, business rules
```

## Mock Decision

| Dependency | Mock? |
|------------|-------|
| Network / external API | Yes |
| File system | Yes |
| Time / date | Yes |
| Logger | No — use real |
| Domain logic | No |
| Your own services | No |

## Rules

- Test behavior, not implementation
- No test-only code in production classes
- Mock at external boundaries only
- Test names describe behavior: `rejectsInvalidEmail` not `testEmail`

## Red Flags

- More mock setup than assertions in test file
- Private methods exposed for testing
- Tests break on harmless refactors
- `toHaveBeenCalled` without asserting the result

## References

- [Decision matrix](references/decision-matrix.md) — full mock decision table, naming conventions, AAA structure, smell → fix guide
