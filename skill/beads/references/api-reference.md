# Legacy Beads Village API Reference

This reference documents the optional `beads-village_*` MCP helpers only.
For primary task tracking, use `br` CLI first.

## Full Tool Parameters

### beads-village_init
```
team:      string  (required)
role:      string  (be | fe | devops | qa)
leader:    bool    (default: false)
start_tui: bool    (default: false)
```

### beads-village_add
```
title:   string  (required)
desc:    string
typ:     task | bug | feature | epic | chore
pri:     0–4  (0=critical, 4=backlog, default: 2)
tags:    string[]
deps:    string[]  (e.g. ["bv-1", "discovered-from:bv-2"])
parent:  string  (epic id)
```

### beads-village_reserve
```
paths:  string[]  (required)
reason: string
ttl:    int  (minutes, default: 10)
```

### beads-village_msg
```
subj:       string  (required)
body:       string
to:         string
global:     bool    (true = team broadcast)
importance: string
thread:     string
```

## Example: Legacy Compatibility Session

```
beads-village_init(team="myproject")
beads-village_inbox(unread=true)
beads-village_ls(status="ready")

# → pick issue bv-42
beads-village_show("bv-42")
beads-village_claim()
beads-village_reserve(paths=["src/auth/login.ts"], reason="bv-42")

# ... implement ...

beads-village_done(id="bv-42", msg="Fixed null check in token validation")
beads-village_sync()
```

## File Locking Protocol (optional legacy)

1. `beads-village_reservations()` — check what's locked before editing
2. `beads-village_reserve(paths=[…])` — lock your files
3. TTL default: 10 min — extend for longer tasks
4. `beads-village_done()` — auto-releases all locks, no manual release needed

When possible, prefer the `br` workflow documented in `skill/beads/SKILL.md` and use these helpers only when your local runtime still depends on Beads Village.
