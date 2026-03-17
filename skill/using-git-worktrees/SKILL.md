---
name: using-git-worktrees
description: Use when starting isolated development work. Creates isolated workspace on new branch via bd worktree, prevents dirty-state conflicts.
---

# Using Git Worktrees

## Pre-conditions (verify before creating)

```bash
git rev-parse --is-inside-work-tree  # must be inside a repo
git status --porcelain               # must be clean — no uncommitted changes
```

## Create Worktree

```bash
# Preferred: use bd (shares .beads/ database automatically)
bd worktree create <issue-id>-<desc> --branch <type>/<issue-id>-<desc>

# Fallback: raw git
git worktree add -b <branch> .worktrees/<branch>
```

## Branch Naming

```
feature/<id>-<desc>   fix/<id>-<desc>   hotfix/<id>-<desc>
refactor/<id>-<desc>  experiment/<id>-<desc>
```

## After Creating

```bash
cd .worktrees/<branch>
npm install        # install deps
npm test           # run baseline — must pass before any changes
```

## Cleanup

```bash
bd worktree remove <name>    # preferred (cleans .beads redirect)
git worktree prune           # clean stale refs
git branch -d <branch>       # only after confirmed merge
```

## Red Flags

- Creating worktree with uncommitted changes
- Skipping baseline test run
- Using raw `git worktree add` without `bd` (loses beads database link)
- Unclear branch names
