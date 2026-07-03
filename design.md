---
name: Release Desk
colors:
  surface: '#f6f9ff'
  surface-dim: '#d4dbe3'
  surface-bright: '#f6f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4fd'
  surface-container: '#e8eef7'
  surface-container-high: '#e2e9f1'
  surface-container-highest: '#dce3ec'
  on-surface: '#151c22'
  on-surface-variant: '#444654'
  inverse-surface: '#2a3138'
  inverse-on-surface: '#ebf1fa'
  outline: '#747686'
  outline-variant: '#c4c5d6'
  surface-tint: '#3052d2'
  primary: '#1a40c2'
  on-primary: '#ffffff'
  primary-container: '#3b5bdb'
  on-primary-container: '#e2e5ff'
  inverse-primary: '#b8c3ff'
  secondary: '#3956bf'
  on-secondary: '#ffffff'
  secondary-container: '#7792ff'
  on-secondary-container: '#002584'
  tertiary: '#863700'
  on-tertiary: '#ffffff'
  tertiary-container: '#ac4900'
  on-tertiary-container: '#ffe0d2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c3ff'
  on-primary-fixed: '#001355'
  on-primary-fixed-variant: '#0736ba'
  secondary-fixed: '#dde1ff'
  secondary-fixed-dim: '#b7c4ff'
  on-secondary-fixed: '#001453'
  on-secondary-fixed-variant: '#1b3ca7'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb691'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#793100'
  background: '#f6f9ff'
  on-background: '#151c22'
  surface-variant: '#dce3ec'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is engineered for high-velocity software delivery environments where clarity and information density are paramount. The brand personality is **technical, authoritative, and precise**, evoking a sense of calm control over complex release cycles.

The visual style follows a **Modern Corporate** aesthetic with a lean toward **Minimalism**. It prioritizes data legibility and functional hierarchy over decorative elements. By utilizing high-contrast typography and a structured grid, the interface remains scannable even when displaying dense technical logs or multi-lane release calendars. The emotional response should be one of "operational confidence"—the user feels they have a bird's-eye view of every moving part without being overwhelmed by visual noise.

## Colors

The palette is anchored by **Deep Indigo** as the primary brand driver, symbolizing stability and intelligence. The neutral scale relies on **Slate Grays** to define structure without adding chromatic fatigue. 

Functional status colors are strictly reserved for operational health indicators:
- **Green (Success):** Shipped, Healthy, Ready.
- **Amber (Warning):** At Risk, Delayed.
- **Red (Danger):** Blocked, Failed, Overdue.
- **Blue (Info):** Scheduled, In Progress, Syncing.
- **Gray (Neutral):** Not Started, Archived, Draft.

For the light theme, use subtle off-white backgrounds (`#F8F9FA`) to differentiate the application canvas from white surface cards. Borders should remain low-contrast (`#DEE2E6`) to maintain a clean appearance.

## Typography

This design system utilizes **Inter** as its workhorse typeface for its exceptional legibility and neutral, systematic character. To accommodate data density, line heights are kept tight but functional, and letter spacing is slightly tracked in for larger headings to maintain a modern, "compacted" feel.

A secondary typeface, **JetBrains Mono**, is introduced specifically for technical identifiers, commit hashes, and version numbers to provide a clear visual distinction between UI labels and technical metadata.

**Mobile Scaling:**
For screens smaller than 768px, `display-lg` should scale down to 28px and `headline-md` to 20px. Body text sizes remain consistent to ensure readability.

## Layout & Spacing

The design system employs a **Fluid Grid** with fixed-width constraints for dashboard widgets. The layout is built on a 4px baseline shift, ensuring all elements align to a predictable rhythmic scale.

- **Desktop (1280px+):** 12-column grid, 32px side margins, 20px gutters. Navigation is typically a condensed side-rail (64px collapsed, 240px expanded).
- **Tablet (768px - 1279px):** 8-column grid, 24px side margins.
- **Mobile (Below 768px):** 4-column grid, 16px side margins. Cards stack vertically.

Use "Generous Whitespace" around logical groupings (e.g., 32px between sections) while maintaining high density within the data tables themselves (e.g., 8px vertical padding in rows).

## Elevation & Depth

Visual hierarchy is managed through **Tonal Layers** supplemented by **Soft Ambient Shadows**. 

1. **Level 0 (Background):** The application canvas (`#F8F9FA`). No shadow.
2. **Level 1 (Surface):** Default card state. White background with a 1px border (`#DEE2E6`) and a very soft, diffused shadow (`0 2px 4px rgba(0,0,0,0.05)`).
3. **Level 2 (Floating):** Modals, dropdowns, and active popovers. White background with a more pronounced shadow (`0 10px 15px -3px rgba(0,0,0,0.1)`) to indicate proximity to the user.

Avoid heavy black shadows; instead, use slightly tinted indigo shadows (`rgba(59, 91, 219, 0.08)`) for active or focused elements to maintain brand cohesion.

## Shapes

The design system adopts a **Rounded** shape language with an 8px (0.5rem) corner radius as the standard for all primary containers, buttons, and input fields. This softens the professional "enterprise" feel, making the interface feel modern and approachable without losing its structured integrity.

- **Small Components (Chips/Badges):** Use 4px or fully pill-shaped.
- **Large Components (Cards/Modals):** Use 8px (`rounded-lg` 16px for featured dashboards).
- **Data Tables:** Maintain sharp interior corners for cells, but wrap the table container in an 8px rounded border.

## Components

**Buttons:**
- **Primary:** Solid Indigo (`#3B5BDB`) with white text. 8px corners.
- **Secondary:** White background, Indigo border and text. 
- **Ghost:** No background/border in idle state; Light Slate background on hover.

**Input Fields:**
- 1px Slate border (`#DEE2E6`). 
- Focus state: 1px Indigo border with a 3px Indigo "halo" (low-opacity glow).
- Labels are positioned above the field in `label-md` style.

**Chips/Status Badges:**
- Low-saturation background tints (e.g., Light Green background with Dark Green text) to ensure they don't distract from the primary content.

**Cards:**
- White background, 8px rounded corners, 1px border, and a soft shadow. 
- Section headers within cards should use `headline-sm` with a bottom divider.

**Data Tables:**
- Zebra striping is discouraged; use subtle hover states on rows instead.
- Column headers use `label-md` for maximum clarity and alignment.
- Use horizontal dividers only to maximize vertical space for data.