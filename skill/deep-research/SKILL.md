---
name: deep-research
description: Use when exploring unfamiliar code or implementing complex features. Structured LSP exploration with confidence-scored findings saved to memory.
---

# Deep Research

## Workflow

```
1. Define question
2. lsp_workspace_symbols → find entry points
3. lsp_goto_definition → trace origins
4. lsp_find_references → map all usages
5. lsp_document_symbols → understand exports
6. bash: tilth <path>  → smart read (outline first, then section drill)
   Fallback: read <path> (auto-enhanced) → grep (pattern search)
7. Incoming/outgoing call hierarchy → trace data flow
8. Score each finding 1–10
9. Save to memory/research/[topic]-findings.md
```

> **Step 6 — tilth-first reading:** for any file surfaced by LSP, use `bash: tilth <path>` to get a smart outline before reading in full. Use `--section` to drill into specific functions. Fall back to `read` + `grep` only when tilth is unavailable.

## Confidence Scoring

| Score | Meaning |
|-------|---------|
| 1–3 | Speculation — needs verification |
| 4–6 | Probable — partial evidence |
| 7–9 | Confident — strong evidence |
| 10 | Certain — verified in code |

Never assert anything below 4 without flagging uncertainty.

## Output Format

Save to `.opencode/memory/research/[topic]-findings.md`:

```markdown
# [Topic] Research

## Summary
[1–2 sentences]

## Key Findings
### [Finding]
- Confidence: N/10
- Evidence: file:line
- Notes: …

## Open Questions
## Recommendations
```

## Red Flags

- Skipping LSP — guessing structure instead of tracing it
- Reading large files with `read` without trying `tilth` outline first
- Not saving findings to memory (lost between sessions)
- Asserting with confidence < 4 without flagging it

## References

- [LSP tool reference](references/lsp-ops.md) — all LSP tools, when to use each, research sequence
- MCP: `context7` (library docs) + `grep` (GitHub patterns) — see [mcp.json](mcp.json)
