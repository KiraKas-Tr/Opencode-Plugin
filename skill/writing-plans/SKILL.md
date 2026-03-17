---
name: writing-plans
description: Use when requirements are clear and you need to create an implementation plan with bite-sized tasks a junior engineer can execute with zero context.
---

# Writing Plans

## Task Requirements

Every task must have:
- **Exact file path** — no vague references
- **Complete code** — no `...` or "implement this"
- **Verification command + expected output**
- Completable in **2–5 minutes**

## Task Format

```markdown
### Task: [Verb] [what]

**File**: `src/foo/bar.ts`
**Action**: create | edit | delete

**Code**:
[complete, copy-pasteable code]

**Verification**:
- [ ] `npm test src/foo/bar.test.ts` → passes
```

## Plan Structure

1. **Prerequisites** — deps, baseline tests
2. **Core** — smallest working version
3. **Edge Cases** — error handling, validation
4. **Polish** — performance, docs

## Red Flags

- Task > 5 min → break it down
- Vague file path → make it exact
- Missing verification → add test command
- "Implement similar to X" → write the full code
