---
name: beads
description: Use for multi-agent task coordination, file locking, and dependency management via beads-village tools.
---

# Beads Skill

You are running the **beads** skill.

## Two Interfaces — Know Which to Use

| Interface | When | How |
|-----------|------|-----|
| **`bd` CLI** | User runs in terminal, human workflow | `bd create`, `bd ready`, `bd close` |
| **`beads-village_*` MCP** | AI agents in OpenCode sessions | `beads-village_add`, `beads-village_claim` |

**As an AI agent: always use `beads-village_*` MCP tools, never shell `bd` commands.**

---

## Agent Workflow (beads-village MCP)

### Leader agent
```
init(leader=true) → add tasks → assign(id, role) → monitor
```

### Worker agent
```
init(role="be/fe/...") → claim() → reserve(paths) → work → done(id, msg) → restart
```

**Always call `init` first, every session.**

---

## Tool Reference

### Lifecycle
| Tool | Use | Key params |
|------|-----|------------|
| `beads-village_init` | Join workspace — FIRST call every session | `team`, `role`, `leader`, `start_tui` |
| `beads-village_claim` | Claim next ready task (auto-filtered by role) | — |
| `beads-village_done` | Complete task, release all file locks | `id`, `msg` |

### Issue Management
| Tool | Use | Key params |
|------|-----|------------|
| `beads-village_add` | Create issue | `title`, `desc`, `typ`, `pri`, `tags`, `deps`, `parent` |
| `beads-village_assign` | Assign to role (leader only) | `id`, `role` |
| `beads-village_ls` | List issues | `status="open\|closed\|ready\|all"` |
| `beads-village_show` | Get issue details | `id` |

### File Locking (prevent merge conflicts)
| Tool | Use | Key params |
|------|-----|------------|
| `beads-village_reserve` | Lock files before editing | `paths[]`, `ttl`, `reason` |
| `beads-village_release` | Unlock files early | `paths[]` |
| `beads-village_reservations` | Check who has what locked | — |

### Messaging
| Tool | Use | Key params |
|------|-----|------------|
| `beads-village_msg` | Send message or broadcast | `subj`, `body`, `to`, `global=true` for broadcast |
| `beads-village_inbox` | Read messages | `unread=true` |

### Status & Maintenance
| Tool | Use | Key params |
|------|-----|------------|
| `beads-village_status` | Workspace overview | `include_agents=true`, `include_bv=true` |
| `beads-village_sync` | Git sync push/pull | — |
| `beads-village_cleanup` | Remove old closed issues | `days` |
| `beads-village_doctor` | Check/repair database | — |

---

## v1.3 API Changes (important)

| Old (broken) | Correct v1.3 |
|---|---|
| `beads-village_ready` | `beads-village_ls(status="ready")` |
| `beads-village_broadcast` | `beads-village_msg(global=true, to="all")` |
| `beads-village_discover` | `beads-village_status(include_agents=true)` |

---

## Issue Schema

```
title     string   required
desc      string   description
typ       string   task|bug|feature|epic|chore  (default: task)
pri       int      0=critical 1=high 2=normal 3=low 4=backlog  (default: 2)
tags      []string role tags: fe, be, mobile, devops, qa
deps      []string dependency IDs
parent    string   parent epic ID
```

---

## File Locking Protocol

1. **Before editing any shared file** → `reserve(paths=[...], reason="task-id")`
2. TTL defaults to 10 min — extend if task is longer
3. **Check before editing** → `reservations()` to see active locks
4. Locks auto-release on `done()` — no manual release needed at end

---

## Priority Rules

- Trivial fix (< 2 min): skip Beads, just do it
- Non-trivial (2+ min, 2+ files): create issue first, then work
- Multi-concern task: create parent epic + child tasks before starting

## Dependency Format

```
deps=["task:bd-123"]          # depends on task bd-123
deps=["discovered-from:bd-5"] # discovered while working on bd-5
```

---

## Example: Build Agent Session

```python
# Session start
beads-village_init(team="myproject")

# Create work item
beads-village_add(title="Fix auth bug", typ="bug", pri=1, tags=["be"])

# Claim and lock
beads-village_claim()
beads-village_reserve(paths=["src/auth/login.ts"], reason="fix-auth-bug")

# ... implement ...

# Done (releases locks automatically)
beads-village_done(id="proj-abc", msg="Fixed null check in token validation")
```
