---
name: context-management
description: Use when context is growing large or you need to decide how to handle token pressure. Compress-first workflow with DCP beta.
---

# Context Management (DCP Beta)

## Core Principle

DCP beta uses a **single `compress` tool**. There is no `prune` or `distill`.  
When context pressure builds: **compress first, then handoff if needed**.

## Context Pressure Thresholds

| Level | Context % | Action |
|-------|-----------|--------|
| 🟢 Green | < 40% | Normal — no action needed |
| 🟡 Yellow | 40–65% | Run `/dcp stats` to inspect; offload non-critical findings to `memory/` |
| 🟠 Orange | 65–80% | Run `/dcp compress` before continuing; consider `/handoff` if complex work remains |
| 🔴 Red | > 80% | Run `/dcp sweep` immediately, write `/handoff`, end session |

## DCP Commands

```
/dcp stats       # Token breakdown and savings summary
/dcp context     # Full context breakdown by source
/dcp compress    # Compress context (asks permission first by default)
/dcp sweep       # Aggressive compression for critical-level pressure
```

## Decision Flow

```
Context pressure detected?
   │
   ├── Yellow → /dcp stats → is it tool output noise? → /dcp compress
   │
   ├── Orange → /dcp compress → continue task → if still growing → /handoff
   │
   └── Red    → /dcp sweep → /handoff → end session
```

## What DCP Protects (auto-protected tools)

DCP will **never** prune output from these tools:

- `task` — subagent results
- `skill` — skill loads
- `todowrite` / `todoread` — in-session task state
- `compress` — DCP's own operations
- `batch` — batched tool calls
- `plan_enter` / `plan_exit` — plan mode boundaries

## Rules

- ✅ Compress when context > 65%
- ✅ Use `/dcp stats` proactively — do not wait until red
- ✅ Combine with `session-management` skill for handoff triggers
- ❌ Do NOT run `/dcp prune` or `/dcp distill` — unsupported in beta
- ❌ Do NOT let context hit 90%+ without `/dcp sweep` + `/handoff`

## Config Reference

Project-level config: `.opencode/dcp.jsonc`

Key settings:
- `compress.permission: "ask"` — DCP prompts before compressing
- `nudgeFrequency: 5` — nudge after every 5 iterations
- `iterationNudgeThreshold: 15` — force nudge after 15 iterations
- `nudgeForce: "soft"` — suggests, does not force
