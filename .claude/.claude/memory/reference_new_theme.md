---
name: New-theme & Shopify Build Methodology
description: New-theme project context (path, stack, key files) plus methodology principles for Shopify theme development. Covers image abstraction, layout strategy, block-level variants, schema ownership, carousel, and the startup kit relationship.
type: reference
---

# New-theme & Shopify Build Methodology

## Project Context

Path: `/Users/cross/New-theme`

New-theme is the gold standard Shopify theme project. Its patterns (block-level variants, carousel-swiper, shopify-responsive-image, schema ownership) are the defaults for all new Shopify section builds.

When building any Shopify section, read `/Users/cross/New-theme/DEVELOPMENT_STANDARDS.md` for canonical patterns.

### Stack
- Webpack 5, JS (ES6+/Babel), React 19 islands, SCSS + Tailwind (`tw-` prefix)
- Playwright E2E, Shopify theme push
- `js/sections/` and `scss/sections/` as webpack entry points

### Key Files
- `DEVELOPMENT_STANDARDS.md` — full coding standards (canonical reference)
- `tailwind.config.js` — design tokens (ah-navy, ah-teal, etc.)
- `js/components/carousel-swiper.js` — reusable carousel custom element
- `snippets/shopify-responsive-image.liquid` — image snippet to use everywhere

## Startup Kit vs. Reference Project

- **New-theme** — gold standard for methodology. Study it to understand *how* things should be built.
- **Module update** (`/Users/cross/Module update`) — the distributable startup kit derived from New-theme. This is the *actual bootstrapping source* — copy its blocks/snippets/sections/TS files into every new project. See `project_new_project_setup.md` for the full onboarding process.

---

## Methodology Principles

### Image Handling
Always abstract images behind a project-level responsive image snippet. Never raw `<img>` in sections. The snippet must handle: srcset, aspect ratio (padding-top technique), fit mode (fill/cover/contain), lazy loading toggle. Hero/banner images must disable lazy loading — they are above the fold.

### Shared Container Classes
Define max-width + horizontal padding once as shared utility classes. Every section uses these classes rather than hardcoding layout values inline.

### Layout: Grid → Flex
Grid at container level (required for aspect-ratio image compatibility). Flex inside content areas for vertical flow and `margin-top: auto` bottom-anchoring.

### Variable Initialization
All Liquid variable assignments at the top of a section in one block — never scattered throughout the template.

### One Snippet Per Variation
Each distinct visual variation of a component = its own snippet file. Never branch multiple variations inside one snippet. A router can dispatch to them but must not contain markup.

### Block-Level Variants
Multiple card/component styles in a section = separate Theme Block files. Sections render blocks generically. Sections own layout; blocks own variant settings, internal structure, and sizing.

### Schema Ownership
- Sections: layout type, column counts, global controls
- Blocks: variant-specific settings, nested composition, internal dimensions
- `richtext` for long content, `text` for short labels
- `visible_if` to show controls contextually
- Range step must evenly divide (max - min)

### Carousel
Implement as a reusable Web Component (custom element) configured via inline JSON. Any section gets a carousel by adding the element — no per-section JS required.

### Default Responsive Pattern for Cards
Mobile: carousel (swipe-friendly). Desktop: CSS grid. Both in DOM, CSS toggles visibility. No JS-driven responsive switching.

### Rules
- `{% render %}` not `{% include %}` (scoped, explicit params)
- Scripts always deferred
- SVG files via asset CDN, never inline
- Text overflow in flex: min-width: 0 + word-break on text nodes
- Never write to the compiled output directory
