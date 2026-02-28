# CliKit Agents

10 specialized agents for AI-assisted development.

## Primary Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| @build | claude-opus-4.5 (thinking) | Primary executor, implements plans |
| @plan | gpt-5.2-codex | Strategic planning, creates specs |

## Subagents

| Agent | Model | Purpose |
|-------|-------|---------|
| @general | kimi-k2.5 | Multi-step tasks, complex questions |
| @oracle | gpt-5.1-codex-max | Architecture & debugging advisor |
| @librarian | gpt-5.1-codex-max | Multi-repo analysis, doc lookup |
| @explore | gemini-3-flash | Fast codebase navigation |
| @looker | gemini-3-flash | Deep code inspection |
| @scout | gemini-3-flash | External research |
| @review | gpt-5.2-codex | Code review & security audit |
| @vision | gemini-3-pro | Design + visual implementation |

## Delegation

| Task | Delegate To |
|------|-------------|
| Implement feature | @build |
| Create plan/spec | @plan |
| Explore codebase | @explore |
| Deep analysis | @looker |
| External research | @scout |
| Code review | @review |
| UI/UX work | @vision |
| Architecture advice | @oracle |
| Library research | @librarian |
| General tasks | @general |

## Rules

- Primary agents can delegate to subagents
- Subagents should NOT delegate to other subagents
- @build is the default for implementation
- @plan is the default for planning
- Always use @review before merging
