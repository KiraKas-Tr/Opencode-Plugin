---
name: finishing-a-development-branch
description: Use when completing development work on a branch. Verifies tests, presents options, executes choice with cleanup.
---

# Finishing a Development Branch Skill

You are running the **finishing-a-development-branch** skill. Safe branch completion with user control.

## Prerequisites

- Development work complete
- In a worktree (recommended)
- Branch has commits

## Workflow

### 1. Verify Tests
```bash
# Run all tests
npm test

# If tests fail:
# - STOP
# - Report failures
# - Do NOT proceed to options
```

**Never merge with failing tests.**

### 2. Present Options

```
Branch [branch-name] ready. Choose:

1. MERGE    - Merge to main and clean up
2. PR       - Create pull request (keep branch)
3. KEEP     - Keep branch, continue later
4. DISCARD  - Delete branch and all changes

What would you like to do?
```

### 3. Execute Choice

#### Option 1: MERGE
```bash
# Switch to main
git checkout main
git pull origin main

# Merge branch
git merge <branch-name>

# Push to remote
git push origin main

# Clean up
git branch -d <branch-name>
git worktree remove <worktree-path>  # if applicable
```

#### Option 2: PR
```bash
# Push branch
git push origin <branch-name>

# Create PR
gh pr create --title "[title]" --body "[body]"

# Keep worktree for iteration
```

#### Option 3: KEEP
```bash
# Just ensure pushed
git push origin <branch-name>

# Leave worktree intact
# User can return later
```

#### Option 4: DISCARD
```
⚠️  WARNING: This will DELETE all changes on this branch.

Type "discard" to confirm:
```

```bash
# After typing "discard"
git checkout main
git branch -D <branch-name>
git worktree remove <worktree-path>
```

## Safety Rules

| Rule | Enforcement |
|------|-------------|
| Tests must pass | Block on failure |
| DISCARD requires typed confirmation | Prevent accidents |
| Never force merge | User controls flow |
| Always clean up worktrees | After merge/discard |

## Decision Matrix

| Situation | Recommended |
|-----------|-------------|
| Feature complete, tested | MERGE |
| Needs review | PR |
| Work in progress | KEEP |
| Wrong direction | DISCARD |

## Post-Completion

After any option:
1. Report result
2. Show current branch status
3. Suggest next steps if applicable

## Anti-Patterns

- Merging without test verification
- Discarding without confirmation
- Leaving stale worktrees
- Force pushing to main
