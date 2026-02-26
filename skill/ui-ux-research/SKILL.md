---
name: ui-ux-research
description: Use when analyzing UI mockups, conducting UX audits, or researching design patterns with multimodal analysis.
---

# UI/UX Research Skill

You are running the **ui-ux-research** skill. Multimodal design analysis with Gemini.

## Capabilities

| Analysis Type | Input | Output |
|---------------|-------|--------|
| Mockup Review | Screenshot/Image | Component breakdown, issues |
| Design System Audit | Multiple screenshots | Consistency report |
| Accessibility Check | UI screenshot | WCAG violations |
| Competitive Analysis | Multiple designs | Comparison matrix |
| User Flow Mapping | Screenshots | Flow diagram |

## Process

### 1. Prepare Visual Input

```bash
# Single screenshot
gemini -p "Analyze this UI for usability issues: $(cat screenshot.png)"

# Multiple screens
gemini -p "Review this user flow: $(cat screen1.png screen2.png screen3.png)"

# With context
gemini -p "Audit this dashboard for a financial app: $(cat dashboard.png)"
```

### 2. Analysis Dimensions

**Visual Hierarchy**
- Eye flow direction
- F-pattern or Z-pattern compliance
- Contrast and emphasis
- Whitespace usage

**Interaction Patterns**
- Button placement and affordance
- Form field grouping
- Navigation clarity
- Feedback mechanisms

**Accessibility**
- Color contrast ratios
- Touch target sizes
- Screen reader compatibility
- Keyboard navigation

**Responsive Behavior**
- Breakpoint handling
- Content reflow
- Touch vs mouse patterns
- Portrait/landscape considerations

### 3. Output Structure

```
## Summary
[2-3 sentence overall assessment]

## Strengths
- [What works well]

## Issues
| Priority | Issue | Location | Fix |
|----------|-------|----------|-----|
| High | [issue] | [where] | [how] |

## Recommendations
[Specific, actionable suggestions]
```

## Checklist

- [ ] Image quality is sufficient for analysis
- [ ] Context provided (user type, device, goal)
- [ ] Multiple angles if analyzing flow
- [ ] Accessibility explicitly checked
- [ ] Findings saved to `.opencode/memory/research/`

## Red Flags

- Analyzing without user context
- Ignoring device constraints
- Missing accessibility review
- Not considering edge cases
- Vague recommendations ("improve UX")
