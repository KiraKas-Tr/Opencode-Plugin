---
name: testing-anti-patterns
description: Prevents testing mock behavior instead of real code, test-only methods in production classes, mocking without understanding dependencies.
---

# Testing Anti-Patterns Skill

You are running the **testing-anti-patterns** skill. Tests should verify real behavior, not mock theater.

## Anti-Pattern #1: Testing Mocks

```javascript
// BAD: Test verifies mock was called
const mock = jest.fn();
service.doThing(mock);
expect(mock).toHaveBeenCalled();

// This tests nothing about service.doThing
// It only proves you called the mock
```

```javascript
// GOOD: Test verifies actual behavior
const result = service.doThing(realDependency);
expect(result.status).toBe('success');
expect(sideEffectHappened).toBe(true);
```

## Anti-Pattern #2: Test-Only Methods

```javascript
// BAD: Method exists only for testing
class UserService {
  private validateEmail(email) { ... }  // private
  _validateEmailForTesting(email) { ... }  // NEVER DO THIS
}

// This couples tests to implementation
// Refactoring becomes impossible
```

```javascript
// GOOD: Test through public API
// If you need to test validation, test it through the method that uses it
const result = userService.register(email);
expect(result.isValid).toBe(true);
```

## Anti-Pattern #3: Mocking Without Understanding

```javascript
// BAD: Over-mocking without knowing why
jest.mock('./database');
jest.mock('./logger');
jest.mock('./config');
jest.mock('./everything');

// Test now verifies nothing about integration
// Any refactoring breaks tests
```

```javascript
// GOOD: Mock only external boundaries
// Keep real implementations for:
// - Domain logic
// - Internal utilities
// - Business rules

// Mock only:
// - Network calls
// - File system
// - External services
// - Time/date
```

## Decision Matrix

| Mock It? | Yes If... | No If... |
|----------|-----------|----------|
| Database | Unit test | Integration test |
| Logger | Never | Always use real |
| Config | External file | In-memory defaults |
| HTTP client | External API | Your own server |
| Time | Tests time-sensitive logic | Tests pure functions |

## Rules

1. **Test behavior, not implementation** - What does it do, not how
2. **No test-only code in production** - If it's not used, delete it
3. **Mock at boundaries** - External dependencies only
4. **One assertion per test** - Or at least one concept
5. **Test names describe behavior** - `shouldRejectInvalidEmail` not `testEmail`

## Red Flags

- Test file has more mock setup than assertions
- Private methods exposed for testing
- Tests break on harmless refactors
- `toHaveBeenCalled` without verifying the result
- Mocking modules you own
