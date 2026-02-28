# CliKit

OpenCode plugin with 10 agents, 19 commands, 48 skills, 14 hooks.

## Agents

| Agent | Role |
|-------|------|
| @build | Primary executor |
| @plan | Strategic planning |
| @general | Multi-step tasks |
| @oracle | Architecture advisor |
| @librarian | Multi-repo analysis |
| @explore | Fast navigation |
| @looker | Deep inspection |
| @scout | External research |
| @review | Code review |
| @vision | Design + visuals |

## Workflow

```
/create → /plan → /start → /verify → /ship
```

## Rules

- Always verify before claiming done
- Use TDD for new features
- Check todos before session end
- Run typecheck + lint + test before commit
- Never force push without --force-with-lease

## Memory

- Specs: `.opencode/memory/specs/`
- Plans: `.opencode/memory/plans/`
- Handoffs: `.opencode/memory/handoffs/`

## Skills

Load relevant skills before tasks:
- TDD: `test-driven-development`
- Debugging: `systematic-debugging`
- Planning: `brainstorming` → `writing-plans`
- Design: `frontend-aesthetics`
