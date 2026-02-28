# CliKit Plugin for OpenCode

Curated agents, commands, skills, and memory system for OpenCode.

## Features

- **7 Specialized Agents**: build, plan, explore, review, vision, oracle, research
- **19 Slash Commands**: /create, /start, /plan, /ship, /verify, /review, /debug, /pr, and more
- **48 Workflow Skills**: TDD, debugging, design, UI/UX, integrations, ritual-workflow, and more
- **7 Internal Utilities**: memory (read/search/get/timeline/update/admin), observation, swarm, beads-memory-sync, quick-research, context-summary, cass-memory (used by hooks, not directly registered as agent tools)
- **10 Runtime Hooks**: todo enforcer, empty output sanitizer, git guard, security check, subagent blocker, truncator, swarm enforcer, memory digest, todo→beads sync, and cass-memory
- **Memory System**: Templates, specs, plans, research artifacts with FTS5 search
- **Extended Permissions**: doom_loop, external_directory controls
- **Configurable**: Enable/disable agents, override models, customize behavior

## Installation

```bash
# Install CliKit globally for OpenCode
bun x clikit-plugin install

# Restart OpenCode
```

That's it! The plugin will be registered in `~/.config/opencode/opencode.json`.

CliKit injects default MCP server entries at runtime when missing:

- `beads-village` (`npx beads-village`)
- `context7` (`https://mcp.context7.com/mcp`)
- `grep` (`https://mcp.grep.app`)
- `human-mcp` (`npx @goonnguyen/human-mcp`)

Recommended environment variables:

- `CONTEXT7_API_KEY` for Context7
- `GOOGLE_GEMINI_API_KEY` for Human MCP

## Quick Start

After installation, use these commands:

```
/create → /plan → /start → /verify → /ship
```

## Configuration

Create `clikit.jsonc` (preferred) or `clikit.json` in one of these locations:

- **User (global)**:
  - Linux/macOS: `~/.config/opencode/clikit.jsonc` (or `clikit.json`)
  - Windows: `%APPDATA%\opencode\clikit.jsonc` (or `clikit.json`)
- **Project**: `.opencode/clikit.jsonc` (or `clikit.json`)

Legacy `clikit.config.json` is still supported for backward compatibility.

Project config overrides user config.

### Example Configuration

```json
{
  "$schema": "https://unpkg.com/clikit-plugin@latest/schema.json",
  "disabled_agents": ["review"],
  "disabled_commands": ["security"],
  "disabled_skills": ["playwright"],
  "skills": {
    "enable": ["test-driven-development", "systematic-debugging"],
    "disable": ["sharing-skills"]
  },
  "agents": {
    "vision": {
      "model": "openai/gpt-4o"
    },
    "build": {
      "model": "anthropic/claude-sonnet-4-5-20250514",
      "temperature": 0.2,
      "permission": {
        "doom_loop": "deny",
        "external_directory": "ask"
      }
    }
  },
  "hooks": {
    "session_logging": false,
    "tool_logging": false,
    "todo_enforcer": { "enabled": true },
    "empty_message_sanitizer": { "enabled": true },
    "git_guard": { "enabled": true },
    "security_check": { "enabled": true },
    "subagent_question_blocker": { "enabled": true },
    "truncator": { "enabled": true },
    "swarm_enforcer": { "enabled": true },
    "memory_digest": { "enabled": true },
    "todo_beads_sync": { "enabled": true },
    "cass_memory": { "enabled": true }
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `disabled_agents` | `string[]` | `[]` | Agent names to disable |
| `disabled_commands` | `string[]` | `[]` | Command names to disable |
| `disabled_skills` | `string[]` | `[]` | Skill names to disable |
| `agents` | `object` | `{}` | Per-agent overrides (model, temperature, etc.) |
| `commands` | `object` | `{}` | Per-command overrides |
| `skills` | `object \| string[]` | `{}` | Skill enable/disable and per-skill overrides |
| `hooks.session_logging` | `boolean` | `false` | Session lifecycle logging |
| `hooks.tool_logging` | `boolean` | `false` | Tool execution logging |

### Hooks

| Hook | Default | Description |
|------|---------|-------------|
| `todo_enforcer` | on | Warns when todos are incomplete at session idle |
| `empty_message_sanitizer` | on | Replaces empty tool outputs with placeholder |
| `git_guard` | on | Blocks dangerous git commands (force push, hard reset, rm -rf) |
| `security_check` | on | Scans for secrets/credentials before git commits |
| `subagent_question_blocker` | on | Prevents subagents from asking clarifying questions |
| `truncator` | on | Truncates large outputs to prevent context overflow |
| `swarm_enforcer` | on | Enforces task isolation in multi-agent swarms |
| `memory_digest` | on | Generates `memory/_digest.md` index + topic files (`decision.md`, `learning.md`, etc.) from SQLite observations |
| `todo_beads_sync` | on | Mirrors OpenCode todos into Beads issues |
| `cass_memory` | on | Loads embedded memory context on session start and runs idle reflection (`cassMemoryContext`, `cassMemoryReflect`) |

## Agents

| Agent | Mode | Description |
|-------|------|-------------|
| `build` | primary | Primary code executor, implements plans |
| `plan` | primary | Creates implementation plans from specs |
| `oracle` | subagent | Deep code inspection + architecture trade-off analysis |
| `research` | subagent | External docs + GitHub evidence research |
| `explore` | subagent | Fast codebase exploration |
| `review` | subagent | Code review & quality gate |
| `vision` | subagent | Design direction + visual implementation |

## Commands

Run with `/command-name` in OpenCode:

- `/create` - Start new bead, create specification
- `/start` - Begin implementing from a plan
- `/plan` - Create implementation plan
- `/debug` - Debug issues, find root cause, implement fix
- `/verify` - Run full verification suite
- `/ship` - Final verification + PR + cleanup
- `/review` - Request code review
- `/review-codebase` - Full codebase audit
- `/vision` - Review UI for design, a11y, responsiveness
- `/pr` - Create pull request
- `/init` - Initialize CliKit in a project
- `/research` - External research
- `/design` - UI/UX design implementation
- `/handoff` - Save state for session break
- `/resume` - Continue from handoff
- `/status-beads` - Workspace and bead overview
- `/commit` - Intelligent git commit
- `/issue` - Quick issue creation
- `/import-plan` - Import from Jira/Notion/Linear

## Skills

48 workflow skills organized into 8 categories:

### Design & Planning (4)
| Skill | Use When |
|-------|----------|
| `brainstorming` | Starting without clear requirements |
| `writing-plans` | Requirements clear, need implementation plan |
| `executing-plans` | Plan exists, need to execute tasks |
| `development-lifecycle` | Building complete feature from scratch |

### UI/UX & Frontend (7)
| Skill | Use When |
|-------|----------|
| `frontend-aesthetics` | Building UI, avoid "AI slop" |
| `gemini-large-context` | Analyzing 100KB+ files |
| `ui-ux-research` | Multimodal UI/UX analysis |
| `mockup-to-code` | Converting mockups to code |
| `visual-analysis` | Analyzing images/screenshots |
| `accessibility-audit` | WCAG compliance check |
| `design-system-audit` | Design system consistency |

### Development (8)
| Skill | Use When |
|-------|----------|
| `subagent-driven-development` | Fast iteration with quality gates |
| `dispatching-parallel-agents` | 3+ independent failures |
| `deep-research` | LSP exploration with confidence scores |
| `source-code-research` | Library internals research |
| `using-git-worktrees` | Isolated workspace on new branch |
| `finishing-a-development-branch` | Complete branch workflow |
| `vercel-react-best-practices` | React/Next.js optimization |
| `supabase-postgres-best-practices` | Postgres optimization |

### Testing (4)
| Skill | Use When |
|-------|----------|
| `test-driven-development` | Implementing any feature |
| `condition-based-waiting` | Flaky tests from race conditions |
| `testing-anti-patterns` | Avoiding testing mistakes |
| `testing-skills-with-subagents` | TDD for process docs |

### Debugging (4)
| Skill | Use When |
|-------|----------|
| `systematic-debugging` | Encountering a bug |
| `root-cause-tracing` | Finding original trigger |
| `defense-in-depth` | Multi-layer validation |
| `verification-before-completion` | Marking task complete |

### Integration (16)
| Skill | Use When |
|-------|----------|
| `figma` | Access Figma design data |
| `playwright` | Browser automation |
| `chrome-devtools` | Browser debugging |
| `polar` | Payment integration |
| `beads` | Multi-agent task coordination |
| `beads-bridge` | Bridge Beads with todo system |
| `swarm-coordination` | Parallel task execution |
| `session-management` | Context growth management |
| `playwriter` | Chrome extension browser automation |
| `mqdh` | Meta Quest VR/AR development |
| `v0` | AI-powered UI generation |
| `resend` | Transactional emails |
| `notebooklm` | Query NotebookLM |
| `supabase` | Supabase platform |
| `cloudflare` | Cloudflare Workers/Pages |
| `v1-run` | npm package intelligence |

### Collaboration (3)
| Skill | Use When |
|-------|----------|
| `requesting-code-review` | After completing a task |
| `receiving-code-review` | Handling review feedback |
| `sharing-skills` | Contributing skills via PR |

### Meta (1)
| Skill | Use When |
|-------|----------|
| `writing-skills` | Creating new skills |

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Type check
bun run typecheck

# Unit tests
bun run test

# Full local verification
bun run verify

# Watch mode
bun run dev
```

## Structure

```
.opencode/
├── src/
│   ├── index.ts      # Plugin entrypoint
│   ├── config.ts     # Config loader
│   ├── types.ts      # Type definitions
│   ├── agents/       # Agent loaders
│   ├── skills/       # Skill loaders
│   ├── tools/        # Internal utilities (memory, swarm, etc.)
│   └── hooks/        # Runtime hooks (10 modules)
├── skill/            # Skill definitions (*.md)
├── command/          # Command definitions (*.md)
├── memory/           # Memory system
│   ├── _templates/   # Document templates
│   ├── specs/        # Specifications
│   ├── plans/        # Implementation plans
│   ├── research/     # Research artifacts
│   ├── reviews/      # Code reviews
│   ├── handoffs/     # Session handoffs
│   ├── beads/        # Beads task artifacts
│   └── prds/         # Product requirements
└── clikit.jsonc
```

## License

MIT
