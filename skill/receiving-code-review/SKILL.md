---
name: receiving-code-review
description: Use when receiving code review feedback. Verify before accepting, push back with data when appropriate.
---

# Receiving Code Review

## Protocol

1. **Read** — understand the actual concern, not the surface suggestion
2. **Verify locally** — reproduce or confirm the issue
3. **Categorize** — bug / style / optimization / preference
4. **Respond** — acknowledge, question, or push back with evidence

## When to Push Back

| Scenario | Response |
|----------|----------|
| Adds complexity for hypothetical need | "YAGNI — adds N lines for a case we don't have" |
| Breaks existing behavior | "This breaks X. Current approach handles Y correctly." |
| Style preference, not a bug | "Current pattern matches codebase conventions." |
| Out-of-scope polish | "Works correctly. This enhancement is not in scope." |

## YAGNI Check (before accepting "improvements")

- Does this solve a real problem or a hypothetical one?
- Is the complexity justified by actual usage?
- Would a simpler solution suffice?

If "hypothetical" → push back.

## Red Flags

- Agreeing immediately without verifying
- Implementing suggestions that increase complexity without value
- Treating style preferences as bugs
