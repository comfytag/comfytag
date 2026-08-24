---
name: ComfyTag
colors:
  surface: '#f9f9f8'
  surface-dim: '#dadad9'
  surface-bright: '#f9f9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f3'
  surface-container: '#eeeeed'
  surface-container-high: '#e8e8e7'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4a4455'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1f0'
  outline: '#7b7487'
  outline-variant: '#ccc3d8'
  surface-tint: '#732ee4'
  primary: '#630ed4'
  on-primary: '#ffffff'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#d2bbff'
  secondary: '#6e3aca'
  on-secondary: '#ffffff'
  secondary-container: '#8856e5'
  on-secondary-container: '#fffbff'
  tertiary: '#704500'
  on-tertiary: '#ffffff'
  tertiary-container: '#905b00'
  on-tertiary-container: '#ffe1c0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#ebddff'
  secondary-fixed-dim: '#d3bbff'
  on-secondary-fixed: '#250059'
  on-secondary-fixed-variant: '#581db3'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f9f9f8'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
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
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  margin-mobile: 20px
  margin-tablet: 32px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  section-gap: 40px
---

## Brand & Style
The design system is anchored in a **Premium Modernist** aesthetic, blending high-trust enterprise reliability with a warm, "airy" consumer feel. The personality is calm and effortless, designed to reduce the anxiety of high-stakes event ticketing. 

The visual direction utilizes a "Soft Minimalism" approach: generous whitespace (white-space as a luxury), fluid transitions, and a focus on high-quality typography. While global in its execution, the system maintains a vibrant energy through Amber accents, reflecting the rhythmic excitement of the Nigerian events scene within a sophisticated, structured framework.

## Colors
The palette is built on a foundation of **Warm Off-White (#FAFAF9)** to provide a more premium and "comfy" feel than clinical pure white. 

- **Primary Action:** Violet is the core interactive color, used for high-intent actions.
- **Dark Brand:** Deep Violet is reserved for headers, status bars, or high-contrast surfaces to anchor the UI.
- **Energy Accent:** Amber is used sparingly for "discovery" elements—indicating trending events or special highlights—to inject warmth without appearing as a warning.
- **Surface Tiers:** Use Crisp White for cards to create a subtle lift against the off-white background.

## Typography
The system uses **Inter** for its systematic clarity and neutral tone. To achieve the premium feel, we utilize tighter letter-spacing on display styles and generous line-heights for body text to ensure readability.

- **Hierarchy:** Use `display-lg` exclusively for event titles or hero sections. 
- **Contrast:** Pair `text_primary` for headlines with `text_secondary` for metadata (dates, venues) to create a clear scan-path.
- **Labels:** Use uppercase for `label-md` when used in small metadata chips or section headers to distinguish them from body content.

## Layout & Spacing
This design system utilizes a **Fluid Margin Model**. On mobile devices, a side margin of 20px is maintained to provide breathing room, while internal card padding follows an 8px grid system.

- **Card Layouts:** Use a single-column stack for event listings on mobile to prioritize high-quality imagery.
- **The "Airy" Principle:** Vertical spacing between unrelated sections should be at least 40px (`section-gap`) to maintain the "effortless" brand promise.
- **Horizontal Scrolling:** Use for categories or "Featured" event chips to maximize vertical screen real estate.

## Elevation & Depth
Depth is conveyed through **Tonal Elevation** and soft, diffused shadows. 

- **Level 0 (Background):** Warm Off-White (#FAFAF9).
- **Level 1 (Cards):** Crisp White (#FFFFFF) with a very soft shadow (0px 4px 20px, 4% opacity of Text Primary).
- **Level 2 (Active/Floating):** Use a slightly more pronounced shadow (0px 8px 30px, 8% opacity) for floating action buttons or active ticket previews.
- **Glassmorphism:** Use a light backdrop blur (20px) with 80% opacity Soft Lavender for navigation bars to allow event imagery to subtly bleed through.

## Shapes
The shape language is extremely approachable and friendly, utilizing large corner radii that feel comfortable to the touch (hence the name).

- **Event Cards:** Use a 24px (2xl) radius to frame photography.
- **Buttons:** Use a 16px radius. Avoid pill-shaped buttons for primary CTAs to maintain a "modern-premium" look, but use pill-shapes for small informational tags/chips.
- **Inputs:** Follow the button radius for consistency.

## Components
- **Primary Buttons:** Large (min-height 56px), bold Violet backgrounds with white text. Apply a subtle scale-down transform (0.98) on press for tactile feedback.
- **Event Cards:** Image-centric with a 2:3 or 16:9 aspect ratio. Text info is housed in the bottom white section of the card with the price highlighted in the Energy Accent (Amber).
- **Tickets:** Use a specialized "Clipped" card component with semi-circle notches on the sides to mimic a physical ticket, utilizing the Soft Lavender for the ticket background.
- **Status Chips:** Small, pill-shaped elements using low-opacity versions of Success/Error colors with high-contrast text.
- **Search Bars:** Full-width, Crisp White backgrounds with the 16px radius and a subtle search icon in Muted Stone.