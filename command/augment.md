---
description: Rewrite a draft prompt into a stronger, intent-aware prompt for review.
agent: build
---

You are rewriting the user's draft prompt for review only.

## Your Task

Use the `augment_prompt` tool with:
- `draft`: `$ARGUMENTS`
- `mode`: `auto`

If `$ARGUMENTS` is empty, do not guess. Return exactly:

```text
Usage: /augment <draft prompt>
```

## Output Format

1. `Intent: <intent> | Mode: <mode> | Intensity: <intensity>`
2. A fenced code block containing only the rewritten prompt from `enhanced`
3. `Review, copy, and send it manually.`

## Rules

- Do not answer the draft prompt itself
- Do not execute the requested work
- Do not add commentary beyond the required output format
- Return the rewritten prompt only
