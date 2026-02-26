---
name: using-git-worktrees
description: Use when starting isolated development work. Creates isolated workspace on new branch with smart directory selection.
---

# Using Git Worktrees Skill

You are running the **using-git-worktrees** skill. Isolated workspaces for parallel development.

## When to Use

- Starting new feature branch
- Parallel development work
- Isolated experimentation
- Hotfix development

## Directory Selection Priority

```
1. .worktrees/          (preferred hidden directory)
2. worktrees/           (visible alternative)
3. Check CLAUDE.md      (project preference)
4. Ask user             (if unclear)
```

## Workflow

### 1. Verify Pre-conditions
```bash
# Check we're in a git repo
git rev-parse --is-inside-work-tree

# Check for uncommitted changes
git status --porcelain

# Check .gitignore exists
test -f .gitignore && echo "exists"
```

### 2. Create Worktree
```bash
# Choose directory
WORKTREE_DIR=".worktrees"

# Create branch and worktree
git worktree add -b <branch-name> ${WORKTREE_DIR}/<branch-name>
```

### 3. Verify Setup
```bash
# Check worktree list
git worktree list

# Verify .gitignore in worktree
test -f ${WORKTREE_DIR}/<branch-name>/.gitignore
```

### 4. Run Setup
```bash
# Enter worktree
cd ${WORKTREE_DIR}/<branch-name>

# Install dependencies
npm install  # or appropriate package manager

# Run baseline tests
npm test
```

## Directory Structure

```
project-root/
├── .git/
├── .worktrees/
│   ├── feature-a/
│   ├── feature-b/
│   └── hotfix-123/
├── src/
└── ...
```

## Branch Naming Convention

```
feature/[description]    # New features
fix/[description]        # Bug fixes
hotfix/[description]     # Urgent fixes
refactor/[description]   # Code improvements
experiment/[description] # Exploration
```

## Commands Reference

| Command | Purpose |
|---------|---------|
| `git worktree add -b branch path` | Create new worktree with branch |
| `git worktree list` | List all worktrees |
| `git worktree remove path` | Remove worktree |
| `git worktree prune` | Clean up stale entries |

## Safety Checks

- [ ] Git repository confirmed
- [ ] No uncommitted changes
- [ ] .gitignore present
- [ ] Baseline tests pass
- [ ] Branch name follows convention

## Anti-Patterns

- Creating worktree with dirty state
- Not verifying .gitignore
- Skipping baseline tests
- Using unclear branch names

## Cleanup

When done with worktree:
```bash
# Remove worktree
git worktree remove ${WORKTREE_DIR}/<branch-name>

# Delete branch (if merged)
git branch -d <branch-name>

# Prune stale references
git worktree prune
```
