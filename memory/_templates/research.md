# Research Template

Use this template when documenting research findings.

**Output path:** `.opencode/memory/research/YYYY-MM-DD-<topic>.md`

This template is optimized for **pre-plan research**: the report should reduce guessing for Plan and Build, not just summarize information.

---

```markdown
---
topic: [Topic Name]
date: YYYY-MM-DD
confidence: high | medium | low
depth: quick | standard | deep
versions:
  - library: "[name]"
    version: "[version]"
bead_id: [optional]
---

# Research: [Topic]

**Question:** [Original research question]
**Planning Goal:** [What planning or implementation decision this report should unblock]
**Assumptions:** [Any assumption made because context was incomplete, or "None"]

---

## Summary

[2-4 sentence answer that directly helps planning or execution]

---

## Research Brief

- **Decision gaps:** [Which unknowns this research was meant to resolve]
- **Constraints:** [Language, framework, platform, architecture, version limits]
- **Research scope:** [What was investigated and what was intentionally excluded]

---

## Key Findings

### Finding 1: [Title]
[VERIFIED]/[CITED]/[ASSUMED] [Details and why this matters]

### Finding 2: [Title]
[VERIFIED]/[CITED]/[ASSUMED] [Details and why this matters]

### Finding 3: [Title]
[VERIFIED]/[CITED]/[ASSUMED] [Details and why this matters]

---

## Comparison (if applicable)

| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| [Option A] | [Pros] | [Cons] | [Use case] |
| [Option B] | [Pros] | [Cons] | [Use case] |

---

## Code Examples

### Example 1: [Title]
```[language]
// Code example
```

### Example 2: [Title]
```[language]
// Code example
```

---

## Recommendation

**Recommended approach:** [What to use/do]

**Rationale:**
1. [Reason 1]
2. [Reason 2]

---

## Planning Impact

- [How this research should influence the plan or packet boundaries]
- [What Build should avoid or sequence carefully]
- [Any dependency, migration, or scope implications]

---

## Verification Hooks

- [ ] [Targeted test, command, or assertion to run during implementation]
- [ ] [Another implementation-time check]

---

## Conflicting Evidence (if any)

- [Source A says X, source B says Y, and the practical implication]

---

## Open Questions

- [ ] [Unanswered question 1]
- [ ] [Unanswered question 2]

---

## Sources

| Source | Type | Reliability |
|--------|------|-------------|
| [URL/Title] | Official Docs | High |
| [URL/Title] | GitHub | Medium |
| [URL/Title] | Blog/Article | Low |

---

## Version Notes

| Library/Tool | Version Researched | Current Latest | Notes |
|--------------|-------------------|----------------|-------|
| [Name] | [v1.2.3] | [v1.2.5] | [Any version-specific notes] |
```
