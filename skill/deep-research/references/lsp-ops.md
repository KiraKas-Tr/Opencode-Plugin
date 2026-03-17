# LSP Operations Reference

Tools available via LSP in OpenCode. Use these in order during exploration.

## Navigation Tools

| Tool | Use | When |
|------|-----|------|
| `lsp_workspace_symbols(query)` | Find symbols across project | Start here — discover entry points |
| `lsp_goto_definition(file, line, col)` | Jump to symbol definition | Trace where something is implemented |
| `lsp_find_references(file, line, col)` | Find all usages | Map blast radius before changing |
| `lsp_document_symbols(file)` | List exports/structure of a file | Understand a file's API |
| `lsp_hover(file, line, col)` | Show type/doc at position | Understand a symbol's contract |

## Refactoring Tools

| Tool | Use | When |
|------|-----|------|
| `lsp_rename(file, line, col, new_name)` | Rename across project | Always prepare_rename first |
| `lsp_prepare_rename(file, line, col)` | Check if rename is safe | Before every rename |
| `lsp_code_actions(file, range)` | Suggest fixes/refactors | After diagnostics find issues |

## Quality Tools

| Tool | Use | When |
|------|-----|------|
| `lsp_diagnostics(file)` | Show type errors, warnings | Before editing + after every change |
| `lsp_code_action_resolve(action)` | Apply a code action | After selecting from lsp_code_actions |

## Research Sequence

```
1. lsp_workspace_symbols("keyword")     → find candidates
2. lsp_document_symbols("file.ts")      → understand structure
3. lsp_goto_definition(...)             → trace to source
4. lsp_find_references(...)             → see all usages
5. lsp_hover(...)                       → confirm types/contracts
```

## Call Hierarchy

OpenCode doesn't expose call hierarchy directly — approximate with:
- **Incoming callers**: `lsp_find_references` on the function
- **Outgoing callees**: `lsp_document_symbols` + manual trace via `lsp_goto_definition`
