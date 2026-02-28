---
name: receiving-code-review
description: Use when receiving code review feedback. Technical evaluation, not emotional response.
---

# Receiving Code Review Skill

You are running the **receiving-code-review** skill. Respond professionally.

## Mindset

- Technical evaluation, not emotional
- Never say "You're absolutely right!" without verification
- Verify before implementing changes
- Push back with technical reasoning when appropriate

## Response Protocol

1. **Read carefully** — Understand the actual concern
2. **Verify locally** — Reproduce or confirm the issue
3. **Categorize** — Is this a bug, style, optimization, or preference?
4. **Respond** — Acknowledge, question, or push back with data

## When to Push Back

| Scenario | Response |
|----------|----------|
| Suggestion adds complexity without value | "This adds N lines for hypothetical future need. YAGNI applies." |
| Change breaks existing behavior | "This would break X. Current approach handles Y correctly." |
| Style preference disguised as bug | "Noted, but current pattern matches codebase conventions." |
| Requested feature is "professional" polish | "This works correctly. The suggested enhancement is not in scope." |

## YAGNI Check

Before implementing "improvements":
- Does this solve a real problem or hypothetical one?
- Is the complexity justified by actual usage?
- Would a simpler solution suffice?

If answer is "hypothetical" or "no" — push back.

## Red Flags

- Agreeing immediately without verification
- Implementing suggestions that increase complexity unnecessarily
- Treating style preferences as bugs
- Adding "professional" features that nobody asked for
