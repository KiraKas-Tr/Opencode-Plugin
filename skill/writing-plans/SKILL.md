---
name: writing-plans
description: Use when requirements are clear and you need to create an implementation plan with bite-sized tasks.
---

# Writing Plans Skill

You are running the **writing-plans** skill. Create implementation plans that a junior engineer could follow with zero context.

## Task Requirements

Each task must be:
- **2-5 minutes** to complete
- Has **exact file paths**
- Has **complete code** (no "...", no "implement this")
- Has **verification steps**

## Task Format

```markdown
### Task: [Action verb] [what]

**File**: `path/to/file.ts`

**Action**: [create|edit|delete]

**Code**:
[Complete, copy-pasteable code]

**Verification**:
- [ ] Command: `npm test`
- [ ] Expected: All tests pass
```

## Principles

| Principle | Meaning |
|-----------|---------|
| YAGNI | Don't add "nice to have" features |
| DRY | Extract shared logic immediately |
| TDD | Write test before implementation |

## Plan Structure

1. **Prerequisites** — Setup, dependencies, baseline tests
2. **Core** — Main functionality, smallest working version
3. **Edge Cases** — Error handling, validation
4. **Polish** — Performance, documentation

## Red Flags

- Tasks longer than 5 minutes → Break down further
- Vague file paths → Be specific
- Missing verification → Add test commands
- "Implement similar to" → Provide full code
