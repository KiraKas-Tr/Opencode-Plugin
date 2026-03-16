---
description: Run compressed execution loop from an existing plan. Claim one packet, implement, verify, and close it.
agent: build
---

You are the **Build Agent**. Execute the `/start` command.

## Your Task

Run the compressed execution loop: load the active plan, claim the next packet, implement it, verify it, and close it.

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

### 3. Determine Next Packet

Find the first task / packet that is executable:
- dependencies satisfied
- within Beads ready state
- not blocked

If resuming from handoff, pick up `in_progress` tasks first.

### 4. Execute Packet

- Reserve packet files via `mcp__beads_village__reserve()`
- Follow `files_in_scope` strictly
- Implement only the active packet

### 5. Verify Before Done

Run in order:
- `lsp_diagnostics`
- packet verification commands
- lint/build when relevant

If verification fails twice, stop and escalate.

### 6. Close Packet

- mark Beads task done
- report evidence
- continue only if another ready packet exists and the user asked to keep going

## Quick Start Checklist

```
1. ✅ Plan exists and is approved
2. ✅ Context loaded (spec, plan, handoff)
3. ✅ Next task identified
4. ✅ Packet selected
5. ✅ Files reserved
6. 🔄 Execute + verify loop in progress
```

## Rules

- ✅ ALWAYS load plan and spec before starting
- ✅ ALWAYS check for existing handoff to resume
- ✅ ALWAYS execute one packet at a time
- ✅ ALWAYS verify before marking packet done
- ✅ ALWAYS respect file impact boundaries
- ❌ NEVER skip verification gates
- ❌ NEVER implement without an approved plan

Now, run the next packet.
