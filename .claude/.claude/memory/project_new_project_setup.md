---
name: New Project Setup
description: Full onboarding process for a new Shopify theme project: what to copy from the startup kit and what to customize before building any sections.
type: project
---

# New Project Setup

Two steps before writing any section code:
1. **Copy** the startup kit files into the new project
2. **Customize** the design-specific values for the project's brand

---

## Step 1 — Copy Startup Kit

Source: `/Users/cross/Module update/`

### blocks/
| File | Purpose |
|------|---------|
| `body-text.liquid` | Rich text body copy block |
| `button-group.liquid` | One or two CTA buttons block |
| `caption.liquid` | Small caption/label text block |
| `column-card.liquid` | Card block for column/grid layouts |
| `divider.liquid` | Horizontal rule with color + spacing options |
| `heading.liquid` | Heading block (h1–h5 variants) |
| `image.liquid` | Responsive image block with aspect ratio controls |
| `migration-target.liquid` | Block used as a migration placeholder |
| `parent-rich-text.liquid` | Rich text wrapper for nested block composition |
| `spacer.liquid` | Blank vertical spacer block |
| `subheading.liquid` | Subheading/eyebrow text block |

### snippets/
| File | Purpose |
|------|---------|
| `button.liquid` | Shared button component (primary/secondary/tertiary variants) |
| `button-group.liquid` | Renders one or two buttons from block settings |
| `divider.liquid` | Renders the divider block as a snippet |
| `ui-components.liquid` | Shared UI component registry (modals, drawers, etc.) |

### sections/
| File | Purpose |
|------|---------|
| `rich-text.liquid` | Multi-column rich text section using block system |
| `vertical-rich-text.liquid` | Single-column stacked rich text section |

### ts/components/ (compiled → assets/shared.js)
| File | Purpose |
|------|---------|
| `global.ts` (entry: `ts/sections/global.ts`) | Global theme init, scroll, nav behaviors |
| `migrate-section.ts` | Section migration utility |
| `ui-components.ts` | UI component JS (modals, drawers, accordions) |

---

## Step 2 — Customize for the Project

Check `tailwind.config.js` first to establish the project's token names, then work through Priority 1 top to bottom.

### Priority 1 — Update Before Any Section Work

| File | What to Update |
|------|----------------|
| `tailwind.config.js` | Token names + hex values (ah-navy, ah-teal, etc.), font family, breakpoints if different from defaults (`small` 390px, `md-small` 768px, `md` 1024px, `lg` 1280px, `2xl` 1550px) |
| `snippets/button.liquid` | Primary hover bg (`#52C3C2` / ah-teal), tertiary default color (`#358282`), sizing/padding if brand differs |
| `snippets/divider.liquid` | `ah-navy-400` hex (`#385169`) in color options — update to project brand |
| `blocks/heading.liquid` | Default color (`#092846`) |
| `blocks/subheading.liquid` | Default color (`#092846`) |
| `blocks/caption.liquid` | Default color (`#323E46`) |
| `blocks/body-text.liquid` | Default color (`#323E46`) |
| `blocks/image.liquid` | Default aspect ratios (desktop: 1, mobile: 2.37), `icon_max_width` (100px) — verify against designs |
| `sections/rich-text.liquid` | Default column count (3), padding (mobile 44px, desktop 96px), gap (32px) |
| `sections/vertical-rich-text.liquid` | Padding (mobile 44px, desktop 96px), subheading max-width (694px hardcoded) |
| `blocks/spacer.liquid` | Default heights (10px mobile + desktop) |
| `blocks/column-card.liquid` | Default border-radius (12px) |

### Priority 2 — Review, Usually Fine to Leave

| Item | Notes |
|------|-------|
| Heading variant sizes (h1–h5 px + letter-spacing) | Verify against typography spec |
| Button border-radius (`tw-rounded-full`) | Change only if project uses square/slight-radius buttons |
| UI component z-index values (999, 1000, 1050, 1060) | Change only if conflicts with project overlays |

### Onboarding Checklist
- [ ] `tailwind.config.js` updated with project tokens
- [ ] All hardcoded hex values replaced with project token classes
- [ ] Section padding defaults match design spec
- [ ] Column counts and grid gaps match design
- [ ] Button variants match brand guidelines
- [ ] Image aspect ratios verified against designs
