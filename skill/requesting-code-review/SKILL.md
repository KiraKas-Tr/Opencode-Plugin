---
name: requesting-code-review
description: Use after completing a task. Dispatch @review subagent for quality gate.
---

# Requesting Code Review Skill

You are running the **requesting-code-review** skill. Never skip review.

## When to Request

- After major features
- Before merging
- After significant refactors
- When unsure about approach

## Information to Provide

| Item | Example |
|------|---------|
| Git SHAs | "Changed: a1b2c3d..e4f5g6h" |
| What was implemented | "Added user authentication with JWT" |
| Plan/requirements | "Per spec in .opencode/memory/specs/auth.md" |
| Known issues | "Edge case X not handled yet" |

## Review Workflow

1. Dispatch @review subagent
2. Wait for review results
3. Fix Critical issues immediately
4. Address High issues before merge
5. Medium/Low can be follow-up tickets

## Issue Severity Response

| Severity | Action |
|----------|--------|
| Critical | Fix NOW, re-review |
| High | Fix before merge |
| Medium | Create ticket, fix soon |
| Low | Document, fix later |

## Red Flags

- Skipping review "because it's small"
- Merging without addressing Critical issues
- Not providing context for reviewer
