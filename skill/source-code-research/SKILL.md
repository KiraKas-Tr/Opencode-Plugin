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
# 1. Locate source
cat node_modules/<pkg>/package.json | grep -E '"main"|"types"|"source"'
ls node_modules/<pkg>/src/

# 2. Read entry point
cat node_modules/<pkg>/src/index.ts   # or index.js

# 3. Read tests (best doc of real behavior)
ls node_modules/<pkg>/test/  ||  ls node_modules/<pkg>/__tests__/
```

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

## References

- [Quick reference](references/quick-ref.md) — locate source commands, grep patterns, Context7 MCP alternative
- MCP: `context7` — see [mcp.json](mcp.json)
