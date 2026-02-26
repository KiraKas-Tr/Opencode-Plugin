# Research Template

Use this template when documenting research findings.

**Output path:** `.opencode/memory/research/YYYY-MM-DD-<topic>.md`

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

---

## Summary

[2-3 sentence answer to the research question]

---

## Key Findings

### Finding 1: [Title]
[Details]

### Finding 2: [Title]
[Details]

### Finding 3: [Title]
[Details]

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

## Verification Steps

- [ ] [Item to verify in implementation]
- [ ] [Test with specific scenario]

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
