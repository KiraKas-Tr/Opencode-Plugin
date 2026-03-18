---
name: source-code-research
description: Use when API docs are insufficient. Go directly to package source to understand edge cases, error behavior, and internal patterns.
---

# Source Code Research

## When to Use

- API docs don't explain the behavior you're seeing
- Need to understand edge cases or error handling
- Debugging library interactions
- Verifying that documented behavior is actually implemented

## Protocol

```bash
# 1. Locate source — tilth-first
bash: tilth node_modules/<pkg>/package.json
bash: tilth node_modules/<pkg>/src/

# Fallback: use grep/read only if tilth unavailable
grep -E '"main"|"types"|"source"' node_modules/<pkg>/package.json
```

```bash
# 2. Read entry point — tilth-first
bash: tilth node_modules/<pkg>/src/index.ts
bash: tilth node_modules/<pkg>/src/index.ts --section "## exports"

# Fallback
read node_modules/<pkg>/src/index.ts
```

```bash
# 3. Read tests — tilth gives outline first for large test files
bash: tilth node_modules/<pkg>/test/
bash: tilth node_modules/<pkg>/__tests__/

# Fallback
read node_modules/<pkg>/test/index.test.ts
```

> **Tilth-first rule:** always try `bash: tilth <path>` before `read` or `cat`.
> For large source files, tilth's outline mode shows all exports/functions before you commit to reading the full file.

## What to Look For

| Question | Where |
|----------|-------|
| What are the defaults? | Constructor / options merge |
| What throws vs returns error? | Error handling paths |
| What's async vs sync? | Promise.all vs sequential awaits |
| What are the types? | Type definitions, interfaces |
| What edge cases exist? | Conditional branches, null checks |

## Output

Save to `.opencode/memory/research/[package]-internals.md`:

```markdown
# [Package] Internals

## Entry Points
- Main: [file]
- Types: [file]

## Key Findings
### [Feature]
- Location: file:line
- Behavior: …
- Edge Cases: …

## Gotchas
```

## Red Flags

- Relying only on TypeScript type definitions (not the same as behavior)
- Not reading the tests
- Assuming behavior from the function name
- Ignoring error paths
- Using `cat` or raw `read` on large files without tilth outline first

## References

- [Quick reference](references/quick-ref.md) — locate source commands, grep patterns, Context7 MCP alternative
- MCP: `context7` — see [mcp.json](mcp.json)
