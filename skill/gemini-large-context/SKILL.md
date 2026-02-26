---
name: gemini-large-context
description: Use when context exceeds session limits or analyzing 100KB+ files. Leverages Gemini CLI's 1M token window.
---

# Gemini Large Context Skill

You are running the **gemini-large-context** skill. When you hit limits, scale up.

## When to Use

| Scenario | Why Gemini |
|----------|------------|
| Single file >100KB | Won't fit in standard context |
| Project-wide pattern search | Need full codebase visibility |
| Multi-file diff analysis | Compare across dozens of files |
| Legacy code archaeology | Understand decade-old systems |
| Full test suite review | See all tests at once |

## Process

### 1. Prepare Input

```bash
# Single large file
gemini -p "Analyze this file for [task]: $(cat large_file.ts)"

# Multiple files
cat file1.ts file2.ts file3.ts | gemini -p "Compare these files:"

# Full directory
find src -name "*.ts" -exec cat {} \; | gemini -p "Find patterns in codebase:"
```

### 2. Structure Your Prompt

```
Context: [what you're analyzing]
Task: [specific question or goal]
Constraints: [limitations, requirements]
Output: [expected format]
```

### 3. Handle Output

- Gemini returns full analysis
- Extract actionable items
- If incomplete, prompt for continuation
- Save important findings to memory

## Use Cases

### Large File Analysis
```
gemini -p "Map all exports and their dependencies in this file: $(cat huge_api.ts)"
```

### Pattern Detection
```
cat src/**/*.ts | gemini -p "Find all authentication patterns and security issues:"
```

### Multi-file Comparison
```
cat v1/api.ts v2/api.ts | gemini -p "Breaking changes between v1 and v2:"
```

## Checklist

- [ ] Confirmed file/directory size justifies large context
- [ ] Prompt includes specific task (not "analyze this")
- [ ] Output format specified
- [ ] Results saved to `.opencode/memory/` for reference

## Red Flags

- Using for small files (wastes resources)
- Vague prompts ("what do you think?")
- Not saving results (lose context on next session)
- Ignoring token limits still exists (1M isn't infinite)
