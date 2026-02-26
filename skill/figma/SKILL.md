---
name: figma
description: Use when you need to access Figma design data, layouts, or assets for implementation.
---

# Figma Skill

You are running the **figma** skill. Access Figma design data via Framelink MCP.

## Capabilities

| Action | Description |
|--------|-------------|
| Fetch layout | Get component hierarchy, spacing, dimensions |
| Get styles | Colors, typography, shadows, borders |
| Get components | Extract reusable component definitions |
| Download assets | SVG/PNG export for icons, images |

## Usage

1. Provide Figma file URL or frame ID
2. Specify what you need (layout, styles, assets)
3. Skill fetches via Framelink MCP (on-demand)
4. Convert to code matching your tech stack

## MCP Loading

This skill loads the Framelink MCP server **only when used**. No persistent connection overhead.

## Best Practices

- Request specific frames, not entire files
- Export assets at appropriate resolutions
- Match design tokens to your CSS variables
