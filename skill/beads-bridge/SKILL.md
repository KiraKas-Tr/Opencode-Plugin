---
name: beads-bridge
description: Use to bridge beads git-backed tasks with OpenCode's native todo system for cross-session coordination.
---

# Beads Bridge Skill

You are running the **beads-bridge** skill. Bridge between beads git-backed tasks and OpenCode todos.

## Purpose

Enables coordination between:
- **Beads git-backed tasks**: Persistent tasks in `.beads/` directory
- **OpenCode native todos**: Session-native task list

## Bridging Operations

| Action | Description |
|--------|-------------|
| Sync todos | Import beads tasks to OpenCode todo list |
| Export progress | Push OpenCode completions to beads |
| Cross-session | Maintain state across agent sessions |
| Swarm view | Unified task view for multiple agents |

## Workflow

1. Load beads state from `.beads/`
2. Bridge imports ready tasks to native todos
3. Work on tasks using native tools
4. Bridge syncs completions back to beads
5. Other agents see progress via beads git-backed tasks

## Use Cases

- Multi-agent swarms sharing a task backlog
- Long-running projects with session breaks
- Cross-workspace coordination
- Human review integration

## Best Practices

- Run bridge sync at session start and end
- Use beads git-backed tasks for persistent storage
- Use native todos for active work tracking
- Keep task titles consistent across systems
