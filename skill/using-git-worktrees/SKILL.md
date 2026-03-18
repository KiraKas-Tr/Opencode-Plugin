---
name: using-git-worktrees
description: Legacy compatibility skill. Despite the name, the current workflow uses one shared checkout on the repo default branch and does not create git worktrees.
---

# Shared Workspace Development

> Legacy skill name: `using-git-worktrees`

This repository no longer uses git worktrees for routine agent execution.

## Policy

- Work directly in the shared repository checkout
- Stay on the repo default branch unless the user explicitly approves another branch
- Do **not** create git worktrees
- Do **not** create per-task branches to hide conflicts
- Use Beads reservations to coordinate overlapping edits
- Pull/rebase frequently so conflicts surface immediately

## Start-of-task checks

```bash
git rev-parse --is-inside-work-tree  # must be inside a repo
git branch --show-current            # expect: repo default branch (main/master/etc.)
git status --short --branch          # inspect local state before editing
```

If overlapping local changes already touch your files, stop and coordinate — do not isolate the work in another workspace.

## During execution

- Reserve files with `beads-village_reserve` before editing
- Keep changes packet-sized and scoped to reserved files
- Re-run `git status --short --branch` before commit/push to catch unexpected drift
- If the tree is clean and you need the latest remote updates, sync with:

```bash
git pull --rebase
```

## End-of-task sync

```bash
git status --short --branch
git pull --rebase            # when safe and needed
git push                     # publish landed changes after verification and sync
```

## Red Flags

- Creating a git worktree or per-task branch for routine work
- Editing reserved files without coordination
- Letting local drift accumulate in the shared checkout
- Using isolation to avoid dealing with real conflicts
