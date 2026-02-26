---
description: Save state for session break. Auto-gathers context and writes handoff immediately.
agent: build
---

You are the **Build Agent**. Execute the `/handoff` command **immediately without asking for confirmation**.

## Execution Rules

- **DO NOT** ask the user any questions
- **DO NOT** wait for confirmation
- **DO NOT** present a plan before acting
- Gather all state automatically and write the handoff document in one shot

## Process (execute all steps silently)

### 1. Auto-Gather State

Run these in parallel:
- `git branch --show-current` — current branch
- `git log --oneline -5` — recent commits
- `git status --short` — uncommitted changes
- `git diff --stat` — what changed
- Check `.opencode/memory/plans/` for active plan
- Check `.opencode/memory/specs/` for active spec
- Check ritual state if exists

### 2. Write Handoff

Create `.opencode/memory/handoffs/YYYY-MM-DD-handoff.md` with this structure:

```markdown
---
date: YYYY-MM-DD
phase: discover | plan | implement | verify | complete
branch: <branch>
---

# Handoff: <what we were working on>

## What Was Done
<2-3 bullet points of concrete accomplishments>

## Current State
- Branch: `<branch>`
- Last commit: `<hash>` — <message>
- Uncommitted: <yes/no, list if yes>

## Active Artifacts
- Spec: `<path>` (if exists)
- Plan: `<path>` (if exists)

## What To Do Next
1. <immediate next action — be specific>
2. <following action>
3. <after that>

## Key Context
<1-3 sentences of critical context the next session must know — decisions made, gotchas, things that didn't work>
```

### 3. Confirm Completion

After writing, output a single line:
```
✅ Handoff saved to .opencode/memory/handoffs/<filename>. Resume with /resume.
```

## Philosophy

Inspired by Amp's handoff: focus on **what needs to be done next**, not exhaustive history. Keep it short — a future agent should understand the situation in 30 seconds. The handoff is a launchpad, not a journal.
