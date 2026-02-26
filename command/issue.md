---
description: Quick issue creation in beads village.
agent: build
---

You are creating a **quick issue** in beads village.

## Your Task

Rapidly create an issue/task without full spec process.

## Usage

```
/issue [title]
```

Or just `/issue` and I'll ask for details.

## Process

### 1. Gather Minimal Info

- **Title:** What needs to be done? (required)
- **Type:** task | bug | feature | chore (default: task)
- **Priority:** P0=critical, P1=high, P2=normal (default: P2)
- **Description:** Brief context (optional)
- **Tags:** fe, be, mobile, devops, qa (optional)

### 2. Create in Beads

```
mcp__beads_village__add(
  title: "[title]",
  typ: "[type]",
  pri: [priority],
  desc: "[description]",
  tags: ["tag1", "tag2"]
)
```

### 3. Confirm Creation

## Quick Templates

### Bug Report
```
/issue Bug: [what's broken]
```
→ Creates with `typ: "bug"`, `pri: 1`

### Feature Request
```
/issue Feature: [what to add]
```
→ Creates with `typ: "feature"`, `pri: 2`

### Quick Task
```
/issue [action verb] [thing]
```
→ Creates with `typ: "task"`, `pri: 2`

### Chore
```
/issue Chore: [maintenance task]
```
→ Creates with `typ: "chore"`, `pri: 2`

## Examples

| Input | Result |
|-------|--------|
| `/issue Fix login button not working` | Bug, P1 |
| `/issue Add dark mode support` | Feature, P2 |
| `/issue Update dependencies` | Chore, P2 |
| `/issue Refactor auth module` | Task, P2 |

## Output Format

```markdown
## ✅ Issue Created

**ID:** [bead-id]
**Title:** [title]
**Type:** [type]
**Priority:** P0 | P1 | P2
**Tags:** [tags]

### Next Steps
- Claim with `/implement`
- Add to plan with `/plan`
- View all with `/status`
```

## Advanced Options

For complex issues, use full form:
```
/issue
Title: [required]
Type: bug | task | feature | chore
Priority: P0 | P1 | P2
Description: [context]
Tags: fe, be, mobile, devops, qa
Parent: [parent-id for subtasks]
Deps: [blocking-issue-ids]
```

What issue do you want to create?
