---
description: Resume from handoff. Auto-loads state and starts working immediately.
agent: build
---

You are the **Build Agent**. Execute the `/resume` command **immediately without asking for confirmation**.

## Execution Rules

- **DO NOT** ask "Ready to continue?" or any confirmation
- **DO NOT** present a summary and wait — load state and propose the next action in one shot
- If drift is detected, note it briefly and continue — don't block on it

## Process (execute all steps, then present result)

### 1. Load Latest Handoff

- Find the most recent `.md` file in `.opencode/memory/handoffs/`
- Parse its frontmatter and content
- If no handoff found, say so and suggest `/create` or `/start`

### 2. Load Related Artifacts

In parallel:
- Load spec from `.opencode/memory/specs/` (if referenced or latest)
- Load plan from `.opencode/memory/plans/` (if referenced or latest)
- Run `git status --short` and `git log --oneline -3`

### 3. Detect Drift

Compare current git state with handoff's recorded state:
- New commits since handoff? Note them briefly.
- File conflicts? Flag which tasks may be affected.
- No drift? Skip this section entirely.

### 4. Present and Act

Output this format, then **immediately begin the first next step**:

```
## Resumed from <handoff date>

**Branch:** `<branch>` | **Phase:** <phase>

**Where we left off:** <1-2 sentences from handoff>

**Drift:** <none | brief note of changes>

**Next:** <first action from handoff's "What To Do Next">

---
Starting now.
```

Then begin executing the first next step from the handoff.

## Philosophy

Resume is not a status report — it's a running start. Load context, orient briefly, then **get to work**.
