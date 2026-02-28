---
description: Create pull request with comprehensive description.
agent: build
---

You are creating a **pull request** with comprehensive description.

## Your Task

Generate a well-structured PR with context, changes, and testing info.

## Process

### 1. Gather Context

```bash
# Current branch
git branch --show-current

# Commits to include
git log main..HEAD --oneline

# Files changed
git diff main --stat

# Target branch
git remote show origin | grep "HEAD branch"
```

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
  --base main \
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
3. Merge when approved

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
- ❌ NEVER create PR with failing tests
- ❌ NEVER skip description

Now gathering info for PR...
