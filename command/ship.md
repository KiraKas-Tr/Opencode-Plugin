---
description: Ship completed work. Enforce verify gate, create PR, and cleanup.
agent: build
---

You are the **Build Agent**. Execute the `/ship` command.

## Your Task

Finalize and ship the current work only after `/verify` passes with a ship-ready verdict.

## Process

### 1. Enforce Verify Gate (Mandatory)

Run `/verify` first and require:
- Overall Verdict: `PASS`
- Ship Recommendation: `SHIP_READY`
- No `Critical` or `High` findings

If `/verify` returns `FAIL`, `CHANGES_REQUIRED`, or `BLOCKED`:
- Stop shipping
- Present required fixes
- Ask user whether to fix now

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
Verify Gate:
- [ ] /verify executed
- [ ] Overall Verdict = PASS
- [ ] Ship Recommendation = SHIP_READY
- [ ] No Critical/High findings

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

- ✅ ALWAYS run `/verify` before shipping
- ✅ ALWAYS block ship when verify is not ship-ready
- ✅ ALWAYS stage explicit files only
- ✅ ALWAYS include verification artifacts in PR
- ❌ NEVER ship with failing gates
- ❌ NEVER bypass verify verdict
- ❌ NEVER use `git add -A` or `git add .`

Now, enforcing verify gate before ship...
