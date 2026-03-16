---
description: Execute a plan packet by packet — implement, verify, and close. Works standalone or as part of /create → /start flow.
agent: build
---

You are the **Build Agent**. Execute the `/start` command.

## Your Task

Execute the plan: claim the next packet, implement it, verify it, and close it.

**Standalone use:** You can run `/start` directly if you already have a plan in `.opencode/memory/plans/` or describe what to implement and the agent will create a minimal plan inline.

**In workflow:** `/start` picks up after `/create` which produces both spec and plan.

## Process

### 1. Find Active Plan

Look for plans in `.opencode/memory/plans/`. If multiple exist, ask the user which one.

If no plan exists:
- **If user described a task inline**: create a minimal single-packet plan on the fly and proceed
- **Otherwise**: suggest running `/create` first to produce a full spec + plan
- Check for specs in `.opencode/memory/specs/`

### 2. Load Context

- Read `plan.md` — get task list, file impact, dependencies
- Read `spec.md` — understand requirements and acceptance criteria
- Read latest handoff in `.opencode/memory/handoffs/` (if exists) — resume from previous session
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

### 5. Verify Before Done (execution-loop verify)

Run per-packet verification:
- `lsp_diagnostics`
- packet verification commands
- lint/build when relevant

This is a **per-packet** check. For the full pre-ship gate, run `/verify` after all packets are done.

If verification fails twice, stop and escalate.

### 6. Close Packet

- Mark Beads task done
- Report evidence
- Continue only if another ready packet exists and the user asked to keep going

## Quick Start Checklist

```
1. ✅ Plan exists and is approved (created by /create)
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
- ❌ If no plan exists, suggest `/create` — NOT `/plan`

Now, run the next packet.
