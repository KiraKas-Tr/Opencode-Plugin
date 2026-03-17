# Skill Anatomy Reference

## SKILL.md — Full Specification

### Frontmatter Fields

| Field | Required | Rules |
|-------|----------|-------|
| `name` | ✅ | Lowercase letters, numbers, hyphens. No leading/trailing hyphens. Max 64 chars. Must match directory name. |
| `description` | ✅ | Max 200 chars. Starts with "Use when…" or trigger condition. Ends with what the skill does. |

**Good description:**
```yaml
description: Use when creating a new skill. Produces SKILL.md, references/, and mcp.json following Agent Skills standard.
```

**Bad description:**
```yaml
description: Helps with skills.       # too vague — agent won't trigger
description: A skill for writing skills for AI agents in OpenCode environments that...  # too long
```

### Body Structure

```markdown
# Title (no "Skill" suffix needed)

## Workflow         ← what to do, in order
## Rules            ← decision tables, hard constraints
## Red Flags        ← patterns to avoid
## References       ← links to references/ and mcp.json (if any)
```

### What NOT to Include in Body

- `"You are running the X skill."` — always omitted
- Long tool parameter tables → move to `references/`
- Code examples > 15 lines → move to `references/`
- Content that is only sometimes relevant → move to `references/`

---

## references/ — Specification

### When to Split

| Candidate | Split if... |
|-----------|-------------|
| Tool signatures | > 3 tools with params |
| Code examples | Block > 15 lines |
| Decision tables | > 10 rows |
| Step-by-step details | Only needed for specific sub-tasks |

### File Naming

```
references/
  api-reference.md      # tool params and examples
  tool-reference.md     # MCP tool signatures
  patterns.md           # extended code patterns
  quick-ref.md          # command cheatsheet
  decision-matrix.md    # expanded decision tables
  lsp-ops.md            # LSP tool reference
```

### Linking from SKILL.md

Every reference file MUST be linked in SKILL.md:

```markdown
## References

- [API reference](references/api-reference.md) — full tool params and example session
- [Patterns](references/patterns.md) — extended code examples
```

The description after `—` tells the agent *what's in the file* so it knows whether to load it.

---

## mcp.json — Specification

### Structure

```json
{
  "mcpServers": {
    "server-name": {
      "type": "local" | "remote",
      "command": ["npx", "-y", "package-name"],    // local only
      "url": "https://...",                          // remote only
      "description": "one-line purpose",
      "tools": ["tool_name_1", "tool_name_2"]
    }
  }
}
```

### Local Server (stdio)

```json
{
  "mcpServers": {
    "my-tool": {
      "type": "local",
      "command": ["npx", "-y", "@scope/mcp-server"],
      "description": "What this server does",
      "tools": ["tool_a", "tool_b"]
    }
  }
}
```

### Remote Server (HTTP/SSE)

```json
{
  "mcpServers": {
    "my-remote": {
      "type": "remote",
      "url": "https://mcp.example.com/mcp",
      "description": "What this server does",
      "tools": ["query", "search"]
    }
  }
}
```

### With Auth / Env Vars

```json
{
  "mcpServers": {
    "my-api": {
      "type": "remote",
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer {env:MY_API_KEY}"
      },
      "tools": ["fetch_data"]
    }
  }
}
```

### Rules

- Only list tools the skill **actually uses** — not all tools the server exposes
- `tools` array is documentation + scope boundary, not a runtime filter
- Prefer `npx -y` for local servers (no pre-install needed)
- Use `{env:VAR_NAME}` for secrets — never hardcode API keys

---

## Complete Example: a minimal skill

```
my-skill/
├── SKILL.md
├── mcp.json
└── references/
    └── patterns.md
```

**SKILL.md**
```markdown
---
name: my-skill
description: Use when doing X. Automates Y and Z via MCP tool.
---

# My Skill

## Workflow

1. Step one
2. Call `tool_name(param)` via MCP
3. Verify result

## Rules

| Situation | Action |
|-----------|--------|
| Tool returns error | Log and retry once |
| Result is empty | Ask user for clarification |

## Red Flags

- Skipping verification step
- Calling tool without valid input

## References

- [Patterns](references/patterns.md) — extended examples
- MCP: `my-tool` — see [mcp.json](mcp.json)
```

**mcp.json**
```json
{
  "mcpServers": {
    "my-tool": {
      "type": "local",
      "command": ["npx", "-y", "my-mcp-package"],
      "description": "Does Y and Z",
      "tools": ["tool_name"]
    }
  }
}
```
