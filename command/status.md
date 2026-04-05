---
description: Instant workspace snapshot — tracker state, ready work, git state, and memory artifacts in one view.
agent: build
---

You are providing a **status overview** of the current workspace and task tracker.

## Your Task

Show the current state of work: tracker state, tasks, files, and git status.

## Process

### 1. Check Task Tracking

Preferred path:

```bash
br ready --json
br list --json
```

If a legacy `beads-village` MCP is installed, you may also inspect reservations, inbox state, or agent presence using the matching MCP tools.

### 2. Check Git State

```bash
git status
git branch --show-current
git log --oneline -5
```

### 3. Check Artifacts

Look for:
- `.opencode/memory/discussions/` — Discussion artifacts
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

### 🎯 Tracker State

| Status | Count |
|--------|-------|
| Open | X |
| In Progress | X |
| Closed | X |

**Current Task:** [ID] [Title] (if any)

**Ready to Claim:**
1. [ID] [Title] (P[priority])
2. [ID] [Title] (P[priority])

**Tracker Source:** `br` / `beads-village` / `none`

---

### 📁 Active Artifacts

| Type | File | Status |
|------|------|--------|
| Discussion | YYYY-MM-DD-topic.md | 🧭 Intent Locked |
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
| Start new feature | `/discuss` |
| Begin implementing | `/start` |
| Resume paused work | `/resume` |
| Ship & land | `/ship` |
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
| Tracker | `br ready --json`, `br list --json` |
| Legacy reservations | `beads-village_reservations()` when available |
| Legacy inbox | `beads-village_inbox()` when available |
| Git | `git status`, `git log` |
| Artifacts | `glob`, `Read` |

Now generating status overview...
