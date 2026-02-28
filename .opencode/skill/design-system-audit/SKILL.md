---
name: design-system-audit
description: Use when auditing design systems for consistency, documenting tokens, or identifying design debt.
---

# Design System Audit Skill

You are running the **design-system-audit** skill. Consistency is currency.

## Audit Scope

| Area | What to Check |
|------|---------------|
| Tokens | Definition, usage, gaps |
| Components | Documentation, variants, states |
| Patterns | Consistency, duplication |
| Documentation | Completeness, accuracy |

## Process

### 1. Token Audit

```bash
# Extract tokens from codebase
grep -r "var(--" src/ --include="*.css" | sort | uniq

# Compare with documented tokens
diff <(grep "export" tokens.ts) <(cat tokens.md)
```

Check:
- [ ] All tokens documented
- [ ] No hardcoded values bypassing tokens
- [ ] Semantic tokens exist (not just primitive)
- [ ] Token naming follows convention

### 2. Component Audit

For each component:
```markdown
## [Component Name]
- File: [path]
- Props: [documented?] [types?]
- Variants: [list] [documented?]
- States: [default, hover, focus, disabled, error, loading]
- Accessibility: [attributes] [tested?]
- Usage examples: [present?]
```

Red flags:
- Undocumented props
- Missing states
- No accessibility attributes
- Hardcoded colors/spacing
- Duplicate patterns

### 3. Pattern Inventory

```bash
# Find repeated patterns
gemini -p "Identify duplicate or inconsistent UI patterns in these components: $(cat components/*.tsx)"
```

Look for:
- Multiple button implementations
- Inconsistent spacing patterns
- Different shadow definitions
- Duplicate utility classes

### 4. Design Debt Score

| Category | Weight | Scoring |
|----------|--------|---------|
| Undocumented tokens | High | Count × 2 |
| Missing component states | Medium | Count × 1 |
| Hardcoded values | High | Count × 3 |
| Duplicate patterns | Medium | Count × 2 |
| Outdated docs | Low | Count × 1 |

## Comparison: Implementation vs Design Specs

```bash
# Compare Figma export with implementation
gemini -p "Compare this design spec with the implemented component: Spec: $(cat spec.png) Code: $(cat component.tsx)"
```

Check:
- [ ] Colors match tokens
- [ ] Spacing matches grid
- [ ] Typography matches scale
- [ ] Components match variants
- [ ] States match specifications

## Output Template

```markdown
## Design System Audit Report

### Summary
- Total components: [N]
- Documented: [N] ([%])
- Design debt score: [N]

### Token Gaps
| Token | Used | Documented | Action |
|-------|------|------------|--------|
| --color-primary | Yes | No | Document |

### Component Issues
| Component | Issue | Priority | Fix |
|-----------|-------|----------|-----|
| Button | Missing disabled state | High | Add state |

### Design Debt Items
1. [Item] - [Location] - [Recommended fix]
```

## Checklist

- [ ] All tokens inventoried
- [ ] Token documentation gaps identified
- [ ] Components catalogued with states
- [ ] Hardcoded values flagged
- [ ] Duplicate patterns found
- [ ] Design debt scored
- [ ] Report saved to `.opencode/memory/reviews/`

## Red Flags

- Tokens defined but never used
- Components without documentation
- Multiple implementations of same pattern
- Hardcoded values overriding tokens
- Outdated documentation
- Missing accessibility documentation
- No contribution guidelines
