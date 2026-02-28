# Handoff Template

Use this template when saving state for session breaks.

**Output path:** `.opencode/memory/handoffs/YYYY-MM-DD-<phase>.md`

---

```markdown
---
date: YYYY-MM-DD
phase: spec'd | researched | planned | implementing | validating
branch: [git branch name]
bead_id: [optional]
---

# Handoff: [Feature/Task Name]

---

## Status Summary

[2-5 sentences describing current state: what's done, what's in progress, any blockers]

---

## Artifacts

| Type | Path | Status |
|------|------|--------|
| Spec | `.opencode/memory/specs/YYYY-MM-DD-descriptor.md` | ✅ Complete |
| Plan | `.opencode/memory/plans/YYYY-MM-DD-feature.md` | ✅ Complete |
| Research | `.opencode/memory/research/YYYY-MM-DD-topic.md` | 📚 Reference |
| PRD | `.opencode/memory/prds/YYYY-MM-DD-feature.md` | ⏸️ In Review |

---

## Task Status

### ✅ Completed
- [x] T-001: [Task title]
- [x] T-002: [Task title]

### 🔄 In Progress
- [ ] T-003: [Task title]
  - **Current state:** [What's been done]
  - **Next step:** [What to do next]

### ⏸️ Blocked
- [ ] T-004: [Task title]
  - **Blocked by:** [Reason/dependency]
  - **Resolution:** [What needs to happen]

### 📋 Not Started
- [ ] T-005: [Task title]
- [ ] T-006: [Task title]

---

## Files Modified

| File | Status | Notes |
|------|--------|-------|
| `path/to/file.ts` | Modified | [Brief note] |
| `path/to/new.ts` | Created | [Brief note] |

---

## Git State

- **Branch:** `feature/xyz`
- **Last commit:** `abc1234` - [message]
- **Uncommitted changes:** Yes/No
- **Files staged:** [list if any]

---

## Known Issues

1. [Issue 1 and any workaround]
2. [Issue 2 and any workaround]

---

## Next Steps

1. [ ] [Immediate next action]
2. [ ] [Following action]
3. [ ] [After that]

---

## Context for Resumption

[Any important context the next session needs to know that isn't captured above]

### Decisions Made
- [Decision 1 and rationale]

### Approaches Tried
- [Approach that didn't work and why]

### Key Files to Review
- `path/to/important.ts` — [Why important]

---

## Resume Command

To resume, use `/resume` and it will:
1. Load this handoff
2. Check for drift
3. Propose next action
```
