---
name: beads
description: Use for multi-agent task coordination with `br` and optional legacy beads-village helpers.
---

# Beads

**Preferred tracker:** `br` (`beads_rust`) with `.beads/` storage.

Use `br` CLI first for task state. Use `beads-village_*` only as optional legacy compatibility when reservations, inbox-style messaging, or existing local workflows still depend on it.

## Session Cycle

```
br init → br ready --json → br show <id> --json → br update <id> --status in_progress --claim → work → br close <id> --reason "Completed" --json → br sync --flush-only
```

## Preferred Commands

| Command | Purpose |
|---------|---------|
| `br init` | Initialize `.beads/` if missing |
| `br ready --json` | List unblocked tasks |
| `br show <id> --json` | Read task details |
| `br create --title ... --description ... --type ... --priority ...` | Create issue |
| `br update <id> --status in_progress --claim` | Claim/start work |
| `br close <id> --reason "Completed" --json` | Complete work |
| `br sync --flush-only` | Flush `.beads/` state before commit/push |
| `br sync --import-only` | Re-import `.beads/` state after pull/rebase |

## Optional Legacy MCP Helpers

| Tool | Use only when... |
|------|------------------|
| `beads-village_reserve(paths, reason)` | You need explicit file reservations in a shared workspace |
| `beads-village_reservations()` | You need to inspect existing locks |
| `beads-village_inbox(unread=true)` | Your team still uses village-style messaging |
| `beads-village_status(include_agents=true)` | You need legacy workspace/agent discovery |
| `beads-village_msg(...)` | You need a compatibility broadcast path |

## Issue Schema

```
typ:  task | bug | feature | epic | chore
pri:  0=critical  1=high  2=normal  3=low  4=backlog
tags: fe | be | devops | qa
deps: ["br-id"]  or  ["discovered-from:br-id"]
```

## When to Create Issues

- Trivial (< 2 min, 1-line): skip, just do it
- Non-trivial (2+ min, 2+ files): create issue first, then work

Legacy `beads-village` remains optional compatibility only. Do not make it a hard prerequisite in new workflows.
