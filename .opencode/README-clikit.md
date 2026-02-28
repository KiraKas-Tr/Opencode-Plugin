# CliKit Plugin for OpenCode

Curated agents, commands, skills, and memory system for OpenCode.

## Features

- **10 Specialized Agents**: build, general, oracle, librarian, explore, looker, plan, review, scout, vision
- **19 Slash Commands**: /create, /start, /plan, /ship, /verify, /review, /debug, /pr, and more
- **48 Workflow Skills**: TDD, debugging, design, UI/UX, integrations, ritual-workflow, and more
- **6 Custom Tools**: memory (6), observation, swarm, beads-memory-sync, quick-research, context-summary
- **14 Runtime Hooks**: git guard, security check, auto-format, typecheck gate, truncator, compaction, ritual enforcer, session notifications, and more
- **Memory System**: Templates, specs, plans, research artifacts with FTS5 search
- **Ritual Workflow**: Enforces DISCOVER → PLAN → IMPLEMENT → VERIFY → COMPLETE phases
- **Extended Permissions**: doom_loop, external_directory controls
- **Configurable**: Enable/disable agents, override models, customize behavior

## Installation

```bash
# Install CliKit globally for OpenCode
bun x clikit-plugin install

# Restart OpenCode
```

That's it! The plugin will be registered in `~/.config/opencode/opencode.json`.

## Quick Start

After installation, use these commands:

```
/create → /plan → /start → /verify → /ship
```

## Configuration

Create `clikit.config.json` in one of these locations:

- **User (global)**:
  - Linux/macOS: `~/.config/opencode/clikit.config.json`
  - Windows: `%APPDATA%\opencode\clikit.config.json`
- **Project**: `.opencode/clikit.config.json`

Project config overrides user config.

### Example Configuration

```json
{
  "$schema": "https://unpkg.com/clikit-plugin/schema.json",
  "disabled_agents": ["scout"],
  "disabled_commands": ["security"],
  "agents": {
    "oracle": {
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
    "session_logging": true,
    "tool_logging": false,
    "todo_enforcer": { "enabled": true },
    "empty_message_sanitizer": { "enabled": true },
    "git_guard": { "enabled": true },
    "security_check": { "enabled": true },
    "subagent_question_blocker": { "enabled": true },
    "comment_checker": { "enabled": true, "threshold": 0.3 },
    "env_context": { "enabled": true },
    "auto_format": { "enabled": false },
    "typecheck_gate": { "enabled": false },
    "session_notification": { "enabled": true },
    "truncator": { "enabled": true },
    "compaction": { "enabled": true },
    "swarm_enforcer": { "enabled": true }
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `disabled_agents` | `string[]` | `[]` | Agent names to disable |
| `disabled_commands` | `string[]` | `[]` | Command names to disable |
| `agents` | `object` | `{}` | Per-agent overrides (model, temperature, etc.) |
| `commands` | `object` | `{}` | Per-command overrides |
| `hooks.session_logging` | `boolean` | `true` | Session lifecycle logging |
| `hooks.tool_logging` | `boolean` | `false` | Tool execution logging |

### Hooks

| Hook | Default | Description |
|------|---------|-------------|
| `todo_enforcer` | on | Warns when todos are incomplete at session idle |
| `empty_message_sanitizer` | on | Replaces empty tool outputs with placeholder |
| `git_guard` | on | Blocks dangerous git commands (force push, hard reset, rm -rf) |
| `security_check` | on | Scans for secrets/credentials before git commits |
| `subagent_question_blocker` | on | Prevents subagents from asking clarifying questions |
| `comment_checker` | on | Detects excessive AI-generated comments in code |
| `env_context` | on | Injects git branch, package info, project structure |
| `auto_format` | **off** | Runs prettier/biome/dprint after file edits |
| `typecheck_gate` | **off** | Runs tsc after TypeScript file edits |
| `session_notification` | on | Desktop notifications on idle/error (Linux/macOS/Windows) |
| `truncator` | on | Truncates large outputs to prevent context overflow |
| `compaction` | on | Preserves beads state + memory during context compaction |
| `swarm_enforcer` | on | Enforces task isolation in multi-agent swarms |

## Agents

| Agent | Mode | Description |
|-------|------|-------------|
| `build` | primary | Primary code executor, implements plans |
| `general` | subagent | General-purpose, multi-step tasks & complex questions |
| `plan` | primary | Creates implementation plans from specs |
| `oracle` | subagent | Expert advisor for architecture & debugging |
| `librarian` | subagent | Multi-repo analysis, doc lookup |
| `explore` | subagent | Fast codebase exploration |
| `looker` | subagent | Deep code inspection & architecture analysis |
| `scout` | subagent | External research & web search |
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
- `/status` - Workspace and bead overview
- `/commit` - Intelligent git commit
- `/issue` - Quick issue creation
- `/import-plan` - Import from Jira/Notion/Linear

## Skills

47 workflow skills organized into 8 categories:

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
│   └── hooks/        # Runtime hooks (13 modules)
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
└── clikit.config.json
```

## License

MIT
