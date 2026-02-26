---
description: Current state overview of workspace and beads.
agent: build
---

You are providing a **status overview** of the current workspace and beads.

## Your Task

Show the current state of work: beads, tasks, files, and git status.

## Process

### 1. Check Beads Village

```
mcp__beads_village__status()
```

### 2. Check Git State

```bash
git status
git branch --show-current
git log --oneline -5
```

### 3. Check Artifacts

Look for:
- `.opencode/memory/specs/` — Active specifications
- `.opencode/memory/plans/` — Implementation plans
- `.opencode/memory/handoffs/` — Pending handoffs
- `.opencode/memory/research/` — Research docs

### 4. Generate Overview

## Status Report Template

```markdown
## 📊 Status Overview

**Date:** YYYY-MM-DD HH:MM
**Branch:** [current branch]
**Workspace:** [path]

---

### 🎯 Beads Village

| Status | Count |
|--------|-------|
| Open | X |
| In Progress | X |
| Closed | X |

**Current Task:** [ID] [Title] (if any)

**Ready to Claim:**
1. [ID] [Title] (P[priority])
2. [ID] [Title] (P[priority])

---

### 📁 Active Artifacts

| Type | File | Status |
|------|------|--------|
| Spec | YYYY-MM-DD-feature.md | ✅ Active |
| Plan | YYYY-MM-DD-feature.md | ✅ Active |
| Research | YYYY-MM-DD-topic.md | 📚 Reference |
| Handoff | YYYY-MM-DD-phase.md | ⏸️ Paused |

---

### 🔧 Git Status

**Branch:** `feature/xyz`
**Ahead/Behind:** +2 / -0

**Uncommitted Changes:**
- M path/to/modified.ts
- A path/to/new.ts

**Recent Commits:**
1. abc1234 - feat: added X
2. def5678 - fix: resolved Y

---

### 📋 Quick Actions

| Need | Command |
|------|---------|
| Start new feature | `/create` |
| Begin implementing | `/start` |
| Resume paused work | `/resume` |
| Review changes | `/review` |
| Ship & merge | `/ship` |
| Commit changes | `/commit` |

---

### ⚠️ Alerts

- [Any blockers or issues]
- [Any drift detected]
- [Any stale handoffs]
```

## What I Check

| Area | Tool |
|------|------|
| Beads | `mcp__beads_village__status()` |
| Tasks | `mcp__beads_village__ls()` |
| Ready tasks | `mcp__beads_village__ready()` |
| Reservations | `mcp__beads_village__reservations()` |
| Messages | `mcp__beads_village__inbox()` |
| Git | `git status`, `git log` |
| Artifacts | `glob`, `Read` |

Now generating status overview...
