# Discussion Template

Use this template when documenting clarified intent before `/create`.

**Output path:** `.opencode/memory/discussions/YYYY-MM-DD-<topic>.md`

This template is optimized for an **interview-style pre-create discussion**: the report should reduce guessing for `/create`, `/research`, and `/start` by separating what the interview already resolved from what still needs downstream work.

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
**Interview focus:** [Which gray areas the discussion prioritized first]

---

## Scope Boundary

- **In scope:** [What this discussion covers]
- **Out of scope:** [What is explicitly excluded]

---

## Locked Decisions

Record only decisions that the interview actually resolved. If a topic stayed uncertain, move it to **Open Questions** instead of implying certainty.

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

Use this section for defaults accepted during the interview because prior artifacts or codebase evidence made them reasonable.

- **Assumption:** [What was assumed]
  - **Confirmed by:** [user / artifact / codebase pattern]
  - **Notes:** [Any caveat]

---

## Open Questions

Use this section for planning-critical ambiguity that the interview intentionally left unresolved.

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

- [Specific instruction `/create` should preserve in the plan]
- [If useful: which question order or interview framing worked best for this topic]
```
