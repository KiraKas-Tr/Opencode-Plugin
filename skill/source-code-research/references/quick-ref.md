# Source Code Research — Quick Reference

## Locate Package Source

```bash
# Entry point
node -e "console.log(require.resolve('<pkg>'))"

# package.json fields
node -e "const p=require('<pkg>/package.json'); console.log(p.main, p.types, p.source, p.exports)"

# Source directory
ls node_modules/<pkg>/src/ 2>/dev/null || ls node_modules/<pkg>/lib/

# Has TypeScript source?
ls node_modules/<pkg>/src/*.ts 2>/dev/null | head -5
```

## Read Tests (Best Behavior Docs)

```bash
ls node_modules/<pkg>/test/
ls node_modules/<pkg>/__tests__/
ls node_modules/<pkg>/spec/

# Read one
cat node_modules/<pkg>/test/core.test.js | head -100
```

## Trace a Specific Behavior

```bash
# Find where a method/function is defined
grep -r "functionName" node_modules/<pkg>/src/ -l
grep -n "functionName" node_modules/<pkg>/src/core.ts

# Find error messages (understand throw conditions)
grep -n "throw\|Error(" node_modules/<pkg>/src/core.ts

# Find defaults
grep -n "default\|DEFAULT\|\|\s*{}" node_modules/<pkg>/src/options.ts
```

## Context7 MCP Alternative

When local source is unclear, use Context7 MCP:

```
resolve-library-id(libraryName="<pkg>", query="<what you need to understand>")
→ get library ID
get-library-docs(libraryId="<id>", query="<specific question>")
```

## Output Template

```markdown
## [pkg] — [function/behavior]

- **Location**: src/core.ts:142
- **Behavior**: [what it actually does]
- **Defaults**: [default values if any]
- **Throws when**: [conditions]
- **Returns**: [shape of return value]
- **Gotcha**: [surprising behavior]
```
