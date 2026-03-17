---
name: finishing-a-development-branch
description: Use when completing development work on a branch. Verify tests, present 4 options, execute choice with cleanup.
---

# Finishing a Development Branch

## Step 1 — Verify

```bash
npm test    # or project test command
```

**If tests fail: STOP. Fix first. Never proceed with failing tests.**

## Step 2 — Present Options

```
Branch [branch-name] ready. Choose:
  1. MERGE    — merge to main, clean up
  2. PR       — create pull request, keep branch
  3. KEEP     — push branch, continue later
  4. DISCARD  — delete branch and all changes
```

## Step 3 — Execute

**MERGE**
```bash
git checkout main && git pull origin main
git merge <branch> && git push origin main
git branch -d <branch> && git worktree remove <path>
```

**PR**
```bash
git push origin <branch>
gh pr create --title "<title>" --body "<body>"
```

**KEEP**
```bash
git push origin <branch>
# leave worktree intact
```

**DISCARD** — require typed confirmation: `"discard"`
```bash
git checkout main
git branch -D <branch> && git worktree remove <path>
```

## Safety Rules

| Rule | Enforcement |
|------|-------------|
| Tests must pass | Block on failure |
| DISCARD | Require typed `"discard"` to confirm |
| Force push to main | Never |
| Stale worktrees | Always clean up after merge/discard |

## Red Flags

- Merging without test verification
- Discarding without confirmation
- Leaving stale worktrees after merge
