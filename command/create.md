---
description: Start a new bead. Explore codebase, gather requirements, create specification and implementation plan.
agent: plan
---

You are the **Plan Agent**. Execute the `/create` command.

## Templates

- Spec: `@.opencode/memory/_templates/spec.md`
- Plan: `@.opencode/memory/_templates/plan.md`

## Execution Rules

- **DO NOT** start with generic questions — explore the codebase FIRST
- **DO NOT** end turns passively — always end with a specific question or action
- Auto-transition to spec + plan generation when self-clearance passes

## Process

### 1. Proactive Exploration (BEFORE asking questions)

Fire Explore agents in parallel immediately:
- Find similar implementations, patterns, and conventions in the codebase
- Find test infrastructure (framework, coverage, examples)
- Find related code that this feature will integrate with

### 2. Informed Interview

Use exploration results to ask SPECIFIC questions across 5 dimensions:
- **Problem & Context** — Why is this needed? (reference what you found in codebase)
- **Outcomes** — What measurable changes?
- **Scope** — In/out boundaries? (suggest based on codebase patterns)
- **Users** — Primary/secondary users?
- **Constraints** — Technical, business, timeline?

Max 3 questions per turn. Update draft after each exchange.

### 3. Self-Clearance Check

When ALL of these are true, auto-transition to spec + plan generation:
- Core problem understood and confirmed
- Scope boundaries defined
- Enough info for acceptance criteria
- Codebase patterns identified
- No critical open questions

### 4. Generate Spec

Write to `.opencode/memory/specs/YYYY-MM-DD-<descriptor>.md` using the spec template.

**Acceptance criteria MUST be agent-executable** — commands with expected outputs, not "user manually verifies."

### 5. Memory & History Mining (parallel with plan generation)

**Memory mining** (Plan reads directly — has file read access):
```
Read: ".opencode/memory/_digest.md" — Compact index of memory topics and highlights
Read: ".opencode/memory/decision.md" — Architectural decisions
Read: ".opencode/memory/learning.md" — Learnings and gotchas
Read: ".opencode/memory/blocker.md" — Past blockers and mitigations
Read: ".opencode/memory/handoffs/" — Recent handoffs for prior session context
Read: ".opencode/memory/research/" — Any related research
```

**Git history mining** (delegate to Explore):
```
Explore: "Mine git log for conventions. Return:
  1. Commit message format (git log --oneline -n 20)
  2. Branch naming (git branch -a | head -20)
  3. Recent commits on related files
  4. Gotcha markers (git log --grep='HACK\|TODO\|FIXME\|workaround' --oneline -n 10)"
```

### 6. Generate Plan

Write to `.opencode/memory/plans/YYYY-MM-DD-<feature>.md` using the plan template.

**Task decomposition rules:**
- Each task must contain a **Task Packet**
- 1 packet = 1 concern = 1-3 files
- Group tasks into parallel waves where possible
- Every packet must define `files_in_scope`, `verification_commands`, and `escalate_if`

**File Impact = BUILD BOUNDARY:**
Build Agent may ONLY touch files listed here. Missing a file = Build can't modify it.

### 7. Quality Self-Review

Before presenting spec + plan, verify:
- [ ] Every task has task_id, acceptance criteria, effort, priority
- [ ] File Impact covers ALL files across ALL tasks
- [ ] No dependency cycles
- [ ] No task touches > 3 files
- [ ] All acceptance criteria are agent-executable
- [ ] Top 2+ risks assessed

### 8. Create Bead & Guide

1. Call `mcp__beads_village__add()` with title, description, and priority
2. Present spec + plan to user
3. After approval: "Spec and plan ready. Use `/start` to begin execution."

## Rules

- ✅ Explore codebase BEFORE asking user questions
- ✅ Write agent-executable acceptance criteria
- ✅ Tag assumptions as Confirmed/Unconfirmed
- ✅ Auto-transition when clearance check passes
- ✅ Always produce BOTH spec and plan before guiding to `/start`
- ✅ Mine memory for past decisions, learnings, blockers
- ✅ Delegate git history mining to Explore (Plan has bash: false)
- ✅ Include Conventions & Past Decisions section in plan
- ✅ Every task must include a Task Packet
- ✅ File Impact is the build contract
- ❌ NEVER ask generic questions without codebase context
- ❌ NEVER skip acceptance criteria
- ❌ NEVER end passively — always question or action
- ❌ NEVER create tasks touching > 3 files
- ❌ NEVER write "user manually tests..." criteria
- ❌ NEVER omit File Impact section
- ❌ NEVER skip gap analysis
