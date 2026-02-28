---
description: Run full verification suite. Typecheck, tests, lint, build.
agent: build
subtask: true
---

You are the **Build Agent**. Execute the `/verify` command.

## Your Task

Run the full verification suite and report results.

## Process

### 1. Detect Project Tools

Check which tools are available:

```bash
# Check package manager
ls package.json && cat package.json | head -5
ls bun.lockb && echo "bun" || ls pnpm-lock.yaml && echo "pnpm" || ls yarn.lock && echo "yarn" || echo "npm"
```

Read `package.json` scripts to determine available commands.

### 2. Run Verification Gates

Execute in order, collecting results:

| Gate | Commands (try in order) | Required |
|------|------------------------|----------|
| **Typecheck** | `pnpm typecheck`, `npm run typecheck`, `tsc --noEmit` | Yes |
| **Tests** | `pnpm test`, `npm test`, `bun test` | Yes |
| **Lint** | `pnpm lint`, `npm run lint`, `eslint .` | Yes |
| **Build** | `pnpm build`, `npm run build`, `bun run build` | Yes |

Run each gate. If a gate fails, continue to the next but record the failure.

### 3. Report Results

Format results clearly:

```
## Verification Report

| Gate       | Status | Details          |
|------------|--------|------------------|
| Typecheck  | ✅/❌  | [error count]    |
| Tests      | ✅/❌  | [pass/fail/skip] |
| Lint       | ✅/❌  | [warning/error]  |
| Build      | ✅/❌  | [output]         |

### Overall: PASS / FAIL

### Failures (if any)
[Detailed error output for each failing gate]

### Recommended Fixes
1. [Fix suggestion]
```

### 4. Fix Mode (Optional)

If the user asks to fix issues:
- Fix typecheck errors first (most foundational)
- Then lint errors
- Then test failures
- Re-run verification after fixes

## Rules

- ✅ ALWAYS run all 4 gates even if one fails
- ✅ ALWAYS report detailed error output
- ✅ ALWAYS suggest fixes for failures
- ❌ NEVER auto-fix without user confirmation
- ❌ NEVER report passing if any gate fails

Now, running verification...
