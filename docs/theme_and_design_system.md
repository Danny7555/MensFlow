# MensFlow Theme, Styling, & Design System Architecture 🎨

[← Back to README](README.md) | [← Back to Project Overview](project_overview.md)

This document outlines the styling methodology, theme synchronization mechanisms, CSS variable design tokens, and animation mechanics that define the MensFlow premium user experience.

---

## 📖 Table of Contents
1. [Styling Technologies & File Structure](#-styling-technologies--file-structure)
2. [Design Tokens & CSS Custom Properties](#-design-tokens--css-custom-properties)
3. [Dynamic Theme Synchronization (`ThemeSync`)](#-dynamic-theme-synchronization-themesync)
4. [iOS-Style Glassmorphism & Cards](#-ios-style-glassmorphism--cards)
5. [Tactile Scales & Micro-Animations](#-tactile-scales--micro-animations)

---

## ⚙️ Styling Technologies & File Structure

MensFlow blends **Tailwind CSS v4** with native **CSS Custom Properties (CSS variables)** to enforce a consistent styling system.

### Style Directories:
1.  **`frontend/src/index.css`** — Tailwind base, CSS tokens, theme configs
2.  **`frontend/src/App.css`** — Layout wrappers (`.app-shell`, `.app-main`, `.app-canvas`), sidebar metrics

---

## 🎨 Design Tokens & CSS Custom Properties

To prevent cold, clinical gray tones, MensFlow defines a warm, organic color palette. Colors adapt to the user's active theme:

```css
/* Light Theme Config */
[data-theme='light'] {
  --mf-main-bg: #fffafc;       /* Soft warm cream background */
  --mf-sidebar-bg: #fff5f8;   /* Light pink-blush sidebar */
  --mf-card: #ffffff;          /* Pure white card backgrounds */
  --mf-border: #f8ecf0;        /* Pastel rose border separator */
  --mf-accent: #ff6b8b;       /* Primary rose highlight */
  --mf-text: #3d3a43;         /* Warm charcoal for soft reading */
  --mf-text-strong: #0c0a10;  /* Deep dark plum for headers */
  --mf-muted: #8c828d;        /* Muted lavender-gray */
}

/* Dark Theme Config */
[data-theme='dark'] {
  --mf-main-bg: #1a1318;       /* Deep warm plum background */
  --mf-sidebar-bg: #1f161d;   /* Slightly deeper plum card container */
  --mf-card: #1f161d;          /* Card overlay bases */
  --mf-border: #2e202b;        /* Deep wine-tone border */
  --mf-accent: #ff8da1;       /* Soft glowing rose/peach highlight */
  --mf-text: #c9c4d1;         /* Warm lavender-gray reading text */
  --mf-text-strong: #f4f2f8;  /* Crisp off-white headers */
  --mf-muted: #807682;        /* Darker muted lavender */
}
```

*   **No Raw Hex Codes:** Developers must avoid hardcoding color codes (like `#FFFFFF` or `#000000`) in React components. Always use the token variables instead.

---

## 🔄 Dynamic Theme Synchronization (`ThemeSync`)

The application supports three theme modes: `light`, `dark`, and `system`. This is synchronized using a renderless component, [`ThemeSync.tsx`](https://github.com/dadaxlabs/mensflow/blob/main/frontend/src/components/ThemeSync.tsx), mounted inside the main root wrapper:

```typescript
export function ThemeSync() {
  const themeMode = useStore((state) => state.settings.themeMode)

  useEffect(() => {
    const apply = () => {
      const resolved = resolveEffectiveTheme(themeMode)
      document.documentElement.dataset.theme = resolved
      document.documentElement.style.colorScheme = resolved
    }

    apply()

    if (themeMode !== 'system') return

    // Setup listener for OS prefers-color-scheme shifts
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [themeMode])

  return null
}
```

*   **Attribute Selector:** Styles select theme parameters via the CSS attribute query `[data-theme='dark']`.
*   **Resolved Utilities:** `resolveEffectiveTheme` queries `window.matchMedia` if `system` is active, matching the browser settings to light or dark.

---

## 💎 iOS-Style Glassmorphism & Cards

To create a premium iOS-feeling layout inside the web canvas, we use heavy backdrop blurs on bottom bars and drawer interfaces.

### 1. Bottom Mobile Navigation (`.flo-bottom-nav`)
Floats fixed above content, blurring whatever scrolls underneath it:
```css
.flo-bottom-nav {
  background: rgba(var(--mf-card-rgb, 255, 255, 255), 0.75);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border-top: 1px solid var(--mf-border);
}
```

### 2. Dashboard Cards (`.flo-card`)
Renders with large borders, soft corner curves (`24px` / `rounded-3xl` equivalent), and subtle drop-shadows:
```css
.flo-card {
  border-radius: 24px;
  background: var(--mf-card);
  border: 1px solid var(--mf-border);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.02);
}
```

---

## ⚡ Tactile Scales & Micro-Animations

The interface uses transitions and spring-physics scales to mimic a physical touch device.

### 1. Tactile Click Haptic (`.active-squish`)
Applied to buttons and lists to scale down slightly when pressed, simulating a tactile button:
```css
.active-squish {
  transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.active-squish:active {
  transform: scale(0.985); /* Slightly squishes down on active press */
}
```

### 2. Staggered Page Slide-ups (`.animate-page-entry`)
Views enter the viewport with a soft fade and a slide-up using custom hardware-accelerated Bezier transitions:
```css
.animate-page-entry {
  animation: in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}
```

### 3. Ambient Background Glows
Renders colored gradients that follow active cycle phases behind cards, using a blur factor of `150px` to create a glowing canvas that transitions smoothly:
```css
.ambient-glow {
  filter: blur(150px);
  opacity: 0.4;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}
```
*   **Menstrual:** Rose glows.
*   **Follicular:** Emerald/Teal glows.
*   **Ovulatory/Fertile:** Sky-blue/Cyan glows.
*   **Luteal:** Amber/Yellow glows.
