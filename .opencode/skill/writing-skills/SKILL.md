---
name: writing-skills
description: Use when creating new skills. Follow TDD approach for skill development.
---

# Writing Skills Skill

You are running the **writing-skills** skill. Test-driven skill creation.

## Skill File Structure

```markdown
---
name: skill-name
description: Use when [specific trigger condition]. Brief purpose.
---

# Skill Title

[Content]
```

## TDD for Skills: RED-GREEN-REFACTOR

### RED: Baseline Test

Before writing the skill:
1. Identify the problem the skill solves
2. Document expected behavior
3. Note edge cases and failure modes
4. This is your "test" — does the skill handle these?

### GREEN: Write the Skill

Write the minimum skill content that:
- Solves the identified problem
- Handles documented edge cases
- Provides clear guidance

### REFACTOR: Close Loopholes

Review and improve:
- Are there ambiguous instructions?
- Could the skill be misinterpreted?
- Does it handle the failure modes?
- Is it concise and actionable?

## Description Rules

- Start with "Use when..." for trigger clarity
- One clear purpose per skill
- Avoid vague descriptions like "Helps with code"

## Quality Checklist

- [ ] Name is clear and action-oriented
- [ ] Description starts with "Use when..."
- [ ] Covers when to invoke the skill
- [ ] Provides actionable steps
- [ ] Handles edge cases
- [ ] Lists red flags or anti-patterns

## Red Flags

- Skills that are too broad (multiple purposes)
- Missing trigger conditions
- No actionable guidance
- Emotional language instead of technical
