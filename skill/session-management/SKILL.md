---
name: session-management
description: Use for managing context growth, task switching, and session continuity in long-running work.
---

# Session Management

## Context Thresholds

| State | Context % | Action |
|-------|-----------|--------|
| Green | < 50% | Normal |
| Yellow | 50–75% | Offload findings to `memory/` |
| Orange | 75–90% | Prep handoff doc |
| Red | > 90% | Run `/handoff`, end session |

## Session Start

1. `beads-village_init` → join workspace
2. `beads-village_inbox(unread=true)` → check blockers
3. Read `memory/_digest.md` + latest handoff if continuing

## Session End

1. Complete or checkpoint current task
2. Run `/handoff` → write handoff doc
3. `beads-village_sync` → push state
4. Release all file reservations via `beads-village_done`

## Red Flags

- Crossing 90% without writing a handoff
- Not reading the handoff when resuming
- Losing task state between sessions
