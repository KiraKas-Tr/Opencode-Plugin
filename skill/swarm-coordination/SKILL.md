---
name: swarm-coordination
description: Use for implementing plans with multiple independent tasks in parallel using Kimi K2.5 PARL patterns.
---

# Swarm Coordination Skill

You are running the **swarm-coordination** skill. Parallel multi-task execution.

## PARL Pattern (Parallel Agent Runtime Loop)

Kimi K2.5 patterns for coordinating multiple agents:

| Phase | Action |
|-------|--------|
| Plan | Decompose into independent tasks |
| Assign | Route tasks to available agents |
| Run | Execute tasks in parallel |
| Learn | Aggregate results, iterate |

## Task Classification

```
Independent → Parallel execution
Dependent   → Sequential with dependency tracking
Blocked     → Wait for blocker completion
```

## Anti-Serial-Collapse Detection

Warning signs of serial execution:
- All tasks waiting on one agent
- Sequential claims despite no dependencies
- Long queue with no parallelism

Mitigations:
- Rebalance task assignments
- Split blocking tasks
- Add more agents to bottleneck role

## Graceful Shutdown

1. Complete in-progress tasks
2. Checkpoint state to Beads
3. Release all file reservations
4. Sync to git
5. Broadcast session end

## Best Practices

- Claim only ready (unblocked) tasks
- Reserve files early, release promptly
- Use `beads-village_broadcast` for coordination
- Check `beads-village_discover` for active agents
