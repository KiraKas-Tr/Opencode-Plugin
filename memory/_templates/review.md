# Review Template

Use this template when reviewing code, PRDs, specs, or plans.

**Output path:** `.opencode/memory/reviews/YYYY-MM-DD-<subject>-review.md`

---

```markdown
---
type: Code | PRD | Spec | Plan | Security
date: YYYY-MM-DD
reviewer: [Name/Agent]
artifact: [Path to reviewed artifact]
verdict: approved | changes_required | blocked
bead_id: [optional]
task_ids: []
---

# Review: [Subject Name]

---

## Summary

[2-3 sentences on overall quality and readiness]

---

## Checklist

### Completeness
- [ ] All required sections present
- [ ] Acceptance criteria defined
- [ ] Dependencies identified

### Clarity
- [ ] No ambiguous language
- [ ] Technical terms explained
- [ ] Scope boundaries clear

### Correctness
- [ ] Logic is sound
- [ ] No obvious errors
- [ ] Edge cases considered

### Quality
- [ ] Follows conventions
- [ ] Well-structured
- [ ] Maintainable

---

## Findings

### Critical (Must Fix Before Approval)
| ID | Issue | Location | Recommendation |
|----|-------|----------|----------------|
| C-01 | [Issue] | [Where] | [Fix] |

### High (Should Fix)
| ID | Issue | Location | Recommendation |
|----|-------|----------|----------------|
| H-01 | [Issue] | [Where] | [Fix] |

### Medium (Consider Fixing)
| ID | Issue | Location | Recommendation |
|----|-------|----------|----------------|
| M-01 | [Issue] | [Where] | [Fix] |

### Low (Optional)
| ID | Issue | Location | Recommendation |
|----|-------|----------|----------------|
| L-01 | [Issue] | [Where] | [Fix] |

---

## Strengths

1. ✅ [Strength 1]
2. ✅ [Strength 2]

---

## Questions

1. ❓ [Question 1]
2. ❓ [Question 2]

---

## Verdict Details

### ✅ Approved
Ready to proceed. [Optional notes]

### ⚠️ Changes Required
**Required before approval:**
1. [ ] [Change 1]
2. [ ] [Change 2]

**Re-review needed:** Yes | No

### ❌ Blocked
**Blocking issues:**
- [Critical issue preventing approval]

**Recommended action:**
- [What needs to happen]

---

## Next Steps

1. [ ] [Action 1]
2. [ ] [Action 2]
```
