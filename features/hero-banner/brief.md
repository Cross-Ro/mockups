# Hero Banner — Brief

## What & Why

**Feature:** `hero-banner` — full-width hero section with background image and text overlay.
**Purpose:** Landing page hero promoting new arrivals / seasonal campaigns. Merchant-configurable content and background.
**Figma:** Desktop node `5654:4210` (full section), `5654:4215` (text overlay) in file `g3gxO3mhrniJOYTHNmotAu`.

---

## Architecture Decisions

### Liquid type: Section (not snippet)
- Merchant places it via Theme Editor
- Owns its own schema, no parent dependency
- One section file, no snippets needed -- single component, no repeating cards

### File manifest
| File | Purpose |
|------|---------|
| `sections/hero-banner.liquid` | Section markup + schema |
| `scss/sections/hero-banner.scss` | Section styles |
| `ts/sections/hero-banner.ts` | Optional -- only if JS interaction needed (currently none required) |

**Decision:** Skip TS entry initially. No JS behavior in design -- no carousel, no dynamic state, no fetch. CTA is a plain `<a>` link. Add TS entry later if interaction is needed.

### No snippet extraction
Single content block, no repeating components. Snippet extraction adds indirection with zero reuse benefit here.

---

## Data

All data comes from **section settings** (merchant-configurable via Theme Editor):

| Setting | Type | Default | Notes |
|---------|------|---------|-------|
| `background_image` | `image_picker` | (required) | Blue gradient/shape background |
| `subtitle` | `text` | "NEW ARRIVALS" | Uppercase label above heading |
| `heading` | `text` | "Unlock Exclusive Savings" | Main heading, 60px desktop |
| `description` | `richtext` | "Get contractor Pricing..." | Body copy, 70% opacity |
| `button_text` | `text` | "Shop Now" | CTA label |
| `button_link` | `url` | (blank) | CTA destination |
| `overlay_opacity` | `range` | 0 | Optional dark overlay on image for readability (0-100) |
| `content_max_width` | `range` | 938 | Max-width of content container in px (600-1200) |
| `padding_top_desktop` | `range` | 32 | Top padding desktop |
| `padding_bottom_desktop` | `range` | 32 | Bottom padding desktop |
| `padding_top_mobile` | `range` | 20 | Top padding mobile |
| `padding_bottom_mobile` | `range` | 20 | Bottom padding mobile |

No metafields, no product data, no fetches.

---

## Behaviour

### Variants / States
This section is static content -- no JS-controlled states.

| State | Trigger | Rendering |
|-------|---------|-----------|
| Default | Page load | Full hero with all content |
| No image | `background_image` blank | Fallback solid color background (#027db3) |
| No subtitle | `subtitle` blank | Subtitle element not rendered |
| No description | `description` blank | Description not rendered |
| No CTA | `button_text` blank | Button not rendered |

All states are **Liquid conditionals** -- no JS needed.

### Responsive Strategy: CSS-only
No DOM duplication. Same markup, different styles per breakpoint.

**Desktop (md: 1024px+):**
- Heading: 60px, bold
- Subtitle: 16px, medium, uppercase
- Description: 16px, 70% opacity
- Content max-width: 938px (setting-controlled)
- Inner padding: 31px top, 32px bottom, 20px horizontal
- Gap between elements: 16px

**Mobile (<1024px):**
- Heading: 32px (scaled down)
- Content: full-width with 20px horizontal padding
- Same vertical stacking, no layout change needed
- Image covers via `object-fit: cover`

### JS Events
None emitted, none listened to.

### API Calls
None.

---

## Implementation Detail

### Liquid (`sections/hero-banner.liquid`)

Structure:
```
<section> (full-width, relative positioned)
  <div> background image (absolute, cover, optional overlay)
  <div> content container (relative, max-width from setting, centered)
    <div> inner wrapper (padding, flex column, gap 16px)
      {%- if subtitle -%} <p> subtitle {%- endif -%}
      {%- if heading -%} <h2> heading {%- endif -%}
      {%- if description -%} <div> description {%- endif -%}
      {%- if button_text -%} <a> CTA button {%- endif -%}
```

Background image uses `{{ background_image | image_url: width: 1920 }}` with srcset for responsive loading.

Schema: `"name": "Hero Banner"`, `"tag": "section"`, `"class": "hero-banner"`. No blocks needed -- all content is section-level settings.

### SCSS (`scss/sections/hero-banner.scss`)

- `.hero-banner` — relative, overflow hidden, min-height for visual presence
- `.hero-banner__bg` — absolute inset, object-fit cover
- `.hero-banner__overlay` — absolute inset, background black, opacity from setting (inline style)
- `.hero-banner__container` — relative z-10, margin auto, padding horizontal 20px
- `.hero-banner__inner` — flex column, gap 16px, padding top/bottom from design
- `.hero-banner__subtitle` — font-size 16px, font-weight 500, uppercase, letter-spacing, white
- `.hero-banner__heading` — font-size 60px desktop / 32px mobile, font-weight 700, white, max-width ~503px
- `.hero-banner__description` — font-size 16px, white, opacity 0.7
- `.hero-banner__cta` — inline-block, background #027db3, white text, font-weight 700, 16px, border-radius full (pill), padding ~14px 32px, hover darken

Use Tailwind (`tw-` prefix) for all styling. For typography values not in Tailwind config, use arbitrary values (e.g. `tw-text-[60px]`, `tw-leading-[66px]`). SCSS only for non-typography values that truly need it (hover states, complex selectors).

Responsive: single `md:` breakpoint for heading size change. Mobile-first approach.

### TS
No TS entry file for initial build. Section is purely static.

---

## Technical Tradeoffs

| Decision | Alternative | Why chosen | Downside |
|----------|-------------|------------|----------|
| Section-level settings only, no blocks | Use blocks for each text element | Single content group, no repeating patterns -- blocks add unnecessary complexity | Cannot reorder elements in editor (acceptable -- order is fixed by design) |
| CSS-only responsive | DOM duplication for mobile | Same layout structure on both breakpoints, just size changes | None -- this is the right call for this design |
| No TS entry | Create empty TS entry | No JS behavior exists | Must add later if interaction needed (minor cost) |
| Tailwind arbitrary values for typography | SCSS for all custom values | Keeps typography in markup, reduces SCSS file scope, consistent with user preference | Longer class strings in Liquid |
| `richtext` for description | `textarea` | Allows merchant to add links/bold within description | Slightly more complex output handling |
| Srcset on background image | Single image URL | Performance -- serves appropriate size per viewport | More markup |

---

## Constraints & Assumptions

- **Constraint:** Tailwind prefix `tw-` required for all Tailwind classes
- **Constraint:** SCSS entry in `scss/sections/` -- webpack globs it automatically
- **Constraint:** Image must be lazy-loadable (below fold possible) but hero is typically above fold -- use `loading="eager"` with `fetchpriority="high"`
- **Assumption:** CTA button links to a collection or page (standard `<a>` tag) -- no cart/AJAX behavior
- **Assumption:** No video background variant needed (design shows image only)
- **Assumption:** Mobile breakpoint threshold at 1024px (matches project `md` breakpoint)
