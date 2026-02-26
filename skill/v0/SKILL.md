---
name: v0
description: Use when generating UI components, building dashboards, creating design systems, or need AI-assisted design implementation.
---

# V0 Skill

AI-powered UI generation via Vercel's v0 platform MCP. Create React components, generate complete UIs, and get design assistance through natural language prompts.

## Capabilities

- **Component Generation**: Create React components from descriptions
- **Chat Interface**: Interactive design conversations
- **Design System Support**: Generate components matching existing design tokens
- **Dashboard Creation**: Build data visualizations and admin panels
- **Rapid Prototyping**: Quick iteration on UI concepts
- **Code Export**: Production-ready React/Next.js code

## When to Use

- Building new UI components from scratch
- Creating dashboards and admin interfaces
- Exploring design alternatives
- Converting mockups to code
- Generating responsive layouts
- Building form interfaces

## Key Tools

- `create_chat`: Start a new design conversation
- `generate_component`: Create component from description
- `iterate_design`: Refine existing designs
- `export_code`: Get production-ready code

## Example Usage

```
// Start design chat
create_chat({ prompt: "Create a user profile card with avatar, stats, and edit button" })

// Generate component
generate_component({
  description: "Data table with sorting, filtering, and pagination",
  framework: "react",
  styling: "tailwind"
})

// Iterate on design
iterate_design({
  chat_id: "abc123",
  feedback: "Make the header sticky and add a search bar"
})
```

## Output Format

- React components with TypeScript
- Tailwind CSS styling by default
- Accessible by default (WCAG compliant)
- Mobile-responsive designs

## Notes

- Requires v0 API access
- Best for React/Next.js projects
- Integrates with shadcn/ui components
- Supports custom design tokens
