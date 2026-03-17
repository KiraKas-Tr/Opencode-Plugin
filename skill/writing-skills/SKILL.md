---
name: writing-skills
description: Use when creating a new skill. Produces a well-structured skill package with SKILL.md, optional references/, and optional mcp.json following the Agent Skills standard.
---

# Writing Skills

## Skill Anatomy

```
skill-name/
├── SKILL.md              ← required: frontmatter + workflow
├── mcp.json              ← if skill calls MCP tools
└── references/
    └── *.md              ← knowledge details, loaded on-demand
```

## SKILL.md Format

```markdown
---
name: skill-name          # lowercase, hyphens only, matches directory name
description: …            # max 200 chars — trigger condition + what it does
---

# Skill Title

## Workflow / Process
[core steps — what the agent should do]

## Rules / Checklist
[hard rules, decision tables]

## Red Flags
[what to watch for]

## References       ← only if references/ exist
- [name](references/file.md) — one-line description
- MCP: server-name — see [mcp.json](mcp.json)
```

## Decision: What Belongs Where

| Content | Where |
|---------|-------|
| Trigger condition, workflow, rules | `SKILL.md` body |
| Tool signatures, long examples, lookup tables | `references/*.md` |
| MCP server connection + tool list | `mcp.json` |
| Nothing extra needed | `SKILL.md` only |

## When to Add references/

Split into a reference file when:
- Section exceeds ~20 lines and is reference-only (not workflow)
- Content is only needed for specific sub-tasks, not always
- Examples/tables that would bloat the main SKILL.md

Each reference file must be linked from SKILL.md so the agent knows it exists.

## When to Add mcp.json

Add `mcp.json` when the skill calls MCP tools directly.  
List only the tools the skill actually uses — not all tools the server exposes.

## Quality Checklist

- [ ] `name` matches directory name, lowercase-hyphen only
- [ ] `description` states *when to invoke* + *what it does* (≤ 200 chars)
- [ ] SKILL.md body has a clear workflow or process section
- [ ] No "You are running the X skill." boilerplate
- [ ] Long reference content split into `references/*.md`
- [ ] Each reference file linked from SKILL.md
- [ ] `mcp.json` present if and only if skill calls MCP tools
- [ ] `mcp.json` lists only tools this skill actually uses
- [ ] Red Flags section present

## References

- [Skill anatomy reference](references/skill-anatomy.md) — full format spec for all three files
