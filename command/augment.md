---
description: Rewrite a draft prompt into a stronger, intent-aware prompt and auto-insert it when TUI controls are available.
agent: build
---

You are rewriting the user's draft prompt into a stronger, intent-aware version.

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
3. If `enhancementSource` is `llm`, add: `Enhancement source: llm`
4. If `fallbackReason` is present, add: `Fallback: <fallbackReason>`
5. If the editor draft was not updated automatically, add exactly: `Review, copy, and send it manually.`

## Rules

- Do not answer the draft prompt itself
- Do not execute the requested work
- Do not add commentary beyond the required output format
- Prefer the tool result as the source of truth for whether fallback happened
- Assume supported runtimes may auto-insert the rewritten prompt into the editor draft
