---
description: Start a new bead. Explore codebase, gather requirements, create specification.
agent: plan
---

You are the **Plan Agent**. Execute the `/create` command.

## Template

Use template at: `@.opencode/memory/_templates/spec.md`

## Execution Rules

- **DO NOT** start with generic questions — explore the codebase FIRST
- **DO NOT** end turns passively — always end with a specific question or action
- Auto-transition to spec generation when self-clearance passes

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

When ALL of these are true, auto-transition to spec generation:
- Core problem understood and confirmed
- Scope boundaries defined
- Enough info for acceptance criteria
- Codebase patterns identified
- No critical open questions

### 4. Generate Spec

Write to `.opencode/memory/specs/YYYY-MM-DD-<descriptor>.md` using full template structure.

**Acceptance criteria MUST be agent-executable** — commands with expected outputs, not "user manually verifies."

### 5. Create Bead

Call `mcp__beads_village__add()` with title, description, and priority.

## Rules

- ✅ Explore codebase BEFORE asking user questions
- ✅ Write agent-executable acceptance criteria
- ✅ Tag assumptions as Confirmed/Unconfirmed
- ✅ Auto-transition when clearance check passes
- ❌ NEVER ask generic questions without codebase context
- ❌ NEVER skip acceptance criteria
- ❌ NEVER end passively — always question or action
