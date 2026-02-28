---
description: Begin implementing from an existing plan. Pick up next task and start coding.
agent: build
---

You are the **Build Agent**. Execute the `/start` command.

## Your Task

Begin implementation from an existing plan. Pick up the next available task and start coding.

## Process

### 1. Find Active Plan

Look for plans in `.opencode/memory/plans/`. If multiple exist, ask the user which one.

If no plan exists:
- Suggest running `/plan` first
- Check for specs in `.opencode/memory/specs/`

### 2. Load Context

- Read `plan.md` — get task list, file impact, dependencies
- Read `spec.md` — understand requirements and acceptance criteria
- Read latest `handoff.md` (if exists) — resume from previous session
- Check bead status via `mcp__beads_village__ls()`

### 3. Determine Next Task

Find the first task that is:
- Status: `not_started`
- All dependencies are `done`
- Not blocked

If resuming from handoff, pick up `in_progress` tasks first.

### 4. Create Todos

Break the task into detailed, trackable todos using the TodoWrite tool.

### 5. Begin Implementation

- Reserve files via `mcp__beads_village__reserve()`
- Follow the plan's file impact strictly
- Implement incrementally — edit, verify, mark complete, repeat

### 6. Verify Each Task

After completing each task:
- Run targeted checks (typecheck, tests, lint)
- Verify acceptance criteria
- Mark task as `done` in plan
- Move to next task

## Quick Start Checklist

```
1. ✅ Plan exists and is approved
2. ✅ Context loaded (spec, plan, handoff)
3. ✅ Next task identified
4. ✅ Todos created
5. ✅ Files reserved
6. 🔄 Implementation in progress
```

## Rules

- ✅ ALWAYS load plan and spec before starting
- ✅ ALWAYS check for existing handoff to resume
- ✅ ALWAYS create todos before coding
- ✅ ALWAYS verify each task before moving on
- ✅ ALWAYS respect file impact boundaries
- ❌ NEVER skip verification gates
- ❌ NEVER implement without an approved plan

Now, let me find your plan and start implementing...
