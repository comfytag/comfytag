---
name: ComfyTag Unified
colors:
  surface: '#fff8f5'
  surface-dim: '#e0d8d5'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf2ee'
  surface-container: '#f4ece8'
  surface-container-high: '#eee7e3'
  surface-container-highest: '#e9e1dd'
  on-surface: '#1e1b19'
  on-surface-variant: '#4a4455'
  inverse-surface: '#33302d'
  inverse-on-surface: '#f7efeb'
  outline: '#7b7487'
  outline-variant: '#ccc3d8'
  surface-tint: '#732ee4'
  primary: '#630ed4'
  on-primary: '#ffffff'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#d2bbff'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#7a4000'
  on-tertiary: '#ffffff'
  tertiary-container: '#9d5400'
  on-tertiary-container: '#ffe1cb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#fff8f5'
  on-background: '#1e1b19'
  surface-variant: '#e9e1dd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
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
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 40px
  margin-tablet: 24px
  margin-mobile: 16px
  sidebar-width-expanded: 240px
  sidebar-width-collapsed: 72px
---

## Brand & Style
The design system establishes a high-performance, premium environment for event management and attendance. It bridges two distinct user mindsets: the **Attendee**, who seeks an inviting, effortless experience, and the **Partner**, who requires a focused, data-driven dashboard.

The style is **Modern Corporate** with **Glassmorphic** accents. It utilizes high-quality whitespace and subtle tonal shifts to organize complex event data. The interface should feel authoritative yet fluid, moving between light and dark modes to define the user's current context (Engagement vs. Management).

## Colors
The palette is divided into two distinct functional themes. 

- **Primary Violet (#7C3AED)** acts as the connective tissue across both themes, used for primary actions and brand identifiers.
- **Attendee Theme (Light):** Focuses on warmth and legibility. Use the Energy Accent for notifications, active status, and "save" actions to maintain high engagement.
- **Partner Theme (Dark):** Focuses on precision. Use Financial Gold for revenue-related data, premium features, and key performance indicators.

Maintain a 4.5:1 contrast ratio for all functional text against surface backgrounds.

## Typography
The system relies exclusively on **Inter** to maintain a systematic, utilitarian aesthetic that scales from marketing displays to dense data tables.

- **Headlines:** Use tighter letter spacing for large displays to create a premium, "locked-in" feel.
- **Body:** Standardize on `body-md` for general content. Use `body-lg` specifically for introductory text in attendee-facing event descriptions.
- **Labels:** Use `label-sm` with uppercase styling for table headers and section overviews in the Partner dashboard to maximize vertical space.

## Layout & Spacing
This design system utilizes a **12-column fluid grid** for content areas, with fixed margins that scale based on breakpoints.

- **Desktop (1440px+):** 12 columns, 24px gutters, 40px outer margins.
- **Tablet (768px - 1439px):** 8 columns, 20px gutters, 24px outer margins.
- **Mobile (Up to 767px):** 4 columns, 16px gutters, 16px outer margins.

**Partner Sidebar:** On desktop, the sidebar is fixed to the left. When collapsed, the main content area expands fluidly. On mobile, the sidebar transitions to a bottom navigation bar or a hidden drawer.
**Attendee Nav:** Always top-aligned. On mobile, links collapse into a hamburger menu while the primary "Ticket" action remains visible as a floating action button or pinned header icon.

## Elevation & Depth
Depth is created through **Tonal Layering** supplemented by **Ambient Shadows**.

- **Level 0 (Background):** `#FAFAF9` (Light) or `#0F0F0F` (Dark). Used for the base canvas.
- **Level 1 (Surface/Cards):** White or `#1A1A1A`. These elements use a 1px subtle border (`opacity: 0.1`) and a soft, diffused shadow (Y: 4, Blur: 12, Color: Black @ 5%) to appear slightly lifted.
- **Level 2 (Modals/Popovers):** These use a 15% backdrop blur (Glassmorphism) when overlaying content to maintain context while focusing user attention.
- **Interactive States:** On hover, cards should lift slightly (Y: 8, Blur: 16) and borders should transition to the Primary Violet color at 30% opacity.

## Shapes
The design system uses a **Rounded (0.5rem)** corner radius for standard UI components.

- **Cards & Inputs:** 0.5rem (8px) for a modern, approachable feel.
- **Buttons:** Use `rounded-lg` (1rem / 16px) to distinguish interactive triggers from static layout containers.
- **Chips/Badges:** Use `rounded-full` (pill-shaped) to represent status, categories, or tags.
- **Search Bars:** Always pill-shaped to provide a distinct visual "entry point" for the user.

## Components

### Navigation
- **Attendee Top Nav:** 72px height, fixed to top. Contains brand logo, search bar (pill-shaped), and user profile. Use a subtle bottom border for separation.
- **Partner Sidebar:** Collapsible. Icons should be centered when collapsed. Active states use a Violet vertical bar on the left edge and a subtle background tint.

### Buttons
- **Primary:** Solid Violet with white text. 1rem roundedness.
- **Secondary:** Transparent with 1.5px Violet border or Energy/Gold accent border depending on theme.
- **Ghost:** No background or border, Violet text. Used for "Cancel" or low-priority actions.

### Cards
- **Premium Event Card:** Image top, 16px padding for content below. Use a subtle inner glow on hover.
- **Partner Stat Card:** Heavy focus on `headline-lg` for metrics. Utilize "Financial Gold" for trend indicators (e.g., +12% revenue).

### Inputs & Forms
- **Text Fields:** 48px height, 8px roundedness. Background should be slightly darker than the surface color in Light mode, or slightly lighter in Dark mode to create depth.
- **Checkboxes/Radios:** Use 4px roundedness for checkboxes and full circles for radios. Active state is always Primary Violet.

### Additional Components
- **Empty States:** Use center-aligned typography with a low-opacity illustration and a single Primary Action button.
- **Status Badges:** Small, pill-shaped markers for "Live," "Ended," or "Draft." Use semantic colors (Green, Red, Gray) with 10% background opacity.