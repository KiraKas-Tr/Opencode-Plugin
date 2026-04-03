# Discussion Template

Use this template when documenting clarified intent before `/create`.

**Output path:** `.opencode/memory/discussions/YYYY-MM-DD-<topic>.md`

This template is optimized for **pre-create discussion**: the report should reduce guessing for `/create`, `/research`, and `/start` by separating locked intent from unresolved technical work.

---

```markdown
---
topic: [Topic Name]
date: YYYY-MM-DD
status: draft | approved
mode: interactive | assumptions
bead_id: [optional]
---

# Discussion: [Topic]

**Goal:** [What outcome the user wants]
**Why now:** [Why this needs to be clarified before planning]
**Assumptions:** [Any assumptions made due to incomplete context, or "None"]

---

## Scope Boundary

- **In scope:** [What this discussion covers]
- **Out of scope:** [What is explicitly excluded]

---

## Locked Decisions

### Decision 1: [Title]
- **Decision:** [Confirmed choice]
- **Why it matters:** [Why `/create` or `/research` must preserve it]
- **Source:** user-confirmed | prior artifact-confirmed

### Decision 2: [Title]
- **Decision:** [Confirmed choice]
- **Why it matters:** [Practical consequence]
- **Source:** user-confirmed | prior artifact-confirmed

---

## Confirmed Assumptions

- **Assumption:** [What was assumed]
  - **Confirmed by:** [user / artifact / codebase pattern]
  - **Notes:** [Any caveat]

---

## Open Questions

- **Question:** [Unresolved item]
  - **Why unresolved:** [Reason]
  - **Next owner:** `/create` | `/research` | user

---

## Codebase Context

- **Relevant files/modules:** [Paths or components]
- **Existing patterns:** [Patterns worth preserving]
- **Reuse opportunities:** [What downstream work should reuse]
- **Constraints:** [Technical realities discovered locally]

---

## Canonical References

- [Internal doc, file, or prior artifact]
- [Another source downstream agents should read]

---

## Deferred / Later

- [Idea intentionally postponed]
- [Follow-up that should not expand current scope]

---

## Planning Notes

- [Specific instruction `/create` should preserve in the spec]
- [Specific instruction `/create` should preserve in the plan]
```
