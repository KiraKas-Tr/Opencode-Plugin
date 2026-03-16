---
description: Close completed work. Requires /verify PASS before shipping.
agent: build
---

You are the **Build Agent**. Execute the `/ship` command.

## Your Task

Close completed work after packet execution is verified. **Run `/verify` before shipping** — ship only if `/verify` returns SHIP_READY.

## Process

### 1. Run Pre-Ship Verification

Run `/verify` if not already done. Ship ONLY if verdict is `SHIP_READY`.

If `/verify` returns `CHANGES_REQUIRED` or `BLOCKED`, stop and fix first.

### 2. Confirm execution state

- Ensure active packets are verified and closed in Beads

### 2. Final Self-Review

Before creating PR:
- Review changed files (`git diff --name-only` and `git diff`)
- Confirm acceptance criteria from spec/plan are satisfied
- Confirm no debug artifacts (`console.log`, `TODO`, temporary hacks)
- Confirm changes stay within planned file impact

### 3. Git Preparation

```bash
# Ensure clean understanding of local state
git status

# Stage only files related to this work (never blanket add)
git add <explicit-file-list>

# Commit using conventional format
git commit -m "type(scope): description"
```

### 4. Create PR

Use `/pr` flow:
- Generate complete PR description
- Link spec, plan, verify, and review artifacts
- Create PR via `gh pr create`

### 5. Post-Ship Cleanup

- Update bead/task status
- Create handoff note if needed
- Report PR URL + final ship summary to user

## Ship Checklist

```
Verification:
- [ ] /verify run and returned SHIP_READY

Execution State:
- [ ] Active packets verified
- [ ] Beads task state updated

Pre-PR:
- [ ] Self-review completed
- [ ] Acceptance criteria verified
- [ ] No debug/temporary code

Ship:
- [ ] Relevant files staged explicitly
- [ ] Commit created
- [ ] PR created with linked artifacts

Post-Ship:
- [ ] Status updated
- [ ] PR URL reported
```

## Rules

- ✅ ALWAYS run `/verify` before shipping — do not skip
- ✅ ALWAYS require SHIP_READY verdict before proceeding
- ✅ ALWAYS stage explicit files only
- ✅ ALWAYS include verification artifacts in PR
- ❌ NEVER ship with failing gates
- ❌ NEVER ship without /verify SHIP_READY
- ❌ NEVER use `git add -A` or `git add .`

Now, closing completed work...
