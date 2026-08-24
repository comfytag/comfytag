---
name: ComfyTag Partner Dashboard
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
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#005b3d'
  on-tertiary: '#ffffff'
  tertiary-container: '#007650'
  on-tertiary-container: '#76ffc2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#fff8f5'
  on-background: '#1e1b19'
  surface-variant: '#e9e1dd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
  financial-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
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
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system focuses on operational excellence and financial clarity for the ComfyTag partner ecosystem. The visual language is **Corporate / Modern** with a lean towards high-utility minimalism. It aims to evoke feelings of reliability, precision, and ease of use. 

The aesthetic is defined by a "Premium Clean" approach: high-contrast typography for immediate readability, ample white space to reduce cognitive load during data-heavy tasks, and a sophisticated color palette that distinguishes between navigational, informational, and financial data points. The interface utilizes a structured grid to maintain a professional, institutional feel suitable for high-stakes business management.

## Colors
The palette is engineered for high-functioning dashboards. 
- **Primary Action (Violet):** Reserved for core interactions, calls to action, and navigation states.
- **Financial Gold:** Strategically applied only to revenue, payouts, and critical financial growth metrics to ensure they stand out from operational data.
- **Success Green:** Used for "Live" statuses and positive growth indicators.
- **Neutral Stack:** A warm-leaning neutral scale (#FAFAF9 background to #1C1917 text) ensures the UI feels premium and approachable rather than cold and clinical.

## Typography
This design system utilizes **Inter** exclusively to leverage its exceptional legibility and systematic weight distribution. 
- **Financial Figures:** Use `financial-xl` for top-level revenue metrics, utilizing a heavier weight to emphasize the Gold accent.
- **Secondary Content:** Use `body-md` in `#78716C` for table headers, helper text, and inactive states.
- **Hierarchy:** Maintain clear distinction by using Semi-bold (600) for interactive labels and Bold (700) for data summaries.

## Layout & Spacing
The design system employs a **Fixed Grid** model for the main content area (max-width: 1440px) to ensure consistency in data visualization. 
- **Sidebar:** A fixed 280px navigation rail on the left.
- **Grid:** 12-column layout with 24px gutters.
- **Rhythm:** An 8px base unit drives all padding and margin decisions. 
- **Adaptation:** On tablet, the sidebar collapses into a 64px icon rail. On mobile, the grid shifts to a single column with 16px margins, and all large metrics scale down to `headline-md` equivalent sizes.

## Elevation & Depth
Depth is achieved through **Tonal Layers** supplemented by subtle ambient shadows. 
- **Surface Level 0:** Background (#FAFAF9) - completely flat.
- **Surface Level 1:** Cards and Containers (#FFFFFF) - utilize a 1px border (#E7E5E4) and a very soft, diffused shadow (Y: 2px, Blur: 4px, 4% opacity black).
- **Surface Level 2:** Modals and Popovers - higher elevation (Y: 10px, Blur: 20px, 8% opacity black) to signify critical interaction.
Avoid heavy drop shadows; the goal is to define boundaries through subtle contrast rather than physical projection.

## Shapes
The shape language is **Soft** and professional. 
- **Cards & Inputs:** 0.25rem (4px) or 0.5rem (8px) corner radius to maintain a structured, tidy appearance.
- **Action Buttons:** Use 0.5rem (8px) for a modern feel.
- **Badges/Pills:** Use `rounded-xl` (12px) or full pill (999px) for status indicators like "Live" or "Pending" to clearly differentiate them from interactive buttons.

## Components
- **Buttons:** Primary buttons use `#7C3AED` with white text. Ghost buttons use a 1px border of `#E7E5E4` and `#1C1917` text.
- **Data Tables:** Headers use `label-sm` in `#78716C`. Rows feature 1px bottom borders in `#E7E5E4`. Hover states on rows use `#FAFAF9`.
- **Status Badges:** "Live" badges use a light green background (10% opacity of `#10B981`) with solid green text.
- **Financial Cards:** Feature a top-accent border (2px) in Gold (#D97706) to highlight their importance.
- **Sidebar Nav:** Active items use `#EDE9FE` background and `#7C3AED` for the icon and text to create a clear "active" state.
- **Input Fields:** 1px `#E7E5E4` border. On focus, the border transitions to `#7C3AED` with a 2px outer glow of `#EDE9FE`.