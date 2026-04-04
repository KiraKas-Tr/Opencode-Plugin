---
description: Finalize work — commit, sync, and land verified shared-checkout changes on the repo default branch. Run standalone after any implementation or as the final step in /start → /verify → /ship.
agent: build
---

You are the **Build Agent**. Execute the `/ship` command.

## Your Task

Close and ship completed work. Run `/verify` first for full quality assurance — or skip it only for quick/obvious fixes when self-review is sufficient.

**Standalone use:** Run `/ship` at any time to commit and land current shared-checkout changes.
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

### 3. Final Self-Review

Before landing changes:
- Review changed files (`git diff --name-only` and `git diff`)
- Confirm acceptance criteria from the plan are satisfied
- Confirm no debug artifacts (`console.log`, `TODO`, temporary hacks)
- Confirm changes stay within planned file impact

### 4. Git Preparation

```bash
# Ensure clean understanding of local state
git status

# Stage only files related to this work (never blanket add)
git add <explicit-file-list>

# Commit using conventional format
git commit -m "type(scope): description"
```

### 5. Land on the shared default branch

```bash
# Rebase local commit(s) onto the latest shared branch state
git pull --rebase

# Publish the landed change
git push
```

If your repo or user explicitly requires PR-based review, stop here and use `/pr` as an exception flow from a non-default branch.

### 6. Post-Ship Cleanup

- Update bead/task status
- Create handoff note if needed
- Report commit/branch summary to user

## Ship Checklist

```
Verification:
- [ ] /verify run (recommended) — or self-review applied

Execution State:
- [ ] Active packets verified
- [ ] Beads task state updated

Pre-Ship:
- [ ] Self-review completed
- [ ] Acceptance criteria verified
- [ ] No debug/temporary code

Ship:
- [ ] Relevant files staged explicitly
- [ ] Commit created
- [ ] Rebased onto latest shared branch state
- [ ] Changes pushed

Post-Ship:
- [ ] Status updated
- [ ] Final landing summary reported
```

## Rules

- ✅ ALWAYS stage explicit files only
- ✅ ALWAYS do self-review before shipping
- ✅ STRONGLY RECOMMENDED: run `/verify` before `/ship` for non-trivial changes
- ✅ Use `/pr` only when the user or repo policy explicitly requires a PR workflow
- ❌ NEVER ship with known failing gates
- ❌ NEVER use `git add -A` or `git add .`
- ❌ NEVER create a PR or task branch as part of the default shared-workspace ship flow

Now, closing completed work...
