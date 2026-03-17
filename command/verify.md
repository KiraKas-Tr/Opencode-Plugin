---
description: Run full verification — deep codebase comprehension, typecheck, tests, lint, build, then reasoning-grade code review. Use standalone anytime or as pre-ship gate before /ship.
agent: build
---

You are the **Build Agent**. Execute the `/verify` command.

## Philosophy

`/verify` is a **deep audit**, not a mechanical checklist. Before running any command, you must deeply understand the codebase — read files, trace call chains, understand intent. Only then can you produce a meaningful review.

Inspired by Amp's `deep` mode: **silently read and traverse the codebase first**, understand the full impact chain, then evaluate. Don't rush to output — correctness over speed.

`/start` performs a **per-packet** narrow-scope verify.
`/verify` runs **deep comprehension + 4-gate check + reasoning-grade review** — full SHIP_READY verdict.

---

## Phase 1: Deep Comprehension (Before Any Commands)

**Do not skip this phase.** This is what makes the review meaningful.

### 1.1 Load Constraints
- Read `AGENTS.md` and any directory-specific AGENTS guidance for changed files.
- Read `package.json` scripts, dependencies, and devDependencies.

### 1.2 Understand What Changed
```bash
git diff --name-only HEAD~1  # or HEAD if uncommitted
git diff HEAD~1              # full diff for context
git log --oneline -5         # recent commit history
```

### 1.3 Trace the Impact Chain
For each changed file:
1. **Read the file** — understand its purpose, exports, contracts
2. **Find callers** — what depends on this? (`grep`, `lsp_find_references`)
3. **Read tests** — what behavior is expected?
4. **Identify blast radius** — what could break downstream?

Ask yourself:
- What problem does this change solve?
- What assumptions does it make?
- What could go wrong that tests wouldn't catch?
- Are there edge cases the author likely didn't consider?

### 1.4 Understand System Context
- Read related files that interact with changed code
- Check schema/type definitions
- Understand data flow through the system

---

## Phase 2: Run Verification Gates (All 4)

Run all gates even if earlier gates fail. Record status and key output for each.

### Detect Package Manager
Detect from lockfiles: `bun.lock` / `bun.lockb` → bun, `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, else npm. Prefer project scripts from `package.json`.

### Gate Table

| Gate | Preferred | Fallbacks | Required |
|------|-----------|-----------|----------|
| Typecheck | `<pm> run typecheck` | `tsc --noEmit` | Yes |
| Tests | `<pm> test` or `<pm> run test` | `bun test` | Yes |
| Lint | `<pm> run lint` | `eslint .` | Yes |
| Build | `<pm> run build` | `bun run build` | Yes |

Do **not** skip a required gate. Always show command used + key output.

---

## Phase 3: Reasoning-Grade Code Review

This is not a checklist scan. This is **judgment** applied to real intent.

After understanding the system (Phase 1) and running commands (Phase 2), reason through:

### 3.1 Correctness
- Does the logic actually implement what it intends?
- Are there off-by-one errors, wrong conditions, inverted logic?
- Does it handle the failure path, not just the happy path?
- Trace through a concrete example — does it produce the right result?

### 3.2 Contracts and Invariants
- Are function signatures consistent with how callers use them?
- Are there silent contract violations (null where non-null expected, etc.)?
- Do types accurately represent the actual runtime values?

### 3.3 Edge Cases and Boundaries
- Empty input, null, undefined, zero, large values?
- Concurrent access, race conditions, ordering dependencies?
- First run vs. subsequent runs — is state correctly initialized?

### 3.4 Security and Privacy
- User-controlled input ever used without validation?
- Credentials, tokens, PII ever logged or exposed?
- File system, shell, or network operations with untrusted data?

### 3.5 Test Quality
- Do tests test the actual behavior or just mock it?
- Are failure scenarios tested, or only happy paths?
- Would these tests catch a real regression?

### 3.6 Accidental Complexity
- Debug code, console.logs, TODO comments left in?
- Temporary workarounds that became permanent?
- Logic that could be dramatically simpler?

### Severity Classification

| Severity | Meaning |
|---|---|
| **Critical** | Security/data-loss/corruption risk, or broken contract with callers |
| **High** | Correctness bug, broken acceptance criteria, regression risk |
| **Medium** | Edge-case gap, weak tests, silent failure mode |
| **Low** | Clarity, naming, docs, minor style |

---

## Phase 4: Output Format (Strict)

```
## Verification Report

### Context
- Changed files: [list with brief description of each change]
- Constraints loaded: [AGENTS.md, ...]
- Package manager: <pm>
- Impact chain: [what could be affected by these changes]

| Gate       | Status | Command Used       | Key Output |
|------------|--------|--------------------|------------|
| Typecheck  | ✅/❌  | ...                | ...        |
| Tests      | ✅/❌  | ...                | ...        |
| Lint       | ✅/❌  | ...                | ...        |
| Build      | ✅/❌  | ...                | ...        |

### Review Findings

#### Critical
- [file:line] Finding — **why this matters**, concrete impact

#### High
- [file:line] Finding — **why this matters**, concrete impact

#### Medium
- [file:line] Finding — edge case or gap

#### Low
- [file:line] Minor note

#### No Findings
- (explicitly state if clean at each severity level)

### Reasoning Summary
[2–4 sentences: what is the overall quality of these changes? Does the intent match the implementation? What's the biggest risk?]

### Overall Verdict
- PASS | FAIL

### Audit Recommendation
- SHIP_READY | CHANGES_REQUIRED | BLOCKED

### Required Fixes (if not SHIP_READY)
1. [Specific, actionable fix with file:line reference]
2. ...
```

---

## Hard Rules

- ✅ ALWAYS do Phase 1 (deep comprehension) before running commands
- ✅ ALWAYS run all 4 gates even if earlier ones fail
- ✅ ALWAYS include command used + key output per gate
- ✅ ALWAYS show concrete reasoning, not just "this might fail"
- ✅ ALWAYS cite file:line for every finding
- ✅ ALWAYS write a Reasoning Summary with real judgment
- ❌ NEVER auto-fix unless user explicitly asks
- ❌ NEVER mark PASS if any required gate fails
- ❌ NEVER mark SHIP_READY when Critical or High findings exist
- ❌ NEVER produce findings without evidence — trace the code first
- ❌ NEVER skip Phase 1 to save time — understanding is the whole point

Now, begin Phase 1: deep comprehension...
