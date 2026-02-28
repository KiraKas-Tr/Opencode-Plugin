---
name: accessibility-audit
description: Use when verifying WCAG compliance, checking keyboard navigation, color contrast, or screen reader compatibility.
---

# Accessibility Audit Skill

You are running the **accessibility-audit** skill. No barriers. Full access.

## WCAG Levels

| Level | Coverage | Use Case |
|-------|----------|----------|
| A | Minimum | Legal baseline |
| AA | Standard | Most regulations |
| AAA | Enhanced | Maximum accessibility |

## Audit Categories

### 1. Color Contrast

```bash
# Check contrast ratios
gemini -p "Analyze color contrast in this UI for WCAG AA compliance: $(cat ui.png)"
```

Requirements:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

### 2. Keyboard Navigation

Test checklist:
- [ ] All interactive elements focusable
- [ ] Focus order matches visual order
- [ ] Focus visible indicator present
- [ ] No keyboard traps
- [ ] Skip links provided
- [ ] Modal focus management

### 3. Screen Reader Compatibility

Test with:
- VoiceOver (Mac/iOS)
- NVDA (Windows)
- TalkBack (Android)

Check:
- [ ] All images have alt text
- [ ] Headings hierarchy correct (h1→h2→h3)
- [ ] Landmarks properly labeled
- [ ] Form labels associated
- [ ] ARIA attributes correct
- [ ] Dynamic content announced

### 4. Semantic Structure

```html
<!-- Good -->
<nav aria-label="Main navigation">...</nav>
<main>...</main>
<article>...</article>
<aside aria-label="Related content">...</aside>

<!-- Bad -->
<div class="nav">...</div>
<div class="main">...</div>
```

### 5. Forms

- [ ] All inputs have associated labels
- [ ] Error messages linked to inputs
- [ ] Required fields indicated
- [ ] Validation errors announced
- [ ] Instructions provided before inputs

## Pre-Launch Verification

### Automated Testing
```bash
# Lighthouse
npx lighthouse URL --only-categories=accessibility

# axe-core
npx axe URL
```

### Manual Testing
- [ ] Keyboard-only navigation complete
- [ ] Screen reader test (2+ browsers)
- [ ] Zoom to 200% without horizontal scroll
- [ ] High contrast mode usable
- [ ] Reduced motion preference respected

## Checklist

- [ ] Color contrast: All text meets AA
- [ ] Keyboard: Full navigation possible
- [ ] Screen reader: All content accessible
- [ ] Semantic: Proper HTML structure
- [ ] Forms: Labels and errors accessible
- [ ] Motion: Reduced motion supported
- [ ] Zoom: 200% without horizontal scroll

## Red Flags

- Color-only information conveyance
- Missing alt text on meaningful images
- Empty or generic link text ("click here")
- Keyboard traps in modals/menus
- Auto-playing media
- Flashing content >3 times/second
- Timeouts without warning/extension
