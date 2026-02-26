---
name: mockup-to-code
description: Use when converting UI mockups, screenshots, or Figma/Sketch designs into production-ready code.
---

# Mockup to Code Skill

You are running the **mockup-to-code** skill. Pixels to production.

## Input Types

| Source | Extraction Method |
|--------|-------------------|
| Screenshot | Visual analysis via Gemini |
| Figma export | Design tokens + component mapping |
| Sketch file | Layer structure + styles |
| Design URL | Direct inspection or screenshot |

## Process

### 1. Extract Design Tokens

```bash
gemini -p "Extract design tokens from this mockup as JSON: $(cat mockup.png)"
```

Expected output structure:
```json
{
  "colors": { "primary": "#...", "secondary": "#..." },
  "typography": { "heading": "...", "body": "..." },
  "spacing": { "base": 8, "scale": [8, 16, 24, 32] },
  "shadows": ["0 2px 4px rgba(...)", ...],
  "radii": [4, 8, 16]
}
```

### 2. Identify Components

```
Component: [Name]
- Props: [list]
- Variants: [list]
- States: [default, hover, active, disabled]
- Dependencies: [child components]
```

### 3. Map to Tech Stack

| Design Element | Implementation |
|----------------|----------------|
| Typography | Tailwind classes / CSS variables |
| Colors | CSS custom properties |
| Spacing | Tailwind spacing scale |
| Components | React/Vue/Svelte components |
| Icons | Lucide / Heroicons / custom SVG |

### 4. Build Incrementally

1. Structure: Semantic HTML
2. Layout: Flexbox/Grid
3. Styling: Tokens → classes
4. Interaction: States and events
5. Responsive: Breakpoint adjustments
6. Polish: Animations and details

## Component Library Handling

### Existing Library
- Check for matching components first
- Extend or compose before creating new
- Document any custom overrides

### New Components
- Follow existing patterns
- Use established tokens
- Ensure accessibility built-in

## Checklist

- [ ] Design tokens extracted and defined
- [ ] Components identified and documented
- [ ] Semantic HTML structure
- [ ] Responsive breakpoints handled
- [ ] All interactive states implemented
- [ ] Accessibility attributes added
- [ ] Matches mockup pixel-perfectly
- [ ] Code follows project conventions

## Red Flags

- Skipping semantic HTML for div soup
- Hardcoded values instead of tokens
- Ignoring component library
- Missing interactive states
- No accessibility attributes
- Inline styles over classes
- Breaking responsive behavior
