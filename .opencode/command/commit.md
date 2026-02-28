---
description: Intelligent git commit with Conventional Commits format.
agent: build
---

You are creating an **intelligent git commit** with proper message formatting.

## Your Task

Analyze changes and create a well-formatted commit following Conventional Commits.

## Process

### 1. Analyze Changes

```bash
git status
git diff --staged
git diff  # if nothing staged
```

### 2. Determine Commit Type

| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change, no feature/fix |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |
| `chore` | Build, deps, tooling |
| `ci` | CI/CD changes |

### 3. Identify Scope

Based on changed files:
- `auth` — Authentication related
- `api` — API changes
- `ui` — Frontend/UI
- `db` — Database
- `core` — Core logic
- Or specific module name

### 4. Generate Message

Format:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
bead_id: [id if applicable]
```

### 5. Stage & Commit

```bash
# Stage if needed
git add [files]

# Commit
git commit -m "[message]"
```

## Commit Template

```markdown
## 📝 Commit Preview

### Changes Detected
| File | Status | Lines |
|------|--------|-------|
| path/to/file.ts | Modified | +10 / -5 |

### Suggested Commit

```
feat(auth): add JWT refresh token support

- Implement token refresh endpoint
- Add automatic refresh on 401
- Update auth middleware

bead_id: T-xxx
```

### Actions
- [x] Stage all changes
- [ ] Stage specific files
- [ ] Edit message
- [ ] Commit

Proceed with commit? [Y/n/edit]
```

## Smart Detection

| Changes In | Suggested Type |
|------------|----------------|
| `*.test.ts` | `test` |
| `*.md`, `docs/` | `docs` |
| `package.json` (deps) | `chore(deps)` |
| `.github/`, CI files | `ci` |
| Bug fix patterns | `fix` |
| New files + exports | `feat` |

## Options

```
/commit              # Auto-detect and suggest
/commit -a           # Stage all + commit
/commit --amend      # Amend last commit
/commit -m "msg"     # Use specific message
/commit --dry-run    # Preview only
```

## Breaking Changes

If breaking change detected:
```
feat(api)!: change response format

BREAKING CHANGE: Response now returns {data, meta} wrapper
```

## Rules

- ✅ ALWAYS use Conventional Commits format
- ✅ ALWAYS include bead_id if working on a bead
- ✅ ALWAYS verify staged changes before commit
- ❌ NEVER commit with generic messages like "fix" or "update"
- ❌ NEVER commit sensitive data (secrets, keys)

Now analyzing changes for commit...
