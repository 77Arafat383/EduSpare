---
name: Proton Syntax
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434656'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ced'
  primary: '#003ec7'
  on-primary: '#ffffff'
  primary-container: '#0052ff'
  on-primary-container: '#dfe3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#952200'
  on-tertiary: '#ffffff'
  tertiary-container: '#bf3003'
  on-tertiary-container: '#ffddd5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbd2'
  tertiary-fixed-dim: '#ffb4a1'
  on-tertiary-fixed: '#3c0800'
  on-tertiary-fixed-variant: '#891e00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

This design system is built for high-velocity productivity and seamless collaboration. It balances the utilitarian precision of developer tools with the approachability of a modern social workspace. The aesthetic is rooted in **Minimalism** and **Modern Corporate** sensibilities, prioritizing clarity, information density, and user focus.

The emotional response should be one of "calm control." By utilizing significant whitespace, a disciplined color palette, and high-quality typography, the UI recedes to let the user's content and tasks take center stage. Interaction patterns are snappy and predictable, fostering a sense of reliability and professional rigor.

## Colors

The palette is anchored by a vibrant "Brand Blue" to establish trust and signal primary actions. This is supported by a sophisticated slate-based grayscale that provides depth without introducing visual noise.

- **Primary:** Used for main action buttons, active states, and progress indicators.
- **Neutral:** A range of slate grays (from #0F172A for text to #F8FAFC for backgrounds) ensures high legibility and soft transitions between UI regions.
- **Semantic:** Success, Warning, and Error colors are used sparingly for task priorities, status badges, and critical feedback.

Use subtle tinting for backgrounds (e.g., a 5% opacity primary blue for hover states on ghost buttons) to maintain a cohesive professional feel.

## Typography

This design system exclusively utilizes **Inter** to leverage its exceptional legibility and systematic feel. The type hierarchy is designed for information-dense environments.

- **Headlines:** Use tighter letter spacing and heavier weights to create a strong visual anchor.
- **Body:** Set with generous line heights to facilitate long-form reading and task management.
- **Labels:** Used for metadata, button text, and micro-copy. `label-sm` utilizes an uppercase transformation for UI elements like category headers to differentiate from body text.

## Layout & Spacing

The layout is governed by a **12-column fluid grid** for desktop and a **4-column grid** for mobile. We utilize an 8pt spatial system (with 4px increments for micro-adjustments) to ensure consistent rhythm.

- **Desktop:** 12 columns, 24px gutters, 40px side margins. Max-width of 1440px for content containers to maintain readability.
- **Tablet:** 8 columns, 16px gutters, 24px side margins.
- **Mobile:** 4 columns, 16px gutters, 16px side margins.

Content should be grouped into logical modules using the spacing scale. Use `lg` (24px) for padding within cards and `2xl` (48px) to separate major page sections.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Ambient Shadows**. Surfaces are tiered to indicate functional depth:

1.  **Level 0 (Background):** #F8FAFC. The lowest layer.
2.  **Level 1 (Cards/Sidebar):** #FFFFFF. White surfaces with a 1px border (#E2E8F0) and a very soft, diffused shadow (0px 1px 3px rgba(0,0,0,0.05)).
3.  **Level 2 (Modals/Popovers):** #FFFFFF. These use a more pronounced shadow (0px 10px 25px rgba(0,0,0,0.1)) to indicate they sit high above the workspace.

Avoid heavy drop shadows. Rely primarily on subtle borders and slight value shifts in background color to separate functional areas.

## Shapes

The shape language is **Soft** and professional. This prevents the UI from feeling too rigid or aggressive while maintaining a clean, structured appearance.

- **Standard Elements:** Buttons, inputs, and small chips use `rounded` (0.25rem / 4px).
- **Containers:** Cards and larger modules use `rounded-lg` (0.5rem / 8px).
- **Special Elements:** Avatars and certain status indicators may use a full circle/pill shape for instant recognition.

## Components

### Buttons
- **Primary:** Solid Brand Blue with white text. High contrast.
- **Secondary:** White background with a slate border (#CBD5E1).
- **Ghost:** No background or border. Primary color text. Used for secondary actions in dense lists.

### Input Fields
- Use a 1px border (#E2E8F0) and `body-sm` text.
- Focused state: 1px Brand Blue border with a 3px soft blue outer glow (20% opacity).

### Cards
- Minimalist white backgrounds.
- Subtle 1px borders are preferred over shadows for internal grid layouts.
- Header sections within cards should be separated by a light horizontal rule.

### Chips & Badges
- Used for task status (e.g., "In Progress", "Priority High").
- Low-saturation backgrounds with high-saturation text for readability (e.g., light green background with dark green text for "Success").

### Lists
- Use "Ghost" rows that highlight with a #F1F5F9 background on hover.
- 16px horizontal padding to align with the grid.

### Icons
- 24px bounding box.
- 1.5px or 2px stroke weight.
- Monochrome (Slate-500) by default, changing to Primary Blue on active/hover states.