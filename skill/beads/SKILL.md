---
name: beads
description: Use for multi-agent task coordination, file locking, and dependency management via beads-village MCP tools.
---

# Beads

**AI agents: always use `beads-village_*` MCP tools — never shell `bd` commands.**

## Session Cycle

```
init → ls(ready) → show → claim → reserve(files) → work → done
```

## Core Tools

| Tool | Purpose |
|------|---------|
| `beads-village_init(team=…)` | **First call every session** |
| `beads-village_ls(status="ready")` | List unblocked tasks |
| `beads-village_show(id)` | Read task details |
| `beads-village_claim()` | Claim next ready task |
| `beads-village_add(title, typ, pri, tags, deps)` | Create issue |
| `beads-village_reserve(paths, reason)` | Lock files before editing |
| `beads-village_done(id, msg)` | Complete + auto-release locks |
| `beads-village_msg(subj, global=true, to="all")` | Broadcast |
| `beads-village_inbox(unread=true)` | Read messages |
| `beads-village_status(include_agents=true)` | Workspace overview |
| `beads-village_sync()` | Git push/pull |

## Issue Schema

```
typ:  task | bug | feature | epic | chore
pri:  0=critical  1=high  2=normal  3=low  4=backlog
tags: fe | be | devops | qa
deps: ["bv-id"]  or  ["discovered-from:bv-id"]
```

## When to Create Issues

- Trivial (< 2 min, 1-line): skip, just do it
- Non-trivial (2+ min, 2+ files): create issue first, then work

## v1.3 API — Correct Names

| ❌ Old | ✅ Correct |
|--------|-----------|
| `beads-village_ready` | `beads-village_ls(status="ready")` |
| `beads-village_broadcast` | `beads-village_msg(global=true, to="all")` |
| `beads-village_discover` | `beads-village_status(include_agents=true)` |

See [references/api-reference.md](references/api-reference.md) for full tool params and examples.
- MCP: `beads-village` — see [mcp.json](mcp.json)
