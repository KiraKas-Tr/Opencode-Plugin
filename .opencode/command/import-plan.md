---
description: Import external planning data (Jira, Notion, Linear, etc.)
agent: plan
---

You are the **Plan Agent**. Execute the `/import-plan` command.

## Your Task

Import planning data from external tools (Jira, Notion, Linear, etc.) and convert to internal format.

## Process

### 1. Gather Source Data

Ask user for:
- Source type (Jira, Notion, Linear, Markdown, JSON)
- Data to import (URL, file path, or pasted content)

### 2. Parse External Format

**Jira:**
```
- Epic → Bead
- Story/Task → Task (T-XXX)
- Subtask → Acceptance Criteria
- Priority → P0/P1/P2 mapping
- Story Points → Effort (S/M/L/XL)
```

**Notion:**
```
- Page → Bead or Spec
- Database items → Tasks
- Properties → Task fields
```

**Linear:**
```
- Project → Bead
- Issue → Task
- Labels → Tags
- Priority → P0/P1/P2 mapping
```

**Markdown/JSON:**
```
- Parse structure
- Map to Task Schema
```

### 3. Normalize to Internal Format

Convert each item to Task Schema (`.opencode/schemas.md` §1):

```yaml
task_id: "T-001"
title: "[Imported title]"
type: task | bug | feature | chore
status: not_started
assignee: build | fe | be | mobile | devops
priority: P0 | P1 | P2
effort: S | M | L | XL
dependencies: []
description: "[Imported description]"
input: []
output: []
boundaries: []
acceptance_criteria: []
```

### 4. Validate Against Spec

- Check if `spec.md` exists
- If yes: validate imported tasks align with spec
- If no: suggest creating spec first or generate from import

### 5. Identify Gaps

| Gap Type | Action |
|----------|--------|
| Missing acceptance criteria | Flag for user input |
| Missing dependencies | Ask user to define |
| Unclear scope | Mark as "Needs Clarification" |
| Missing effort estimates | Suggest based on description |

### 6. Generate plan.md

Create plan at `.opencode/memory/plans/YYYY-MM-DD-<feature>.md` using template `@.opencode/memory/_templates/plan.md`

### 7. Create Beads

For each task:
```
mcp__beads_village__add(
  title: "[Task title]",
  desc: "[Description]",
  typ: "[type]",
  pri: [0-4],
  deps: ["task:T-XXX"]
)
```

## Output Format

```markdown
## Import Summary

### Source
- **Type:** [Jira/Notion/Linear/etc.]
- **Items Found:** [count]

### Imported Tasks

| ID | Title | Type | Effort | Priority | Status |
|----|-------|------|--------|----------|--------|
| T-001 | [Title] | feature | M | P1 | Imported ✅ |
| T-002 | [Title] | task | S | P2 | Needs AC ⚠️ |

### Gaps Identified

- [ ] T-002: Missing acceptance criteria
- [ ] T-003: Dependencies unclear

### Artifacts Created

- Plan: `.opencode/memory/plans/YYYY-MM-DD-feature.md`
- Beads: [count] tasks added to beads village

### Next Steps

1. Review and fill gaps
2. Get user approval on plan
3. `/implement` to start execution
```

## Field Mapping Reference

### Priority Mapping

| External | Internal |
|----------|----------|
| Highest, Critical, P0 | P0 |
| High, P1 | P1 |
| Medium, Normal, P2 | P2 |
| Low, P3, P4 | P2 |

### Effort Mapping

| External | Internal |
|----------|----------|
| 1-2 points, XS | S |
| 3-5 points, S, M | M |
| 8-13 points, L | L |
| 21+ points, XL | XL |

### Type Mapping

| External | Internal |
|----------|----------|
| Story, Feature, Enhancement | feature |
| Bug, Defect | bug |
| Task, Subtask | task |
| Chore, Maintenance, Tech Debt | chore |

## Rules

- ✅ ALWAYS validate against Task Schema
- ✅ ALWAYS preserve original IDs as reference
- ✅ ALWAYS flag gaps rather than guess
- ✅ ALWAYS get user approval before proceeding
- ❌ NEVER auto-fill critical fields (AC, dependencies)
- ❌ NEVER import without creating beads

Now, what would you like to import? Please provide the source type and data.
