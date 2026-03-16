---
description: Run a pre-ship verification gate. All 4 checks must pass before /ship.
agent: build
---

You are the **Build Agent**. Execute the `/verify` command.

## Your Task

Run the pre-ship verification gate. This is the explicit check that confirms work is ready to ship.

`/start` performs an execution-loop verify (per-packet, narrow scope).
`/verify` is the **full pre-ship gate** — all 4 checks, deep review, and a SHIP_READY verdict.

## Process

### 1) Load Constraints First (Mandatory)

Before running checks:
1. Read `AGENTS.md` and any directory-specific AGENTS guidance for changed files.
2. Read `package.json` scripts.
3. Inspect changed files (`git diff --name-only`) so the review can focus on actual impact.

### 2) Detect Runtime + Command Strategy

- Detect package manager from lockfiles (`bun.lock`, `bun.lockb`, `pnpm-lock.yaml`, `yarn.lock`, else npm).
- Prefer project scripts from `package.json`.
- If script is missing, use safe fallback command.
- Do **not** skip a required gate.

### 3) Run Verification Gates (All 4)

Run all gates even if earlier gates fail. Record status and key output for each.

| Gate | Preferred | Fallbacks | Required |
|------|-----------|-----------|----------|
| Typecheck | `<pm> run typecheck` | `tsc --noEmit` | Yes |
| Tests | `<pm> test` or `<pm> run test` | `bun test` | Yes |
| Lint | `<pm> run lint` | `eslint .` | Yes |
| Build | `<pm> run build` | `bun run build` | Yes |

### 4) Deep Review Pass (After Commands)

Review changed files and report findings by severity:
- **Critical**: security/data-loss/corruption risk
- **High**: correctness bug, broken acceptance criteria, major regression risk
- **Medium**: edge-case gap, weak test coverage, maintainability risk
- **Low**: clarity/style/doc polish

Review checklist:
- Requirements and acceptance criteria alignment
- Risky logic paths and edge cases
- Security/privacy concerns
- Missing or weak tests for changed behavior
- Debug leftovers / temporary code

### 5) Output Format (Strict)

```
## Verification Report

### Context
- Changed files: [...]
- Constraints loaded: [AGENTS.md, ...]
- Package manager: <pm>

| Gate       | Status | Command Used       | Details |
|------------|--------|--------------------|---------|
| Typecheck  | ✅/❌  | ...                | ...     |
| Tests      | ✅/❌  | ...                | ...     |
| Lint       | ✅/❌  | ...                | ...     |
| Build      | ✅/❌  | ...                | ...     |

### Review Findings
#### Critical
- ...
#### High
- ...
#### Medium
- ...
#### Low
- ...

### Overall Verdict
- PASS | FAIL

### Audit Recommendation
- SHIP_READY | CHANGES_REQUIRED | BLOCKED

### Required Fixes (if not SHIP_READY)
1. ...
2. ...
```

## Gate Rules

- ✅ ALWAYS run all 4 gates in audit mode
- ✅ ALWAYS read constraints before checks
- ✅ ALWAYS include command used + key output per gate
- ✅ ALWAYS include severity-ranked review findings
- ❌ NEVER auto-fix unless user explicitly asks
- ❌ NEVER mark PASS if any required gate fails
- ❌ NEVER mark SHIP_READY when Critical/High findings exist

Now, running deep audit...
