---
name: frontend-aesthetics
description: Use when building UI components or pages. Prevents AI slop aesthetic with distinctive design direction.
---

# Frontend Aesthetics Skill

You are running the **frontend-aesthetics** skill. No generic AI designs. No purple gradients.

## Core Principle

Pick ONE aesthetic direction. Commit fully. No hybrid compromises.

## Aesthetic Directions

| Direction | Typography | Colors | Motion |
|-----------|------------|--------|--------|
| Neo-Brutalist | Bold sans-serif, high contrast | Black/white + 1 accent | Sharp, instant |
| Glass Morphism | Light, geometric | Translucent overlays | Smooth blur transitions |
| Swiss Design | Grid-aligned, minimal | Primary + neutrals | Subtle, functional |
| Retro-Future | Geometric, display | Warm gradients | Smooth, nostalgic |
| Dark Industrial | Monospace, condensed | Dark + neon accent | Glitch, scan effects |
| Organic Minimal | Rounded, friendly | Earth tones | Gentle, springy |

## Typography Rules

- NEVER: Inter, Roboto, Arial, Helvetica, system-ui
- PICK: Space Grotesk, JetBrains Mono, Instrument Sans, Clash Display, Satoshi, DM Sans, Outfit, Plus Jakarta Sans
- Pair: 1 display font (headlines) + 1 UI font (body)
- Scale: Use typographic scale (1.25 or 1.333 ratio), not arbitrary sizes

## Color Rules

- Maximum 3 colors: Primary, Secondary, Accent
- No purple gradients (the hallmark of AI-generated design)
- Define semantic colors: success, warning, error, info
- Use CSS variables - no hardcoded hex values in components

## Motion Rules

- Motion must be meaningful: state change, attention, feedback
- Duration: 150-300ms for micro, 300-500ms for transitions
- Easing: Use custom easings, not just ease-in-out
- Reduce motion: Respect prefers-reduced-motion

## Checklist

- [ ] One aesthetic direction chosen and documented
- [ ] Typography: Display + UI font selected (not Inter/Roboto)
- [ ] Color palette: Max 3 colors + semantics defined
- [ ] Motion tokens: Duration, easing, reduction defined
- [ ] No purple gradients anywhere
- [ ] No centered hero with 3-column cards layout

## Red Flags

- Make it look modern without direction
- Inter or Roboto in font stack
- Purple-to-pink gradients
- Centered hero + 3-column feature cards
- Generic placeholder images (stock photos)
- Inconsistent spacing (use 4px or 8px grid)
- Multiple competing aesthetic styles
