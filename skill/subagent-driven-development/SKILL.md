---
name: subagent-driven-development
description: Use when working on multi-task development cycles. Fresh subagent per task for fast iteration with code review between tasks via @review.
---

# Subagent-Driven Development Skill

You are running the **subagent-driven-development** skill. Work autonomously for hours with quality gates between tasks.

## Core Principle

Fresh subagent per task. Each task is a clean slate with clear objectives. Code review between tasks via @review agent ensures quality accumulation.

## Workflow

### 1. Task Breakdown
- Split work into discrete, completable tasks
- Each task should be 15-30 minutes of work
- Tasks should have clear success criteria
- Order tasks by dependency

### 2. Task Execution Cycle
```
For each task:
  1. Spawn fresh subagent for task
  2. Subagent completes task autonomously
  3. Run @review for code quality check
  4. Fix issues from review
  5. Commit or stage changes
  6. Move to next task
```

### 3. Quality Gates
Between each task:
- Run @review agent on changed files
- Address all critical and high-priority issues
- Verify tests pass
- Confirm task completion criteria met

## Agent Autonomy

The subagent works autonomously:
- No mid-task questions to user
- Make reasonable assumptions
- Document decisions in code
- Flag blockers only when truly stuck

## Benefits

| Benefit | Why |
|---------|-----|
| Fresh context | No accumulated confusion |
| Fast iteration | Quick task completion |
| Quality accumulation | Review catches issues early |
| Autonomous work | Hours of productive work |

## Anti-Patterns

- Tasks too large (lose the benefit of fresh context)
- Skipping review between tasks
- Asking user for every decision
- No clear success criteria per task

## When to Use

- Multi-hour development sessions
- Features with multiple components
- Refactoring with clear steps
- Bug fix chains with review gates
