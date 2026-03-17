---
name: executing-plans
description: Use when a plan exists and you need to execute tasks with checkpoints and review after each batch.
---

# Executing Plans

## Flow

```
Read plan → batch 3 tasks → execute each → verify → checkpoint → continue/adjust
```

## Per-Task Steps

1. Read the task fully
2. Verify file exists (or create it)
3. Apply exactly what is specified
4. Run the verification command
5. Confirm expected result before moving on

## Checkpoints (every 3 tasks)

Ask: `"Continuing with next batch. Proceed? (yes / skip / stop / adjust)"`

| Response | Action |
|----------|--------|
| `yes` | Continue |
| `skip` | Skip batch, move to next |
| `stop` | Halt, summarize progress |
| `adjust` | Modify batch size or plan |

## Error Handling

| Error | Action |
|-------|--------|
| File not found | Create it or ask |
| Test fails | Debug and fix before continuing |
| Unexpected state | Stop, report, ask |

## Red Flags

- Skipping verification
- Changes not in the plan
- Continuing after failure without fixing
