---
name: beads-bridge
description: Use to bridge beads git-backed tasks with OpenCode's native todo system for cross-session coordination.
---

# Beads Bridge Skill

Bridge between **beads-village MCP tasks** (persistent, git-backed) and **OpenCode native todos** (session-only display).

## Mental Model

```
beads-village issues  ←→  OpenCode todos
(persists across sessions)   (UI display only)
```

- **Beads** = source of truth for all tasks
- **`todowrite`** = in-session UI mirror only, for human readability
- Never use `todowrite` as primary task tracking — it resets each session

---

## Sync Pattern

### Session Start
```python
# 1. Join workspace
beads-village_init(team="project")

# 2. See what's ready
beads-village_ls(status="ready")

# 3. Mirror to session todos (optional, for UI)
todowrite([{content: issue.title, status: "pending"} for issue in ready_issues])

# 4. Claim your task
beads-village_claim()
```

### Session End
```python
# 1. Close completed issues in beads
beads-village_done(id="proj-abc", msg="what was done")

# 2. Sync to git
beads-village_sync()
```

---

## Key Rules

- **Beads is authoritative** — if todo and beads conflict, beads wins
- **Sync at session start** — always check beads before assuming state
- **Don't create todos for long-running work** — create beads issues instead
- Todos are for current session context only; beads survive across sessions and agents

---

## Multi-Agent Coordination

When multiple agents share a project:

```python
# Check who's working on what
beads-village_status(include_agents=true)

# Check file locks before editing
beads-village_reservations()

# Broadcast progress to team
beads-village_msg(subj="Auth done", body="Token endpoint ready", global=true, to="all")

# Read team messages
beads-village_inbox(unread=true)
```
