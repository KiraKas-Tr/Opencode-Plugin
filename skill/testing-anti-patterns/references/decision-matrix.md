# Testing Anti-Patterns — Decision Reference

## Mock Decision Matrix (expanded)

| Dependency | Mock in unit? | Mock in integration? | Reason |
|------------|:---:|:---:|--------|
| External HTTP API | ✅ | ❌ | External boundary |
| Database (real) | ✅ | ❌ | External boundary |
| File system | ✅ | context | Depends on test scope |
| Time / Date | ✅ | ✅ | Non-deterministic |
| Logger | ❌ | ❌ | No behavior, use real |
| Your own service class | ❌ | ❌ | You own it — test it |
| Domain logic | ❌ | ❌ | Core behavior |
| Config (env vars) | ❌ | ❌ | Use test env values |
| In-memory store | ❌ | ❌ | Fast, no reason to mock |

## Naming Convention

```js
// Bad — describes mechanics
test('testEmail')
test('checkValidation')

// Good — describes behavior
test('rejects email missing @ symbol')
test('returns 400 when name exceeds 255 chars')
test('does not create user when email already exists')
```

## Test Structure (Arrange-Act-Assert)

```js
test('returns error when stock is zero', () => {
  // Arrange
  const product = { id: 1, stock: 0 };

  // Act
  const result = checkout(product, quantity=1);

  // Assert
  expect(result.error).toBe('OUT_OF_STOCK');
  expect(result.charged).toBe(false);
});
```

## Smell → Fix Reference

| Smell | Fix |
|-------|-----|
| 10+ lines of mock setup | Extract to fixture or factory |
| `beforeEach` with global mocks | Move to test-local setup |
| Testing private via `_method` | Test via public API |
| `toHaveBeenCalledWith` only | Add assertion on the real result |
| Mock chain 3 levels deep | Mock the boundary, not each call |
| Same test body repeated 5× | Parameterize with `test.each` |
