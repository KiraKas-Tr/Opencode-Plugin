---
name: context-engineering
description: Use when designing how information should flow through context — what to include, exclude, protect, and compress. DCP beta compress-only model.
---

# Context Engineering (DCP Beta)

## Model

DCP beta: **single compress tool** at `@tarquinen/opencode-dcp@beta`.  
There is no `distill` or `prune`. All context reduction goes through `compress`.

## Layers of Context Control

```
Session start    → beads-context hook injects task state
                 → memory-digest hook injects project observations
Mid-session      → /dcp compress (DCP) + truncator hook (output limits)
Session end      → /dcp sweep + /handoff (disk persistence)
Compaction event → OpenCode internal + beads-context preservation
```

## What to Keep vs. Compress

| Content | Strategy |
|---------|----------|
| Current task (Beads state) | **Always keep** — auto-protected |
| Skill content just loaded | Keep until task using it is done |
| Subagent results (`task` tool) | **Always keep** — auto-protected |
| Repeated tool outputs (same file read multiple times) | Compress — DCP deduplication handles this |
| Error traces from resolved issues | Compress — DCP `purgeErrors` strategy |
| Old superseded file writes | Compress — DCP `supersedeWrites` strategy |

## DCP Strategies Reference

| Strategy | What it removes | Default |
|----------|----------------|---------|
| `deduplication` | Repeated identical tool outputs | enabled |
| `supersedeWrites` | Earlier versions of the same file write | enabled |
| `purgeErrors` | Tool errors older than N turns | enabled (4 turns) |

## Protecting Critical Context

Add to `.opencode/dcp.jsonc` → `protectedToolNames` to prevent DCP from compressing specific tool outputs:

```jsonc
"protectedToolNames": [
  "task", "skill", "todowrite", "todoread",
  "compress", "batch", "plan_enter", "plan_exit"
]
```

Default protected tools are set in `.opencode/dcp.jsonc`. Do not remove them.

## Token Budget Signals

Watch for DCP nudges — when `nudgeFrequency: 5` is hit, DCP will suggest compression.  
At `iterationNudgeThreshold: 15`, it becomes more insistent (still `soft` force — not automatic).

## Common Patterns

### Pattern 1: Long research task
```
Start → /dcp stats (baseline)
→ multiple @research / @explore calls
→ context yellow → /dcp compress
→ continue
→ done → /dcp sweep (cleanup)
```

### Pattern 2: Multi-packet implementation
```
Before each new packet → /dcp stats
→ if > 55% → /dcp compress before starting packet
→ complete packet → evidence bundle
→ repeat
```

### Pattern 3: Session handoff
```
Task complete or blocked
→ /dcp compress (reduce context noise)
→ /handoff (persist state to disk)
→ beads-village_done or leave open
→ end session
```

## Anti-patterns

- ❌ Referencing `/dcp prune` or `/dcp distill` — removed in beta
- ❌ Expecting automatic compression — `permission: "ask"` means DCP waits for approval
- ❌ Loading large skill files repeatedly — load once, reference by name after
- ❌ Ignoring DCP nudges — they are signals, not noise
