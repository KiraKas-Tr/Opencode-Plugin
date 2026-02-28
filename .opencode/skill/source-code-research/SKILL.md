---
name: source-code-research
description: Use when API documentation is insufficient. Research library implementation details by fetching package source.
---

# Source Code Research Skill

You are running the **source-code-research** skill. Go beyond API docs to understand internals.

## When to Use

- API docs don't explain behavior
- Need to understand edge cases
- Debugging library interactions
- Learning implementation patterns
- Verifying documented behavior

## Research Protocol

### 1. Identify Package
```bash
# Find package location
which <package>
npm list <package>

# Find source location
ls -la node_modules/<package>/
```

### 2. Locate Source
```
Check for:
- src/ directory
- lib/ directory
- dist/ with sourcemaps
- TypeScript .ts files
- Index entry point
```

### 3. Read Key Files
Focus on:
- Entry point (index.js/ts)
- Main export file
- Types/interfaces
- Core implementation
- Tests (for behavior)

### 4. Trace Execution
- Follow function calls
- Map data flow
- Identify decision points
- Note error handling

## Key Questions to Answer

| Question | Why |
|----------|-----|
| How is this implemented? | Understand behavior |
| What edge cases exist? | Avoid surprises |
| How are errors handled? | Proper error handling |
| What are the types? | TypeScript integration |
| What are the defaults? | Implicit behavior |

## Finding Patterns

### Constructor Pattern
```javascript
// Look for initialization logic
class Example {
  constructor(options) {
    this.options = { ...defaults, ...options };
  }
}
```

### Error Handling Pattern
```javascript
// Identify what throws vs returns
if (!valid) {
  throw new Error('...');
  // or
  return { error: '...' };
}
```

### Async Pattern
```javascript
// Understand async behavior
async function process() {
  // Is this parallel or sequential?
  await Promise.all([...]);
}
```

## Output Format

Save to `.opencode/memory/research/[package]-internals.md`:

```markdown
# [Package] Internals

## Entry Points
- Main: [file]
- Types: [file]

## Key Findings

### [Feature Name]
- **Location**: file:line
- **Behavior**: [description]
- **Edge Cases**: [list]

## Implementation Notes
[Key patterns discovered]

## Gotchas
[Surprising behaviors]
```

## Anti-Patterns

- Relying only on TypeScript definitions
- Not reading tests
- Assuming behavior from name
- Ignoring error paths

## Quick Reference

```bash
# Find main entry
cat node_modules/pkg/package.json | grep main

# Find types
cat node_modules/pkg/package.json | grep types

# Check for source
ls node_modules/pkg/src/
```
