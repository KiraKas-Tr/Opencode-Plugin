---
name: beads
description: Use for multi-agent task coordination, file locking, and dependency management via beads-village tools.
---

# Beads Skill

You are running the **beads** skill. Multi-agent coordination via beads-village.

## Core Cycle

```
claim → reserve → work → done
```

## beads-village Tools

| Tool | Purpose |
|------|---------|
| `beads-village_claim` | Pick up next ready task |
| `beads-village_reserve` | Lock files before editing |
| `beads-village_done` | Complete task, release files |
| `beads-village_ready` | List tasks with no blockers |
| `beads-village_add` | Create new task |
| `beads-village_assign` | Delegate to role (leader only) |
| `beads-village_ls` | List all tasks |
| `beads-village_show` | Get task details |
| `beads-village_status` | Workspace overview |

## Dependency Management

- Tasks with `deps` wait for dependencies to complete
- Use `beads-village_ready` to find unblocked tasks
- Check status with `beads-village_status`

## File Locking Protocol

1. Call `reserve` before editing shared files
2. TTL defaults to 10 minutes
3. Locks auto-release on `done`
4. Check `reservations` before editing

## Session Workflow

1. `beads-village_init` on session start
2. `beads-village_claim` to get work
3. `beads-village_reserve` files you'll edit
4. `beads-village_done` when complete
5. `beads-village_sync` to push/pull changes

## Best Practices

- Always check dependencies before claiming
- Reserve files early to prevent conflicts
- Use descriptive task titles
- Tag tasks with roles (fe, be, mobile, devops, qa)
