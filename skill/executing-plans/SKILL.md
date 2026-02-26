---
name: executing-plans
description: Use when a plan exists and you need to execute tasks with checkpoints and review.
---

# Executing Plans Skill

You are running the **executing-plans** skill. Execute implementation plans systematically with checkpoints.

## Batch Execution

Default: **3 tasks per batch**

After each batch:
1. Run verification commands
2. Summarize changes made
3. Ask for confirmation to continue

## Execution Flow

```
Read plan → Select next batch → Execute → Verify → Checkpoint → Continue/Adjust
```

## Checkpoint Questions

After each batch, ask:
- "Continuing with next 3 tasks. Proceed? (yes/skip/stop/adjust)"
- If "skip": Skip current batch, move to next
- If "stop": Halt execution, summarize progress
- If "adjust": Modify batch size or plan

## Per-Task Execution

1. **Read** the task completely
2. **Verify** the file exists (or will be created)
3. **Apply** the exact change specified
4. **Run** the verification command
5. **Confirm** expected result

## Error Handling

| Error Type | Action |
|------------|--------|
| File not found | Create it or ask for clarification |
| Test fails | Debug, fix, re-run before continuing |
| Unexpected state | Stop, report, ask for guidance |

## Red Flags

- Skipping verification
- Making changes not in the plan
- Continuing after failure without fixing
- Modifying batch size without asking
