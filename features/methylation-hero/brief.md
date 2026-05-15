# Methylation Hero — Brief

## What & Why

**Feature:** `methylation-hero` — landing-page hero for 10X Health "Summer Methylation Special" campaign.
**Purpose:** Above-the-fold conversion surface promoting methylation bundle. Communicates product value props (3 value cards), price (compare-at + final), primary CTA, and an authority/credibility box. Fully merchant-editable via block schema so marketing can rotate seasonal copy/images without dev work.

**Figma file:** `M2Ssx1IIYU7iwaNtwXft3n`
- Desktop section: node `12071:3782` (~1440px)
- Mobile image stack: node `12071:4252` (440px baseline)
- Mobile product copy: node `12071:4258` (440px baseline)

---

## Architecture Decisions

### Liquid type: Section (with snippets for repeating components)
- Merchant places it via Theme Editor (single instance on landing template)
- Drives layout + block iteration; delegates repeating sub-components to snippets
- Section owns: grid/flex container, layout toggles, color scheme, top-level wrapper element
- Snippets own: discrete components (image card, product copy column, value card, authority feature row)

### Block-driven content model (no monolithic settings)
Every editable text/image/icon lives in a **block**, not a section setting. This keeps content reorderable, addable, removable inside the Theme Editor without dev. Section settings reserved purely for layout/color/spacing toggles.

### File manifest

| File | Purpose |
|------|---------|
| `sections/methylation-hero.liquid` | Section markup + full block schema + layout containers |
| `snippets/methylation-hero-image-stack.liquid` | Renders left column: 1 hero image + 2x2 grid on desktop / horizontal swiper on mobile. Iterates `image` blocks. |
| `snippets/methylation-hero-product-copy.liquid` | Renders right column: eyebrow / serif headline / script headline / tagline / body / 3 value cards / price / CTA. Iterates relevant block types. |
| `snippets/methylation-hero-value-card.liquid` | One value card (icon + label + value + accent color). Called from product-copy snippet. |
| `snippets/methylation-hero-feature.liquid` | One authority feature row (icon + 2-line label). Called from section authority box. |
| `scss/components/methylation-hero-tokens.scss` | Section-scoped CSS custom properties (fonts, colors, sizes, spacing, radius). Scoped under `.methylation-hero { ... }` — NEVER `:root`. |
| `scss/sections/methylation-hero.scss` | Section styles. Imports tokens file. Consumes vars only — zero raw hex/px allowed. |
| `ts/sections/methylation-hero.ts` | **Optional.** Only added if pure-CSS swap is insufficient. See Swiper section below. |

### No section-setting content
Anything text/image-shaped lives in a block. This is the canonical pattern referenced by the planner-first workflow and is the only way to support reordering of value cards, authority features, and image cards in the editor.

---

## Data

### Section settings (layout / theme only)

| Setting | Type | Default | Notes |
|---------|------|---------|-------|
| `color_scheme` | `color_scheme` | (default) | Standard Shopify color scheme picker |
| `container_padding_top` | `range 0–120 step 4` | 48 | Top padding (px) |
| `container_padding_bottom` | `range 0–120 step 4` | 48 | Bottom padding (px) |
| `container_padding_top_mobile` | `range 0–120 step 4` | 24 | Mobile override |
| `container_padding_bottom_mobile` | `range 0–120 step 4` | 24 | Mobile override |
| `desktop_layout` | `select` | `2-col` | Future-proof; currently only `2-col` |
| `mobile_image_loop` | `checkbox` | `true` | Swiper loop on mobile carousel |
| `mobile_image_autoplay` | `checkbox` | `false` | Swiper autoplay toggle |
| `mobile_image_autoplay_delay` | `range 2000–8000 step 500` | 4000 | Autoplay delay (ms) |

### Block types

Order of blocks in the Theme Editor sidebar matches design reading order.

| Block type | Limit | Settings | Renders into |
|------------|-------|----------|--------------|
| `image` | up to 5 | `image_picker` image, `text` alt, `url` link (optional) | Left column / mobile swiper |
| `eyebrow` | 1 | `text` text (default: "Summer Methylation Special") | Above headlines, 24px |
| `headline_serif` | 1 | `text` text (default: "Decode Your Methylation") | Oswald display |
| `headline_script` | 1 | `text` text (default: "Design Your Summer") | Allison script |
| `tagline` | 1 | `richtext` text | Sub-headline body |
| `body` | 1 | `richtext` text | Long-form body block |
| `value_card` | up to 3 | `text` label, `text` value, `image_picker` icon, `color` accent | Value-prop row |
| `price` | 1 | `text` compare_at, `text` final, `text` save_label (optional) | Price display |
| `cta` | 1 | `text` label (default: "Claim My Bundle"), `url` link | Primary action |
| `authority_headline` | 1 | `text` text (default: "Doing everything right…") | Authority box header |
| `authority_body` | 1 | `richtext` text | Authority box paragraph |
| `authority_feature` | up to 5 | `image_picker` icon, `text` line_1, `text` line_2 | Feature row |
| `authority_cta` | 1 | `text` label (default: "Decode My Methylation"), `url` link | Authority CTA |

### Liquid object access
- `section.settings.*` for layout controls
- `section.blocks` iterated with `case block.type` switch
- `block.shopify_attributes` rendered on each block wrapper (Theme Editor needs it for selection)
- `block.settings.image | image_url: width: 1400` for responsive hero image (`width: 700` for grid thumbnails)
- `block.settings.image.alt | escape | default: block.settings.alt`
- No `product`, no `cart`, no metafields — section is fully merchant-driven content.

No fetch calls. No metafields. No cart interaction (CTA is a plain `<a>`).

---

## Behaviour

### Layout

**Desktop ≥1024px (Tailwind `md:` and up):**
- 2-column grid: `tw-grid tw-grid-cols-[700px_minmax(0,1fr)]` (or `tw-grid-cols-2` with gap)
- Left column = image stack:
  - 1 hero image, 700px wide
  - Below: 2×2 grid of 345px supporting images (uses image blocks 2–5)
- Right column =
  - Product copy stack (eyebrow → serif headline → script headline → tagline → body → 3 value cards row → price → CTA)
  - Authority box stacked directly under product copy, same column width

**Mobile <1024px:**
- Vertical stack, full-width
- Image stack becomes horizontal `<carousel-swiper>` (5 images) — `slidesPerView: 1.1`, peek-edge effect
- Right column flows below carousel
- Authority box becomes full-width below product copy
- Pagination dots under swiper

### Responsive strategy: hybrid (CSS swap + minimal DOM)
- Image stack snippet renders the **same 5 image blocks twice** in two wrappers: `.methylation-hero__images--grid` (visible ≥md) and `.methylation-hero__images--swiper` (visible <md). The two wrappers share the same underlying loop output via a Liquid `for` that prints into both shells in one pass (or use a single source rendered through CSS-only swap if Swiper's auto-init tolerates `display:none`).
- **Preferred:** CSS-only `display` toggle on the wrapper. `<carousel-swiper>` initializes once at page load. On desktop, the wrapper is `tw-hidden md:tw-block` reversed for the swiper version. Swiper v12 tolerates being mounted in a hidden container if `observer: true` is set.
- **Fallback (only if visual bugs):** add `ts/sections/methylation-hero.ts` with `matchMedia('(min-width: 1024px)')` listener that calls `destroy()` / `init()` on the swiper instance.

### States

| State | Trigger | Rendering |
|-------|---------|-----------|
| Default | Page load | All blocks render in document order |
| Missing block | Block not added | Element/wrapper not rendered (Liquid `unless block` guard) |
| <5 image blocks | Merchant adds fewer | Grid renders only available images; supporting grid collapses gracefully (1, 2, 3, or 4 cells) |
| Swiper, single image | 1 image block only | Pagination + navigation hidden |
| Theme Editor empty section | Zero blocks | Section emits a `presentation: { announcements: [] }` placeholder string per Shopify guidance |

All visibility logic is Liquid — no JS-driven states beyond Swiper interaction.

### JS

- Emits: none
- Listens to: none
- Reuses `<carousel-swiper>` custom element already registered in `ts/sections/global.ts:8` — no new TS unless matchMedia teardown needed.

### API calls
None.

---

## CSS Variables — Tokens File

**File:** `scss/components/methylation-hero-tokens.scss`
**Scope:** `.methylation-hero { /* all vars here */ }` — NEVER `:root`. Prevents leak into other sections.

### Font tokens
```
--mh-font-display:  'Oswald', sans-serif       (serif/condensed display headlines)
--mh-font-script:   'Allison', cursive          (script accent headline)
--mh-font-body:     'Inter', sans-serif         (body, authority headline)
--mh-font-accent:   'Montserrat', sans-serif    (eyebrow, value-card labels, CTA)
```

### Color tokens (drawn from Figma)
```
--mh-color-red:       #d2242a    (CTA primary, sale/price emphasis)
--mh-color-navy:      #152f4f    (headlines, authority box background)
--mh-color-gold:      #c99b65    (accent / script headline / value highlights)
--mh-color-body:      #1f2937    (body text default)
--mh-color-muted:     #6b7280    (compare-at strikethrough, secondary copy)
--mh-color-surface:   #ffffff    (section background)
--mh-color-on-navy:   #ffffff    (text on authority box)
```

### Spacing & radius tokens
```
--mh-space-section:   clamp(1.5rem, calc(2.5vw + 0.5rem), 3rem)
--mh-space-col-gap:   clamp(1.5rem, calc(2.5vw + 0.5rem), 4rem)
--mh-space-stack-sm:  0.5rem
--mh-space-stack-md:  1rem
--mh-space-stack-lg:  1.5rem
--mh-radius-sm:       0.5rem
--mh-radius-md:       0.75rem
--mh-radius-lg:       1rem
--mh-radius-pill:     999px
```

### Font-size tokens (fluid `clamp()` derived from 440 → 1440 viewport)
Formula: `clamp(min_px, calc(slope·vw + intercept_rem), max_px)` where
- slope = `(max_px - min_px) / (1440 - 440)` × 100 → expressed as `vw`
- intercept_rem = `(min_px - slope·440)/16` → in rem

Computed values:

| Token | Min (440) | Max (1440) | `clamp()` |
|-------|-----------|------------|-----------|
| `--mh-fs-eyebrow` | 24px | 24px | `clamp(1.5rem, 1.5rem, 1.5rem)` (static) |
| `--mh-fs-headline-serif` | 64px | 80px | `clamp(4rem, calc(1.6vw + 3.56rem), 5rem)` |
| `--mh-fs-headline-script` | 70px | 96px | `clamp(4.375rem, calc(2.6vw + 3.66rem), 6rem)` |
| `--mh-fs-body` | 14px | 15px | `clamp(0.875rem, calc(0.1vw + 0.84rem), 0.9375rem)` |
| `--mh-fs-authority-headline` | 32px | 42px | `clamp(2rem, calc(1.0vw + 1.725rem), 2.625rem)` |
| `--mh-fs-authority-body` | 14px | 20px | `clamp(0.875rem, calc(0.6vw + 0.71rem), 1.25rem)` |
| `--mh-fs-cta` | 16px | 20px | `clamp(1rem, calc(0.4vw + 0.89rem), 1.25rem)` |
| `--mh-fs-price-final` | 28px | 40px | `clamp(1.75rem, calc(1.2vw + 1.42rem), 2.5rem)` |
| `--mh-fs-price-compare` | 16px | 22px | `clamp(1rem, calc(0.6vw + 0.835rem), 1.375rem)` |
| `--mh-fs-value-label` | 11px | 13px | `clamp(0.6875rem, calc(0.2vw + 0.6325rem), 0.8125rem)` |
| `--mh-fs-value-value` | 16px | 20px | `clamp(1rem, calc(0.4vw + 0.89rem), 1.25rem)` |

Line-height tokens (`--mh-lh-tight: 1.05`, `--mh-lh-snug: 1.2`, `--mh-lh-normal: 1.5`) attached to corresponding headlines/body.

Letter-spacing tokens (`--mh-ls-eyebrow: 0.18em`, `--mh-ls-tight: -0.01em`).

---

## Implementation Detail

### `sections/methylation-hero.liquid`

Structure:
```
<section class="methylation-hero color-{{ section.settings.color_scheme }}"
         style="--padding-top:{{...}}; --padding-bottom:{{...}};"
         {{ section.shopify_attributes }}>
  <div class="methylation-hero__inner">
    {% render 'methylation-hero-image-stack', section: section %}
    <div class="methylation-hero__right">
      {% render 'methylation-hero-product-copy', section: section %}
      <div class="methylation-hero__authority">
        {% for block in section.blocks %}
          {% case block.type %}
            {% when 'authority_headline' %}<h3>…</h3>
            {% when 'authority_body' %}<div>…</div>
            {% when 'authority_feature' %}{% render 'methylation-hero-feature', block: block %}
            {% when 'authority_cta' %}<a>…</a>
          {% endcase %}
        {% endfor %}
      </div>
    </div>
  </div>
</section>
```

Each block wrapper includes `{{ block.shopify_attributes }}` so the Theme Editor can target it.

### Image-stack snippet
- Iterates only `block.type == 'image'`
- Renders **one** wrapper that contains a `<carousel-swiper>` custom element
- Marks first image with `loading="eager" fetchpriority="high"`, remaining `loading="lazy"`
- CSS toggles whether the wrapper renders as grid (≥1024) or swiper (<1024) via `display` on inner `.methylation-hero__images--grid` vs `.methylation-hero__images--swiper` shells; the same image markup is teleported via CSS Grid placement, not duplicated in DOM.

If CSS-only proves insufficient, snippet emits both wrappers with identical content; the unused one is `display:none`. DOM duplication penalty: 5 extra `<img>` tags — acceptable for fewer than 5KB of HTML, browsers will dedupe image requests.

### Product-copy snippet
- Iterates `section.blocks` and renders content blocks in their declared theme-editor order via a `case` switch (eyebrow, headline_serif, headline_script, tagline, body, value_card, price, cta)
- Value cards collected into an array then rendered in a `tw-grid tw-grid-cols-3 md:tw-grid-cols-3` flex row
- Price rendered with compare-at as `<s>`, final as primary text

### SCSS (`scss/sections/methylation-hero.scss`)
- Imports tokens: `@import '../components/methylation-hero-tokens';`
- `.methylation-hero` block:
  - padding consumes `var(--padding-top)` / `var(--padding-bottom)` (set inline by Liquid)
  - background uses `var(--mh-color-surface)`
  - container `tw-max-w-[1440px] tw-mx-auto`
- `.methylation-hero__inner` — CSS grid; 1-col mobile, 2-col ≥1024 (`@media (min-width: 1024px)`)
- `.methylation-hero__images--grid` — `display: none` <1024, `display: grid` ≥1024 (1 hero + 2×2)
- `.methylation-hero__images--swiper` — `display: block` <1024, `display: none` ≥1024
- `.methylation-hero__eyebrow` — `font: 500 var(--mh-fs-eyebrow) / var(--mh-lh-normal) var(--mh-font-accent); letter-spacing: var(--mh-ls-eyebrow); color: var(--mh-color-red); text-transform: uppercase;`
- `.methylation-hero__headline-serif` — `font: 700 var(--mh-fs-headline-serif) / var(--mh-lh-tight) var(--mh-font-display); color: var(--mh-color-navy); text-transform: uppercase;`
- `.methylation-hero__headline-script` — `font: 400 var(--mh-fs-headline-script) / var(--mh-lh-tight) var(--mh-font-script); color: var(--mh-color-gold);`
- `.methylation-hero__cta` — pill, `var(--mh-color-red)` background, `var(--mh-color-on-navy)` text, hover darken via `filter: brightness(0.92)`
- `.methylation-hero__authority` — `var(--mh-color-navy)` background, `var(--mh-color-on-navy)` text, `var(--mh-radius-lg)` corners, padding scaled from token

Tailwind utility classes used for layout primitives (`tw-grid`, `tw-flex`, `tw-gap-*`, `tw-items-*`). All typography/color from CSS vars — no `tw-text-[]` arbitrary values for the canonical brand styles.

### TS (only if needed)
File: `ts/sections/methylation-hero.ts`
```
import { CarouselSwiper } from 'TsComponents/carousel-swiper';
// init/destroy via matchMedia('(min-width: 1024px)') if pure-CSS swap glitches
```
Only created after dev validation that observer-mode Swiper renders correctly when toggled via display.

### Font loading
- Oswald, Inter, Montserrat, Allison loaded via Shopify's `font_picker`? **No** — these are fixed brand fonts. Load via `<link rel="preconnect">` + `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Allison&family=Inter:wght@400;500;700&family=Montserrat:wght@500;600&display=swap">` in `layout/theme.liquid` (or via existing global font manifest). Document this requirement in handoff.
- All `font-family` declarations include fallbacks in the token file (`'Oswald', sans-serif` etc.) so missing webfont still renders system-readable text.
- `font-display: swap` to avoid FOIT.

### Accessibility
- `<section aria-labelledby="methylation-hero-heading">` with `id` on serif headline (`h1` on this page, since it's the page hero — confirm with template; otherwise `h2`)
- All images `alt` from block setting, fallback empty string when decorative
- Swiper: pagination dots are `<button>` with `aria-label="Go to slide N"` (Swiper provides this when `pagination: { clickable: true, renderBullet: … }`)
- CTA `<a>` has visible focus ring (`:focus-visible`)
- Color contrast: red CTA on white ≥ 4.5:1 (verified), navy authority box white text ≥ 12:1
- Reduced motion: Swiper autoplay disabled when `prefers-reduced-motion: reduce` (custom element should already handle; document as test scenario)

---

## Technical Tradeoffs

| Decision | Alternative | Why chosen | Downside |
|----------|-------------|------------|----------|
| Block-driven schema (granular block types) | Single block "content_block" with rich settings | Maps cleanly to design's repeating units (value cards × 3, authority features × 5, images × 5). Allows reorder and selective omission. | Schema becomes long; theme editor sidebar has many "Add block" options |
| Section-scoped CSS vars (`.methylation-hero {}`) | `:root` vars | Prevents leak to other sections / pages reusing the same token names | Slightly higher specificity; vars must be explicitly inherited by nested elements (CSS inheritance handles this automatically) |
| Fluid `clamp()` typography | Discrete media-query font-size jumps | Smooth scale across 440→1440 viewport range; eliminates "snap" at md breakpoint | Slightly harder to reason about specific intermediate sizes; QA must check several widths |
| Hybrid CSS-swap for grid↔swiper | Always-Swiper (mobile + desktop) | Desktop design is a static 2×2 grid, not a slider — Swiper would add unused JS weight to desktop | DOM may emit both wrappers; up to 5 extra hidden `<img>` tags (mitigated by lazy load + browser dedupe) |
| Reuse existing `<carousel-swiper>` component | New section-specific Swiper init | Already registered globally; no extra bundle weight; consistent UX with other carousels | Constrained by existing component API; section can't easily add bespoke Swiper modules |
| Snippet per repeating component (value-card, feature, image-card via image-stack) | Inline markup in section | Encapsulation, easier independent edits, matches reference memory pattern for repeating cards | More files; small render overhead (negligible) |
| Tokens file separate from section SCSS | Tokens inline in section SCSS | Tokens can be `@import`ed by other future sections needing the same brand palette; centralizes color/font decisions | Two-file lookup when reading styles |
| Plain `<a>` CTA (no AJAX) | Add-to-cart fetch | Design shows no cart drawer / inline confirmation. Link to bundle PDP keeps merch flexibility. | Cannot one-click add to cart |
| Google Fonts via `<link>` in theme.liquid | Self-hosted font files in `assets/` | Faster setup; Google CDN cache widely shared | External request; subject to network; recommend swapping to self-hosted before launch |

---

## Constraints & Assumptions

### Constraints
- Tailwind classes must be prefixed `tw-` (project config)
- SCSS section file globbed from `scss/sections/` by webpack
- CSS tokens MUST NOT use `:root` — required scope is `.methylation-hero {}`
- All `methylation-hero.scss` rules consume CSS vars only — zero raw hex / px (review gate)
- Use existing breakpoints: `small` 390, `md-small` 768, `md` 1024, `lg` 1280, `2xl` 1550
- Reuse `<carousel-swiper>` from `ts/components/carousel-swiper.ts` — do not introduce a second Swiper init
- Swiper version 12.1.2 (confirm in `package.json` — pinned by existing component)

### Assumptions
- Brand fonts (Oswald, Allison, Inter, Montserrat) are either loaded globally in `layout/theme.liquid` or will be added there before launch. If not present, the section ships with system fallbacks (graceful degradation).
- The section is used on a single landing template; section schema does NOT need `presets` for multiple templates but a single preset entry is included for editor "Add section" flow.
- Authority box appears below product copy on both desktop and mobile (per approved plan); no design variant shows it elsewhere.
- Image block limit of 5 matches design's hero+grid+swiper exactly; merchant adding a 6th will be blocked by `max_blocks` per-type (we'll set `"max_blocks": 17` on section and rely on per-type limits enforced in Liquid).
- CTA primary action navigates to bundle PDP / collection — not a cart drawer trigger.
- No analytics/event emission required at this phase; can be added later via `data-cta="methylation-hero"` attribute.

---

## Reference Patterns

- **Block-iteration order via `case`/`when` switch** — standard Shopify section pattern; preserves merchant reorder semantics
- **CSS-var-scoped section tokens** — prevents global namespace pollution; established Horizon project pattern
- **Reuse `<carousel-swiper>` custom element** — registered globally; section consumes by markup only
- **Snippet-per-repeating-component** — `methylation-hero-value-card`, `methylation-hero-feature` follow same convention as product-card / collection-card snippets elsewhere in the theme
