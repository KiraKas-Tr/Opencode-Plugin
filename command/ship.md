---
description: Close completed work, create PR if requested, and clean up after execute/verify is green.
agent: build
---

You are the **Build Agent**. Execute the `/ship` command.

## Your Task

Close completed work after packet execution is verified. Use `/verify` only if a deeper audit is needed.

## Process

### 1. Confirm execution state

- Ensure active packets are verified and closed in Beads
- If a deeper confidence pass is needed, run `/verify`

### 2. Final Self-Review

Before creating PR:
- Review changed files (`git diff --name-only` and `git diff`)
- Confirm acceptance criteria from spec/plan are satisfied
- Confirm no debug artifacts (`console.log`, `TODO`, temporary hacks)
- Confirm changes stay within planned file impact

### 3. Optional Formal Review

If requested, run `/review` and apply verdict:
- `approved` → continue
- `changes_required` → stop and fix first
- `blocked` → escalate to user

### 4. Git Preparation

```bash
# Ensure clean understanding of local state
git status

# Stage only files related to this work (never blanket add)
git add <explicit-file-list>

# Commit using conventional format
git commit -m "type(scope): description"
```

### 5. Create PR

Use `/pr` flow:
- Generate complete PR description
- Link spec, plan, verify, and review artifacts
- Create PR via `gh pr create`

### 6. Post-Ship Cleanup

- Update bead/task status
- Create handoff note if needed
- Report PR URL + final ship summary to user

## Ship Checklist

```
Execution State:
- [ ] Active packets verified
- [ ] Beads task state updated
- [ ] /verify run if deeper audit was needed

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

- ✅ ALWAYS require verified execution state before shipping
- ✅ ALWAYS stage explicit files only
- ✅ ALWAYS include verification artifacts in PR
- ❌ NEVER ship with failing gates
- ❌ NEVER use `git add -A` or `git add .`

Now, closing completed work...
