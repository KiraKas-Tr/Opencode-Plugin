---
name: visual-analysis
description: Use when analyzing images, screenshots, or UI mockups to extract colors, typography, layout, and design patterns.
---

# Visual Analysis Skill

You are running the **visual-analysis** skill. See everything. Extract what matters.

## Analysis Types

| Type | Purpose | Output |
|------|---------|--------|
| Color Extraction | Get palette from design | Hex codes with roles |
| Typography Audit | Font identification | Font stack suggestions |
| Layout Analysis | Grid and spacing | Spacing system |
| Component Mapping | UI inventory | Component list |
| Design Comparison | Compare multiple designs | Diff report |

## Process

### 1. Color Extraction

```bash
gemini -p "Extract all colors from this design with their approximate usage percentage: $(cat design.png)"
```

Output format:
```
Primary: #2563EB (45%)
Secondary: #1E40AF (20%)
Accent: #F59E0B (10%)
Background: #FFFFFF (15%)
Text: #1F2937 (10%)
```

### 2. Typography Analysis

```bash
gemini -p "Identify fonts and type scale in this design: $(cat design.png)"
```

Extract:
- Font family (heading, body, mono)
- Size scale (heading levels, body sizes)
- Weight variations
- Line height patterns

### 3. Layout Analysis

```bash
gemini -p "Analyze the grid system and spacing in this layout: $(cat layout.png)"
```

Identify:
- Column count
- Gutter width
- Margin/padding patterns
- Component spacing rhythm

### 4. Design Comparison

```bash
gemini -p "Compare these two designs and list all differences: $(cat design1.png design2.png)"
```

Report:
- Structural differences
- Color differences
- Typography differences
- Spacing differences
- Missing/added elements

## Checklist

- [ ] Image quality verified
- [ ] All colors extracted with context
- [ ] Typography identified or approximated
- [ ] Spacing system documented
- [ ] Components inventoried
- [ ] Analysis saved to `.opencode/memory/research/`

## Output Template

```markdown
## Visual Analysis: [Design Name]

### Colors
| Role | Hex | Usage |
|------|-----|-------|
| Primary | #... | buttons, links |

### Typography
| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | [font] | [size] | [weight] |

### Layout
- Columns: [N]
- Gutter: [X]px
- Base spacing: [X]px

### Components
- [Component list]
```

## Red Flags

- Low resolution images (can't extract details)
- Missing color context (what's primary vs accent)
- Ignoring accessibility (contrast ratios)
- Not saving analysis for future reference
- Assuming fonts without verification
