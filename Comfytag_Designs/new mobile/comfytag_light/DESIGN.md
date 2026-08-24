---
name: ComfyTag Light
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
  secondary: '#625d5b'
  on-secondary: '#ffffff'
  secondary-container: '#e9e1dd'
  on-secondary-container: '#686361'
  tertiary: '#4d4f4e'
  on-tertiary: '#ffffff'
  tertiary-container: '#656766'
  on-tertiary-container: '#e6e6e5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#e9e1dd'
  secondary-fixed-dim: '#ccc5c2'
  on-secondary-fixed: '#1e1b19'
  on-secondary-fixed-variant: '#4a4643'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c7c6'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#f9f9f8'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-rg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  stack-gap: 16px
  section-gap: 32px
  gutter: 16px
---

## Brand & Style

This design system is built for a premium, biometric-first financial and identification platform. The aesthetic is rooted in **Modern Minimalism** with a focus on high-end utility. It prioritizes clarity, speed of recognition, and a sense of "digital comfort."

The interface should feel airy and expansive, utilizing generous whitespace to reduce cognitive load during secure transactions. The emotional response is one of safety, efficiency, and sophistication. By pairing a neutral, stone-based foundation with a vibrant violet accent, the UI balances institutional trust with modern tech agility.

## Colors

The palette is anchored by a warm-neutral background to reduce eye strain compared to pure white. 

- **Primary (#7C3AED):** Reserved for high-intent actions, primary buttons, and brand-critical identifiers (e.g., biometric scan status).
- **Surface (#FFFFFF):** Used for cards and elevated containers to create a distinct layer against the background.
- **Text Primary (#1C1917):** High-contrast deep stone for maximum legibility in financial data.
- **Feedback:** Success and Error states use high-chroma variants to ensure immediate user awareness during critical flow interruptions.

## Typography

This design system utilizes **Inter** exclusively to maintain a systematic, utilitarian aesthetic that excels in data-heavy environments like payout screens and history logs.

- **Headlines:** Use tight letter spacing and bold weights to establish a strong structural anchor for each screen.
- **Body Text:** Standardized on a 16px base for accessibility.
- **Labels:** Used for metadata, table headers, and secondary descriptors. 
- **Numerical Data:** When displaying currency or IDs, ensure tabular lining is used (if available) to keep columns aligned in lists.

## Layout & Spacing

The layout follows a **Fixed Grid** approach for desktop (max-width: 1200px) and a **Fluid 4-column Grid** for mobile devices.

- **Margins:** Standard 24px side margins for mobile to maintain a "premium" spacious feel.
- **Vertical Rhythm:** Elements are spaced in multiples of 4px. Use 16px (stack-gap) for related items within a card and 32px (section-gap) to separate distinct functional blocks.
- **Dividers:** Use 1px borders (#E7E5E4) instead of heavy lines. Dividers should be inset by the container padding to maintain edge alignment.

## Elevation & Depth

The design system uses **Tonal Layering** combined with **Low-Contrast Outlines**.

- **Level 0 (Background):** #FAFAF9.
- **Level 1 (Cards):** #FFFFFF with a 1px solid border (#E7E5E4). No shadow is used for standard cards to maintain a flat, modern look.
- **Level 2 (Modals/Overlays):** #FFFFFF with a soft, diffused shadow (0px 10px 15px -3px rgba(0, 0, 0, 0.05)) to indicate temporary interaction.
- **Biometric Feedback:** Use a subtle backdrop blur (12px) behind biometric prompts to focus the user on the sensor interaction.

## Shapes

The shape language is defined by **ROUND_EIGHT (0.5rem)** logic.

- **Buttons & Inputs:** Use the base 8px (0.5rem) radius.
- **Cards:** Use 12px (0.75rem) to create a clear "container" feel that is softer than the interactive elements within it.
- **Avatars/Biometric Rings:** These are exceptions and should remain strictly circular (100% border-radius).

## Components

### Buttons
- **Primary:** Background #7C3AED, Text #FFFFFF. 8px radius.
- **Secondary:** Background #F5F5F4, Text #1C1917. 
- **Ghost:** No background, Text #7C3AED, used for less frequent actions like "Forgot Password."

### Input Fields
- **Default:** White background, 1px #E7E5E4 border, 8px radius. 
- **Active/Focus:** Border changes to #7C3AED with a 2px outer ring (soft violet glow).
- **Error:** Border changes to #EF4444.

### Cards & Lists
- **Cards:** White surface, 1px border. Internal padding of 16px or 20px.
- **List Items:** Separated by 1px light stone dividers. Include a chevron-right icon for navigable items.

### Feedback & States
- **Success:** Use a filled #10B981 circle icon with a white checkmark.
- **Loading:** Use Skeleton pulses (#F5F5F4 to #E7E5E4) for all data-heavy views (Payouts, Explore list).
- **Empty States:** Centered illustration in neutral stone tones with a clear "Primary" call to action.

### Biometric Prompt
- A dedicated bottom sheet or centered modal. Features a high-contrast fingerprint or face-ID icon in #7C3AED. Pulse animation should be used during the active "scanning" state.