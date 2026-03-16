# CliKit Plugin for OpenCode

Curated agents, commands, skills, and memory system for OpenCode.

## Features

- **7 Specialized Agents**: build, plan, explore, review, vision, oracle, research
- **Commands**: primary workflow + utility commands (see Commands section)
- **48 Workflow Skills**: TDD, debugging, design, UI/UX, integrations, ritual-workflow, and more
- **7 Internal Utilities**: memory (read/search/get/timeline/update/admin), observation, swarm, beads-memory-sync, quick-research, context-summary, cass-memory (used by hooks, not directly registered as agent tools)
- **11 Runtime Hooks**: todo enforcer, empty output sanitizer, git guard, security check, subagent blocker, truncator, swarm enforcer, memory digest, todo→beads sync, beads-context, and cass-memory
- **Memory System**: Templates, specs, plans, research artifacts with FTS5 search
- **Extended Permissions**: doom_loop, external_directory controls
- **Configurable**: Enable/disable agents, override models, customize behavior

## Installation

### Step 1 — Install Beads (required)

CliKit uses [Beads](https://github.com/steveyegge/beads) (`bd`) for persistent task tracking. Install it system-wide first.

**Windows (PowerShell):**
```pwsh
irm https://raw.githubusercontent.com/steveyegge/beads/main/install.ps1 | iex
```

**macOS / Linux — Homebrew (recommended):**
```bash
brew install beads
```

**npm / bun:**
```bash
npm install -g @beads/bd
# or
bun install -g --trust @beads/bd
```

**go install (Go 1.24+ required):**
```bash
go install github.com/steveyegge/beads/cmd/bd@latest
```

Verify:
```bash
bd version
```

### Step 2 — Initialize Beads in your project

```bash
cd your-project
bd init --quiet
```

This creates the `.beads/` database directory. Do this once per project.

### Step 3 — Install CliKit

```bash
# Install CliKit globally for OpenCode
bun x clikit-plugin install

# Restart OpenCode
```

The plugin is registered in `~/.config/opencode/opencode.json`.

CliKit injects default MCP server entries at runtime when missing:

- `beads-village` (`npx beads-village`) — requires `bd init` to have been run in the project
- `context7` (`https://mcp.context7.com/mcp`)
- `grep` (`https://mcp.grep.app`)
- `human-mcp` (`npx @goonnguyen/human-mcp`)

Recommended environment variables:

- `CONTEXT7_API_KEY` for Context7
- `GOOGLE_GEMINI_API_KEY` for Human MCP

## Quick Start

After installation, use these commands:

**Quick mode** (simple features):
```
/create → /start → /ship → /verify
```

**Deep mode** (complex features, research, UI):
```
/create → /research → /design → /start → /ship → /verify
```

Workflow notes:
- `/create` explores codebase first, then produces both spec and plan
- `/start` executes the plan produced by `/create`, one Task Packet at a time
- `/verify` is the **pre-ship gate** — all 4 checks must pass before `/ship` finalizes
- `/research` conducts external research before planning (deep mode)
- `/design` implements UI/UX with variant exploration and a11y (uses Vision agent, deep mode)
- Beads is the live execution source of truth
- Plans decompose work into **Task Packets** (1 concern, 1–3 files, one verify bundle)

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
    "todo_enforcer": { "enabled": true, "beads_authoritative": true, "warn_on_incomplete": false },
    "empty_message_sanitizer": { "enabled": true },
    "git_guard": { "enabled": true },
    "security_check": { "enabled": true },
    "subagent_question_blocker": { "enabled": true },
    "truncator": { "enabled": true, "packet_friendly": true },
    "swarm_enforcer": { "enabled": true },
    "memory_digest": { "enabled": true, "compact_mode": true },
    "todo_beads_sync": { "enabled": false, "mode": "disabled" },
    "cass_memory": { "enabled": true },
    "beads_context": { "enabled": true, "active_only": true, "ready_limit": 3 }
  },
  "workflow": {
    "mode": "compressed",
    "active_roles": ["build", "plan", "review", "coordinator"],
    "use_packets": true,
    "embed_verify_in_start": true,
    "verify_is_audit": true,
    "subagent_call_budget": 2
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
| `workflow.mode` | `classic \| compressed` | `compressed` | Select compressed packet workflow |

### Hooks

| Hook | Default | Description |
|------|---------|-------------|
| `todo_enforcer` | on | Optional UI warning; Beads can remain authoritative |
| `empty_message_sanitizer` | on | Replaces empty tool outputs with placeholder |
| `git_guard` | on | Blocks dangerous git commands (force push, hard reset, rm -rf) |
| `security_check` | on | Scans for secrets/credentials before git commits |
| `subagent_question_blocker` | on | Prevents subagents from asking clarifying questions |
| `truncator` | on | Truncates large outputs to prevent context overflow |
| `swarm_enforcer` | on | Enforces task isolation in multi-agent swarms |
| `memory_digest` | on | Generates `memory/_digest.md` index + topic files (`decision.md`, `learning.md`, etc.) from SQLite observations |
| `todo_beads_sync` | off | Legacy todo→Beads mirror; disabled in compressed workflow |
| `beads_context` | on | Injects active Beads task state into prompts |
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

Default active roles in compressed workflow: `build`, `plan`, `review`, plus coordinator logic in runtime. `explore`, `research`, `oracle`, and `vision` are on-demand specialists.

## Commands

Run with `/command-name` in OpenCode:

### Primary (Quick mode: `/create → /start → /ship → /verify`)
- `/create` - Explore codebase, gather requirements, create spec + plan
- `/start` - Execute plan packets with per-packet verification
- `/ship` - Finalize work, commit, create PR (requires `/verify` SHIP_READY)
- `/verify` - Pre-ship gate: all 4 checks + deep review, returns SHIP_READY verdict

### Deep mode extras (`/create → /research → /design → /start → /ship → /verify`)
- `/research` - External docs, API comparison, library investigation
- `/design` - UI/UX design + implementation with variant exploration (Vision agent)

### Utilities
- `/debug` - Root-cause debug, implement fix, add regression test
- `/issue` - Quick issue creation in Beads
- `/status` - Workspace, beads, and artifact overview
- `/init` - Initialize CliKit in a project
- `/handoff` - Save session state for a break
- `/resume` - Resume from handoff
- `/commit` - Intelligent git commit (Conventional Commits)
- `/pr` - Generate and create pull request
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
