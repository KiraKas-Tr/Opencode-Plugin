---
description: Optional branch-based utility. Generate a complete PR description from git diff — summary, file changes, test evidence, linked spec/plan — then create it via gh when the user or repo policy explicitly requires a PR.
agent: build
---

You are creating a **pull request** with comprehensive description.

This is an **exception flow**. The default shared-workspace policy lands changes directly on the repo default branch without creating a PR.

## Your Task

Generate a well-structured PR with context, changes, and testing info — but only when the user explicitly asks for a PR or the repo policy requires one.

## Process

### 1. Gather Context

```bash
# Current branch
git branch --show-current

# Shared workspace state
git status --short --branch

# Remote / default branch info (if configured)
git remote show origin

# Commits to include (replace <default-branch> after detection)
git log <default-branch>..HEAD --oneline

# Files changed against default branch
git diff <default-branch> --stat

```

If you are still on the shared default branch, stop and ask before proceeding — PR flow requires a dedicated branch and explicit user approval.

### 2. Load Artifacts

- `spec.md` — Link requirements
- `plan.md` — Link implementation plan
- `review.md` — Link review results (if exists)
- Bead info — Get from beads village

### 3. Generate PR Description

### 4. Create PR

```bash
gh pr create \
  --title "[type]: [description]" \
  --body "[generated body]" \
  --base <default-branch> \
  --head [current-branch]
```

## PR Template

```markdown
## 🚀 Pull Request

### Title
`[type](scope): [description]`

### Description
[2-3 sentences explaining WHAT and WHY]

### Related
- **Bead:** [ID]
- **Spec:** `.opencode/memory/specs/YYYY-MM-DD-feature.md`
- **Plan:** `.opencode/memory/plans/YYYY-MM-DD-feature.md`

---

## Changes

### Summary
[Brief overview of changes]

### Files Changed
| File | Change |
|------|--------|
| `path/to/file.ts` | [What changed] |

### Key Changes
- ✨ [New feature/change 1]
- 🐛 [Bug fix]
- ♻️ [Refactor]

---

## Testing

### Automated
- [x] Unit tests pass
- [x] Integration tests pass
- [x] Type check passes
- [x] Lint passes

### Manual Testing
- [ ] [Test scenario 1]
- [ ] [Test scenario 2]

### Test Commands
```bash
pnpm test
pnpm typecheck
pnpm lint
```

---

## Checklist

- [x] Code follows project conventions
- [x] Tests added/updated
- [x] Documentation updated (if needed)
- [x] No console.log or debug code
- [x] Self-review completed
- [ ] Ready for review

---

## Screenshots (if UI changes)
[Add screenshots here]

---

## Reviewer Notes
[Any specific areas to focus on]
```

## PR Types

| Type | Prefix | Example |
|------|--------|---------|
| Feature | `feat:` | `feat(auth): add SSO login` |
| Bug Fix | `fix:` | `fix(api): handle null response` |
| Refactor | `refactor:` | `refactor(core): simplify logic` |
| Docs | `docs:` | `docs: update API guide` |
| Chore | `chore:` | `chore(deps): update packages` |

## Options

```
/pr                  # Auto-generate full PR
/pr --draft          # Create as draft
/pr --title "..."    # Custom title
/pr --reviewer @user # Request reviewer
/pr --label bug      # Add labels
```

## After Creation

```markdown
## ✅ PR Created

**URL:** https://github.com/[repo]/pull/[number]
**Title:** [title]
**Branch:** [head] → [base]

### Next Steps
1. Request review from team
2. Address feedback
3. Merge only after approval and successful checks

### Commands
- View: `gh pr view`
- Check status: `gh pr checks`
- Merge: `gh pr merge`
```

## Rules

- ✅ ALWAYS link to spec/plan/bead
- ✅ ALWAYS include testing info
- ✅ ALWAYS run checks before PR
- ✅ ALWAYS self-review first
- ✅ ALWAYS confirm the repo/user explicitly wants PR flow before creating one
- ❌ NEVER create PR with failing tests
- ❌ NEVER run `/pr` from the shared default branch
- ❌ NEVER skip description

Now gathering info for PR...
