---
name: finishing-a-development-branch
description: Legacy compatibility skill. Finish work from the shared default-branch workspace: verify, sync, and land without worktrees or task branches.
---

# Finishing a Shared Workspace Session

> Legacy skill name: `finishing-a-development-branch`

## Step 1 — Verify

```bash
npm test    # or project test command
```

**If tests fail: STOP. Fix first. Never proceed with failing tests.**

## Step 2 — Confirm shared-workspace state

```bash
git branch --show-current     # expect: repo default branch (main/master/etc.)
git status --short --branch   # confirm only intended changes are present
```

If the branch is not the repo default branch, stop unless the user explicitly approved that branch.

## Step 3 — Present Options

```
Shared workspace on the default branch is ready. Choose:
  1. LAND     — sync default branch, push, keep working from shared checkout
  2. PAUSE    — leave local state in place and hand off
  3. DISCARD  — revert local changes and return to a clean checkout
```

## Step 4 — Execute

**LAND**
```bash
git pull --rebase
git push
```

**PAUSE**
```bash
/handoff
# leave shared workspace state intact for the next session
```

**DISCARD** — require typed confirmation: `"discard"`
```bash
git restore --worktree --staged .
```

## Safety Rules

| Rule | Enforcement |
|------|-------------|
| Tests must pass | Block on failure |
| DISCARD | Require typed `"discard"` to confirm |
| Force push to default branch | Never |
| Shared workspace drift | Sync and inspect before landing |

## Red Flags

- Landing without test verification
- Discarding without confirmation
- Creating a worktree or task branch just to finish the task
