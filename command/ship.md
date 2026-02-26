---
description: Ship completed work. Final verification, PR creation, and cleanup.
agent: build
---

You are the **Build Agent**. Execute the `/ship` command.

## Your Task

Finalize and ship the current work — run all verification gates, create a PR, and clean up.

## Process

### 1. Pre-Ship Verification

Run ALL hard gates before shipping:

```bash
# Type checking
pnpm typecheck || npm run typecheck || yarn typecheck

# Tests
pnpm test || npm test || yarn test

# Linting
pnpm lint || npm run lint || yarn lint

# Build
pnpm build || npm run build || yarn build
```

If ANY gate fails, stop and fix before continuing.

### 2. Self-Review

Before creating PR:
- Review all changed files (`git diff main`)
- Check for debug code, console.logs, TODOs
- Verify acceptance criteria from spec.md
- Ensure no files outside plan's file impact were changed

### 3. Request Review (Optional)

Delegate to Review Agent for formal review:
- Pass changed files list
- Pass spec.md and plan.md references
- Wait for verdict

If verdict is `changes_required`, fix issues before continuing.
If verdict is `blocked`, escalate to user.

### 4. Git Preparation

```bash
# Ensure clean state
git status

# Stage changes
git add -A

# Create commit with conventional format
git commit -m "type(scope): description"
```

### 5. Create PR

Delegate to `/pr` command flow:
- Generate comprehensive PR description
- Link spec, plan, review artifacts
- Create PR via `gh pr create`

### 6. Post-Ship Cleanup

- Update bead status to `done` or `validating`
- Create handoff document for tracking
- Report PR URL to user

## Ship Checklist

```
Pre-Ship:
- [ ] Typecheck passes
- [ ] All tests pass
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Self-review completed
- [ ] No debug/temporary code

Ship:
- [ ] Changes committed
- [ ] PR created with full description
- [ ] Artifacts linked

Post-Ship:
- [ ] Bead status updated
- [ ] PR URL reported
```

## Rules

- ✅ ALWAYS run full verification before shipping
- ✅ ALWAYS self-review changes
- ✅ ALWAYS create proper commit messages
- ✅ ALWAYS link artifacts in PR
- ❌ NEVER ship with failing tests
- ❌ NEVER ship without verification
- ❌ NEVER skip self-review

Now, let me verify and ship your work...
