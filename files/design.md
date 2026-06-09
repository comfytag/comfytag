# ComfyTag Design System
> "Your face is your ticket."
> Version 1.0 — May 2026

---

## Philosophy

ComfyTag is the Kuda of event ticketing. Not loud. Not corporate. Clean, premium, and distinctly Nigerian — with one bold brand colour that owns the space.

Two systems. One brand DNA.

- **Public system** (web + mobile): Warm, inviting, vibrant. A place to discover and feel excited.
- **Dashboard system** (partner + admin): Dark, focused, data-forward. A place to work.

The brand colour — deep violet-purple — is the bridge. It appears in both systems identically, making them feel like one product family.

---

## Brand Colour

| Token | Value | Usage |
|---|---|---|
| `--brand-primary` | `#7C3AED` | Primary actions, CTAs, key UI elements |
| `--brand-primary-dark` | `#5B21B6` | Hover, pressed, focus ring |
| `--brand-primary-light` | `#EDE9FE` | Tinted backgrounds, selected states |

> **Why this colour:** Deep violet-purple is ownable. No Nigerian ticketing competitor uses it. It sits precisely between premium (dark enough to feel serious) and energy (vibrant enough to feel exciting). It reads as trustworthy on financial flows and exciting on event discovery — both things ComfyTag needs to be.

---

## System 1 — Public (web + mobile)

### Surfaces
| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#FAFAF9` | Page background (warm off-white, not pure white) |
| `--bg-surface` | `#FFFFFF` | Card backgrounds, input fields |
| `--bg-surface-alt` | `#F5F3FF` | Featured sections, purple-tinted wash |
| `--bg-overlay` | `rgba(28,25,23,0.60)` | Image overlays, modals backdrop |

### Text
| Token | Value | Usage |
|---|---|---|
| `--text-primary` | `#1C1917` | Headings, body copy (warm near-black) |
| `--text-secondary` | `#78716C` | Supporting text, metadata |
| `--text-muted` | `#A8A29E` | Placeholders, captions, disabled |
| `--text-on-brand` | `#FFFFFF` | Text on brand-coloured backgrounds |

### Borders
| Token | Value | Usage |
|---|---|---|
| `--border-default` | `#E8E5E0` | Cards, inputs, dividers (warm grey) |
| `--border-focus` | `#7C3AED` | Focus ring on interactive elements |

### Gradients
| Token | Value | Usage |
|---|---|---|
| `--gradient-hero` | `linear-gradient(135deg, #7C3AED, #C026D3)` | Hero sections, event card overlays |
| `--gradient-card-overlay` | `linear-gradient(to top, rgba(28,25,23,0.85) 0%, transparent 60%)` | Text legibility over event cover images |

---

## System 2 — Dashboards (partner + admin)

### Surfaces
| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#0F0F0F` | Page background (warm near-black) |
| `--bg-surface` | `#1A1A1A` | Cards, panels |
| `--bg-surface-alt` | `#242424` | Elevated surfaces, modals, dropdowns |
| `--bg-surface-hover` | `#2E2E2E` | Row hover states |

### Text
| Token | Value | Usage |
|---|---|---|
| `--text-primary` | `#F5F5F4` | Headings, body copy (warm near-white) |
| `--text-secondary` | `#A8A29E` | Supporting text, metadata |
| `--text-muted` | `#78716C` | Placeholders, disabled |
| `--text-on-brand` | `#FFFFFF` | Text on brand-coloured backgrounds |

### Borders
| Token | Value | Usage |
|---|---|---|
| `--border-default` | `#2E2E2E` | Cards, table rows, dividers |
| `--border-light` | `#3D3D3D` | Hover states, active rows |
| `--border-focus` | `#7C3AED` | Focus ring on interactive elements |

---

## Semantic Colours (shared across both systems)

### Status
| Token | Value | Light bg | Usage |
|---|---|---|---|
| `--color-success` | `#10B981` | `#D1FAE5` | Ticket confirmed, check-in approved, KYC verified |
| `--color-energy` | `#F59E0B` | `#FEF3C7` | FOMO triggers — Trending, Tonight, Selling Fast badges (public site only) |
| `--color-financial` | `#D97706` | `#FEF0C7` | Revenue numbers, payout amounts, earnings displays (dashboards only) |
| `--color-warning` | `#F59E0B` | `#FEF3C7` | Warning states (admin/dashboard only — never on public site) |
| `--color-error` | `#EF4444` | `#FEE2E2` | Failed, rejected, sold out, denied entry |
| `--color-info` | `#3B82F6` | `#DBEAFE` | Neutral notifications, info tooltips |

### Event Status Badges
| Status | Background | Text |
|---|---|---|
| Upcoming | `#FEF3C7` | `#92400E` |
| Live (+ pulse dot) | `#D1FAE5` | `#065F46` |
| Ended | `#F5F5F4` | `#78716C` |
| Sold Out | `#FEE2E2` | `#991B1B` |
| Draft | `#F5F3FF` | `#5B21B6` |
| Trending | `#FEF3C7` | `#92400E` |
| Tonight | `#FEF3C7` | `#92400E` |
| Selling Fast | `#FEF2C7` | `#92400E` |

### Badge Usage Rules

**Energy badges (amber) — public site and mobile only:**
These badges exist to trigger FOMO and drive purchase decisions.
Use them aggressively on discovery surfaces.

- `Trending` — event with above-average ticket velocity in last 24hrs
- `Tonight` — event date is today
- `Selling Fast` — less than 20% capacity remaining
- `Upcoming` — event is in the future, ticket sales open

**Financial colour (`#D97706`) — dashboards only:**
Never use the financial gold colour on the public site or mobile 
attendee screens. It is reserved exclusively for:
- Revenue totals in partner analytics
- Payout amounts in partner and admin payouts
- GMV figures in admin overview

**Warning colour — admin and dashboard only:**
Never use warning amber on the public site as a status indicator.
On the public site, amber means energy and FOMO — not caution.

### Chart / Data Series (dashboards)
| Series | Value |
|---|---|
| 1 | `#7C3AED` |
| 2 | `#F59E0B` |
| 3 | `#10B981` |
| 4 | `#3B82F6` |
| 5 | `#EC4899` |

---

## Typography

### Typefaces

**Primary: Inter (Variable)**
- Source: Google Fonts (free, no license required)
- Usage: All UI text — body copy, headings, labels, navigation
- Why: Clean, modern, highly legible at all sizes from 10px caption to 72px hero. Excellent at both small UI labels and large display use.

**Monospace: JetBrains Mono**
- Source: Google Fonts (free)
- Usage: Ticket IDs, QR code references, transaction IDs, OTP codes, verification codes
- Why: Creates instant "official document" feel. Distinguishes data from interface text.

### Type Scale (4pt grid)

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `--text-xs` | 12px | 16px | 400 | Captions, metadata, timestamps |
| `--text-sm` | 14px | 20px | 400 | Secondary body, labels |
| `--text-base` | 16px | 24px | 400 | Primary body copy |
| `--text-lg` | 18px | 28px | 500 | Lead paragraphs |
| `--text-xl` | 20px | 28px | 600 | Card titles, section subheadings |
| `--text-2xl` | 24px | 32px | 600 | Section headings |
| `--text-3xl` | 30px | 36px | 700 | Page titles |
| `--text-4xl` | 36px | 40px | 700 | Feature headings |
| `--text-5xl` | 48px | 52px | 800 | Hero headlines only |

### Font Weight Reference
| Weight | Usage |
|---|---|
| 400 Regular | Body copy, descriptions |
| 500 Medium | UI labels, nav items, captions that need clarity |
| 600 Semibold | Card titles, subheadings, prices |
| 700 Bold | Page headings, strong emphasis, large numbers |
| 800 Extra Bold | Hero headlines only |

---

## Spacing (4pt grid)

All spacing values are multiples of 4px.

```
4px   — Tight gaps (icon + label, inline elements)
8px   — Small internal padding
12px  — Component internal spacing
16px  — Default padding (mobile)
20px  — Card internal padding
24px  — Default padding (web/desktop)
32px  — Component separation
40px  — Section internal padding
48px  — Section gap (mobile)
64px  — Section gap (tablet)
80px  — Section gap (desktop)
96px  — Large section separation
```

### Layout Containers
| Context | Max Width |
|---|---|
| Narrow (forms, auth) | 480px |
| Standard (content) | 768px |
| Wide (dashboard) | 1280px |
| Full bleed | 100% |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 6px | Badges, tags, chips, small buttons |
| `--radius-md` | 12px | Buttons, input fields, dropdowns |
| `--radius-lg` | 16px | Cards (event cards, ticket cards, form panels) |
| `--radius-xl` | 20px | Large feature cards, modal containers |
| `--radius-2xl` | 24px | Bottom sheets, dialog modals |
| `--radius-full` | 9999px | Pill buttons, avatar circles, toggle switches |

---

## Shadows (Public system only — dashboards use borders)

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.08)` | Cards at rest, subtle lift |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.10)` | Card hover state |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.12)` | Modals, drawers, floating panels |
| `--shadow-xl` | `0 16px 48px rgba(0,0,0,0.16)` | Tooltips, popovers, dropdowns |

---

## Components

### Event Card (public)
- Cover image: full bleed, 16:9 aspect ratio
- Dark gradient overlay on bottom half for text legibility
- Category badge: amber pill, top-left corner of image
- Price: bold, bottom-right corner of image
- Title + date: white text over gradient overlay
- Organizer: small avatar + name below the image
- Border radius: 16px
- Shadow: `--shadow-sm`, elevates to `--shadow-md` on hover

### Ticket Card (wallet)
- Background: white (public) / `#1A1A1A` (dashboard)
- Left accent border: 4px solid `--brand-primary`
- Perforated divider: dashed border between info and QR section
- QR code: centred, large, maximum contrast for scanning
- Ticket ID: JetBrains Mono, muted colour
- Border radius: 16px

### Button System
| Variant | Background | Text | Border |
|---|---|---|---|
| Primary | `--brand-primary` | white | none |
| Secondary | transparent | `--brand-primary` | `--brand-primary` |
| Ghost | transparent | `--brand-primary` | none |
| Danger | `--color-error` | white | none |
| Disabled | any at 40% opacity | — | — |

| Size | Height | Font Size | Padding |
|---|---|---|---|
| sm | 32px | 14px | 0 12px |
| md (default) | 44px | 16px | 0 20px |
| lg | 52px | 18px | 0 24px |

### Input Fields
- Height: 48px
- Border: 1px solid `--border-default`
- Border radius: 12px
- Focus: `--border-focus` 2px ring
- Font: 16px (prevents iOS auto-zoom)
- Label: 14px, semibold, above field
- Error: `--color-error`, small text below field

### Navigation
- Top nav (web): 64px height, sticky, blur backdrop
- Sidebar (dashboards): 240px expanded, 64px collapsed
- Bottom tab bar (mobile): 80px height (includes safe area)
- Active tab: `--brand-primary` icon + label
- Inactive tab: `--text-muted` icon + label

---

## Motion & Animation

**Principle:** Fast and purposeful. Animations communicate state changes — never decorate or delay.

### Duration Scale
| Name | Duration | Usage |
|---|---|---|
| Micro | 100ms | Hover states, colour changes, focus rings |
| Fast | 200ms | Exit animations (always faster than enter) |
| Default | 250ms | Page transitions, drawer slides, sheet opens |
| Entrance | 300ms | Modals, toasts, notification banners |

### Easing
| Name | Value | Usage |
|---|---|---|
| Entrance | `cubic-bezier(0.0, 0.0, 0.2, 1.0)` | Elements entering the screen |
| Exit | `cubic-bezier(0.4, 0.0, 1.0, 1.0)` | Elements leaving the screen |
| Standard | `cubic-bezier(0.4, 0.0, 0.2, 1.0)` | State changes within the screen |

### Signature Animations

**Check-in success (organizer check-in screen)**
Full-screen green flash. Scale 0.8 → 1.05 → 1.0 over 200ms.
Communicates instant approval. Must be readable from arm's length in a dark venue.

**Check-in denied**
Full-screen red flash, same pattern. No ambiguity.

**Face scan overlay**
Pulsing oval border at 1.5s loop. Calm, not urgent.
Colour changes from `--border-default` to `--brand-primary` when face detected.

**Ticket QR reveal**
Fade in + scale from 0.95 to 1.0 over 300ms.
Feels secure and deliberate — like opening a vault.

**Live event badge**
Pulsing green dot, 1.5s loop, opacity 1.0 → 0.4 → 1.0.
Only used on currently-live events.

---

## Icons

**Library:** Lucide Icons
- Consistent stroke weight (1.5px)
- Clean, modern, works at 16px and 24px
- Available as React components and SVG sprites
- No license cost

**Sizes:**
- 16px — Inline with text, compact UI
- 20px — Default UI icon size
- 24px — Navigation, feature icons
- 32px — Empty states, illustrations

---

## Imagery Guidelines

### Event Cover Images
- Minimum: 1200 × 675px (16:9)
- Always use the dark gradient overlay — never display text directly over image without overlay
- Fallback if no image: purple gradient from `--gradient-hero`

### Organizer Avatars
- Shape: circle (`--radius-full`)
- Sizes: 24px (compact), 40px (default), 64px (profile), 96px (header)
- Fallback: initials on `--brand-primary-light` background, `--brand-primary` text

### Empty States
- Lucide icon at 48px, `--text-muted` colour
- Short headline, 16px semibold
- Supporting text, 14px muted
- CTA button (primary) where applicable

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text and UI components
- Focus rings: always visible, `--border-focus` colour, 2px offset
- Touch targets: minimum 44 × 44px (mobile), 32 × 32px (desktop)
- Font size: never below 12px in production, never below 16px on form inputs
- Colour never used as the only indicator of state — always paired with text or icon
- All images have descriptive alt text
- All form fields have visible labels (not placeholder-only)

---

## File Structure (packages/ui)

```
packages/ui/
├── tokens/
│   ├── colors.ts         CSS variables + TypeScript tokens
│   ├── typography.ts     Font scale + weight constants
│   ├── spacing.ts        Spacing scale constants
│   ├── radius.ts         Border radius constants
│   ├── shadows.ts        Shadow scale constants
│   └── motion.ts         Duration + easing constants
├── components/
│   ├── Button/
│   ├── Input/
│   ├── Badge/
│   ├── Card/
│   ├── EventCard/
│   ├── TicketCard/
│   ├── Avatar/
│   ├── Modal/
│   ├── Toast/
│   ├── EmptyState/
│   └── ...
├── layouts/
│   ├── PublicLayout/     Web public pages
│   ├── DashboardLayout/  Partner + admin
│   └── MobileLayout/     React Native base
└── index.ts              Barrel export
```

---

## Tailwind Config (shared)

```js
// packages/ui/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7C3AED',
          dark: '#5B21B6',
          light: '#EDE9FE',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F5F3FF',
          dark: '#1A1A1A',
          'dark-alt': '#242424',
        },
        warm: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E8E5E0',
          300: '#A8A29E',
          400: '#78716C',
          900: '#1C1917',
        },
        energy: '#F59E0B',
        financial: '#D97706',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      animation: {
        'pulse-slow': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'checkin-success': 'checkin 200ms ease-out forwards',
      }
    }
  }
}
```

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | May 2026 | Initial design system — all four apps |
| 1.1 | May 2026 | Amber split: --color-energy (#F59E0B) for FOMO triggers, --color-financial (#D97706) for revenue displays. Added badge usage rules. |

---

*This file is the source of truth for all design decisions on ComfyTag.
Any deviation from these tokens requires a documented reason and council approval.*
