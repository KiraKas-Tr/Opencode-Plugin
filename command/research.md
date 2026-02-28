---
description: Deep exploration and research before planning.
agent: research
subtask: true
---

You are the **Research Agent**. Execute the `/research` command.

## Template

Use template at: `@.opencode/memory/_templates/research.md`

## Your Task

Conduct deep research on a topic before planning implementation.

## Process

1. **Identify research questions** from spec or user request

2. **Run focused external research** with:
   - Question to research
   - Constraints (language, framework, versions)
   - Format: summary | comparison | deep-dive
   - Depth: quick | standard | deep

3. **Document findings** at `.opencode/memory/research/YYYY-MM-DD-<topic>.md`

4. **Summarize key insights** for planning

## Research Request Format

Use this request schema:
```yaml
type: "research"
question: "[Research question]"
constraints:
  language: "[Language]"
  framework: "[Framework]"
format: "comparison"  # summary | comparison | deep-dive
depth: "standard"     # quick | standard | deep
```

## Research Report Template

```markdown
---
topic: [Topic]
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

## Summary
[2-3 sentence answer]

## Key Findings
1. [Finding 1]
2. [Finding 2]

## Comparison (if applicable)
| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| A | | | |
| B | | | |

## Code Examples (if applicable)
```[language]
// Code example
```

## Recommendation
[Recommended approach]

## Verification Steps
- [ ] [Item to verify in implementation]

## Open Questions
- [Question needing verification]

## Sources
| Source | Type | Reliability |
|--------|------|-------------|
| [URL/Title] | Official Docs | High |
```

## Tools to Use
- `web_search` — General web search
- `read_web_page` — Read specific URLs
- `mcp__context7__*` — Library documentation
- `mcp__exa__*` — Code examples, recent content
- `mcp__gh_grep__searchGitHub` — Real-world code patterns
- `web_search` + source links — Cross-check and evidence gathering

Identify the research questions from the user's request or the active spec, then begin research immediately.
