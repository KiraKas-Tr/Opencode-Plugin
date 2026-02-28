---
name: session-management
description: Use for managing context growth, task switching, and session continuity in long-running work.
---

# Session Management Skill

You are running the **session-management** skill. Context and continuity management.

## Context Thresholds

| State | Context % | Action |
|-------|-----------|--------|
| Green | < 50% | Normal operation |
| Yellow | 50-75% | Start summarizing, offload to memory |
| Orange | 75-90% | Aggressive context pruning, handoff prep |
| Red | > 90% | Initiate session handoff |

## Session Tools

| Tool | Purpose |
|------|---------|
| Memory artifacts | Save state to `.opencode/memory/` |
| Handoff docs | Session state for next agent |
| Beads sync | Persist tasks to `.beads/` |
| Git commits | Checkpoint progress |

## Workflow Patterns

### Starting a Session
1. Check Beads for in-progress tasks
2. Read handoff if continuing previous session
3. Claim ready tasks
4. Begin work

### During Session
1. Monitor context usage
2. Write specs/plans to memory as created
3. Commit incremental progress
4. Sync Beads regularly

### Ending a Session
1. Complete or checkpoint current task
2. Write handoff document
3. Sync all state to git/Beads
4. Release file reservations

## Best Practices

- Check context percentage periodically
- Write to memory before hitting thresholds
- Use handoff documents for continuity
- Keep session state in version control
