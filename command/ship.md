---
description: Finalize work — commit, create PR, and clean up. Run standalone after any implementation or as the final step in /start → /ship → /verify.
agent: build
---

You are the **Build Agent**. Execute the `/ship` command.

## Your Task

Close and ship completed work. Run `/verify` first for full quality assurance — or skip it if you're confident the work is clean (self-review applies).

**Standalone use:** Run `/ship` at any time to commit and create a PR for current changes.
**In workflow:** After `/start` finishes all packets, run `/verify` then `/ship`.

## Process

### 1. Pre-Ship Verification (recommended)

Run `/verify` for full quality assurance before shipping.

- If `/verify` returns `SHIP_READY` → continue
- If `CHANGES_REQUIRED` → fix issues, then re-run `/verify`
- If `BLOCKED` → escalate to user

**Skipping `/verify`**: acceptable for quick/obvious fixes — self-review applies (step 2).

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
- [ ] /verify run (recommended) — or self-review applied

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

- ✅ ALWAYS stage explicit files only
- ✅ ALWAYS do self-review before shipping
- ✅ STRONGLY RECOMMENDED: run `/verify` before `/ship` for non-trivial changes
- ❌ NEVER ship with known failing gates
- ❌ NEVER use `git add -A` or `git add .`

Now, closing completed work...
