---
name: compaction
description: Use when preparing for context compaction or session compression. Compress-first patterns with DCP beta. Replaces legacy prune/distill guidance.
---

# Compaction (Compress-First)

## What Changed in DCP Beta

| Old (v2 / legacy) | New (beta) |
|-------------------|-----------|
| `/dcp distill` | Removed |
| `/dcp prune` | Removed |
| `/dcp compress` | ✅ The single compress tool |
| 3-tool system | Single `compress` tool |

**If you see guidance referencing `distill` or `prune`, it is outdated. Use `compress` instead.**

## Compress-First Workflow

### Before starting a long task
```
/dcp stats       # baseline token state
```

### Mid-task (when yellow zone)
```
/dcp compress    # consolidate — DCP will ask permission
```

### End of heavy task
```
/dcp sweep       # aggressive final compression before /handoff
/dcp stats       # verify savings
```

## When Compaction Happens

OpenCode triggers its own internal compaction (`experimental.session.compacting`) at high context usage. DCP runs *before* that threshold with `/dcp compress` to prevent reaching it.

**Priority order:**
1. `/dcp compress` — DCP-level (smart, preserves task state)
2. OpenCode internal compaction — last resort (less targeted)

## Beads State is Protected

The `beads-context` hook injects Beads task state into every compaction event. Even after compression, agents will still see:
- Current in-progress issue
- Blocked issues
- Ready tasks

This is automatic — no extra action needed.

## Compaction Checklist

Before compressing:
- [ ] Any critical output still needed? Copy key parts to `memory/` first
- [ ] Active Beads task ID noted? (will be preserved automatically)
- [ ] Currently in the middle of a multi-file edit? Finish the file first, then compress

After compressing:
- [ ] Run `/dcp stats` to verify savings
- [ ] Continue task normally

## Anti-patterns

- ❌ Waiting until red zone (> 80%) — compress early, compress often
- ❌ Using prune/distill commands — they do not exist in beta
- ❌ Compressing during an active `multiedit` or write batch — finish writes first
