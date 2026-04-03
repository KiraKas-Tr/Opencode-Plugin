# Spec Template

Use this template when creating specifications.

**Output path:** `.opencode/memory/specs/YYYY-MM-DD-<descriptor>.md`

---

```markdown
# Specification: [Title]

**Date:** YYYY-MM-DD
**Author:** [Name]
**Status:** Draft | Confirmed
**bead_id:** [ID]

---

## Problem & Context

### Problem Statement
[Why is this needed?]

### Background
[Context and history]

### Who is Affected
[Stakeholders and users impacted]

---

## Outcomes

### Success Criteria
1. [Measurable outcome 1]
2. [Measurable outcome 2]

### Key Results
| Outcome | Metric | Target |
|---------|--------|--------|
| [Outcome] | [How to measure] | [Target value] |

---

## Scope

### In Scope
- [Feature/capability 1]
- [Feature/capability 2]

### Out of Scope
- [Excluded item 1]
- [Excluded item 2]

### Boundaries
[Clear boundaries of what this spec covers]

---

## Users

### Primary Users
| User Type | Description | Needs |
|-----------|-------------|-------|
| [Type] | [Who they are] | [What they need] |

### Secondary Users
| User Type | Description | Needs |
|-----------|-------------|-------|

---

## Constraints

### Technical Constraints
- [Constraint 1]

### Business Constraints
- [Timeline, budget, etc.]

### Dependencies
| Dependency | Type | Status |
|------------|------|--------|
| [Dependency] | Blocking/Soft | Ready/Pending |

---

## Acceptance Criteria

| ID | Criteria | Verification |
|----|----------|--------------|
| AC-01 | [Criteria] | [How to verify] |
| AC-02 | [Criteria] | [How to verify] |

### Execution Notes
- Preferred workflow mode: `compressed`
- Expected execution unit: **Task Packet**
- Beads issue/task is the live execution state
- Manual-only verification is not allowed unless explicitly marked as follow-up

---

## Assumptions

| ID | Assumption | Status | Notes |
|----|------------|--------|-------|
| A-01 | [Assumption] | Confirmed/Unconfirmed | [Notes] |

---

## Open Questions

- [ ] [Question 1]
- [ ] [Question 2]

## Planning Handoff Hints

- Likely files in scope: [candidate files/directories]
- Likely packet boundaries: [how the work should split into 1–3 file packets]
- Escalate if: [conditions that should trigger re-plan or Oracle]

---

## References

- [Link to discussion]
- [Link to related docs]
- [Link to research]
```
