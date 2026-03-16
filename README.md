# CliKit

OpenCode plugin providing curated agents, commands, skills, hooks, and memory for AI-assisted development.

## Prerequisites

CliKit uses [Beads](https://github.com/steveyegge/beads) for persistent task tracking. Install it before using the plugin.

**Windows (PowerShell):**
```pwsh
irm https://raw.githubusercontent.com/steveyegge/beads/main/install.ps1 | iex
```

**macOS / Linux:**
```bash
brew install beads
# or
npm install -g @beads/bd
```

Then initialize Beads in your project:
```bash
cd your-project
bd init --quiet
```

## Quick Start

```bash
# Install plugin
bun add -d clikit-plugin

# Create .opencode/index.ts
echo 'import CliKitPlugin from "clikit-plugin";
export default CliKitPlugin;' > .opencode/index.ts
```

## What's Included

- **7 Specialized Agents**: build, plan, oracle, explore, research, review, vision
- **15 Slash Commands**: /create, /start, /ship, /verify, /debug, /design, /research, /commit, /pr, and more
- **48 Skills**: TDD, debugging, design, UI/UX, integrations, collaboration, and more
- **10 Runtime Hooks**: todo enforcer, empty output sanitizer, git guard, security check, subagent blocker, truncator, swarm enforcer, memory digest, todo→beads sync, cass-memory
- **Memory System**: specs, plans, research, reviews, handoffs

## Project Structure

```
.opencode/           # Plugin source
  src/               # TypeScript source
    agents/          # Agent definitions
    skills/          # Skill definitions
    commands/        # Command definitions
    hooks/           # Runtime hooks
  skill/             # Workflow skills (48)
  memory/            # Memory artifacts
    specs/           # Specifications
    plans/           # Implementation plans
    research/        # Research notes
    reviews/         # Code reviews
    handoffs/        # Session handoff state
    beads/           # Beads task artifacts
    _templates/      # Document templates
  command/           # Slash command prompts
.beads/              # Beads task database (created by `bd init`)
```

## Configuration

See `.opencode/clikit.jsonc` (or `.opencode/clikit.json`) for project-level config.
See `.opencode/README.md` for full documentation.
