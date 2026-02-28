---
description: Debug issues, find root cause, implement fix.
agent: build
---

You are the **Build Agent**. Execute the `/debug` command.

## Your Task

Systematically debug an issue: find root cause, implement fix, verify, and prevent regression.

## Process

### 1. Reproduce the Issue

```bash
# Run the failing test/command
[command that shows the error]
```

Document:
- Error message / stack trace
- Steps to reproduce
- Expected vs actual behavior

### 2. Gather Evidence

```bash
# Recent changes
git log --oneline -10
git diff HEAD~5

# Search for related code
Grep: [error pattern]
```

### 3. Investigate

```
Hypothesis → Evidence → Verify → Repeat
```

1. Form hypothesis about cause
2. Predict what evidence would confirm/deny
3. Gather evidence (grep, read, run, LSP)
4. If wrong, form new hypothesis

### 4. Root Cause Analysis (5 Whys)

| Why | Question | Answer |
|-----|----------|--------|
| 1 | Why did this fail? | |
| 2 | Why did that happen? | |
| 3 | Why? | |
| 4 | Why? | |
| 5 | Root cause? | |

### 5. Implement Fix

Once root cause identified:
1. Create minimal fix
2. Add regression test
3. Verify fix works
4. Check for side effects

### 6. Verify

```bash
# Run original failing test
[original command] → Should pass

# Run full test suite
pnpm test

# Type check
pnpm typecheck
```

## Debugging Tools

| Tool | Use For |
|------|---------|
| `Grep` | Find error patterns, related code |
| `Read` | Examine suspicious files |
| `Bash` | Run tests, check logs, git bisect |
| `LSP` | Trace definitions, find references |
| `ast_grep_search` | Find structural code patterns |
| Oracle | Complex multi-layer analysis (escalation) |

## Common Patterns

### Find When Bug Was Introduced
```bash
git log --oneline -20
git bisect start
git bisect bad HEAD
git bisect good [known-good-commit]
```

### Trace Error Source
```bash
# Find all occurrences of error message
Grep: "error message"

# Find callers of problematic function
Grep: "functionName("
```

## Debug Report

```markdown
## Debug Report: [Issue Title]

**Date:** YYYY-MM-DD
**Error:** [Error message]

### Reproduction
1. [Step 1]
2. [Step 2]
3. Error occurs

### Investigation

#### Hypotheses Tested
| # | Hypothesis | Evidence | Result |
|---|------------|----------|--------|
| 1 | [Theory] | [What I found] | ❌ |
| 2 | [Theory] | [What I found] | ✅ |

### Root Cause
[Clear explanation]

**5 Whys:**
1. → [Answer]
2. → [Answer]
3. → [Answer]
4. → [Answer]
5. → **[Root cause]**

### Fix Applied

**Files Changed:**
- `path/to/file.ts` — [What changed]

**Code Change:**
```diff
- old code
+ new code
```

**Regression Test Added:**
- `path/to/test.ts` — [Test description]

### Verification
| Check | Result |
|-------|--------|
| Original issue | ✅ Fixed |
| Regression test | ✅ Pass |
| Full test suite | ✅ Pass |
| Type check | ✅ Pass |

### Prevention
- [ ] Added test to prevent regression
- [ ] Updated error handling
- [ ] Documented the issue
```

## Rules

- ✅ ALWAYS reproduce before fixing
- ✅ ALWAYS add regression test
- ✅ ALWAYS verify fix doesn't break other things
- ✅ ALWAYS document root cause
- ❌ NEVER apply fix without understanding cause
- ❌ NEVER skip verification
- ❌ NEVER suppress errors without fixing

## Escalation

If after 3 attempts:
- Still can't reproduce → Ask for more info
- Can't find root cause → Delegate to Oracle for deeper analysis
- Fix causes other failures → Escalate to Plan Agent

Describe the issue to debug and fix...
