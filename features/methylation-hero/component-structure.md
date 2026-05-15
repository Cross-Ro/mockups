# Component Structure — MethylationHero

## DOM Shape

```
<div class="methylation-hero-section-wrapper">                 <!-- Shopify section wrapper -->
  <section.methylation-hero.color-{scheme}                     -- section el, aria-labelledby="methylation-hero-heading"
    style="--padding-top:Npx; --padding-bottom:Npx"
    {{ section.shopify_attributes }}
  >
    <style>@media (min-width:1024px) { ... desktop padding override ... }</style>

    <div.methylation-hero__inner>                              -- CSS grid; 1-col mobile, 2-col ≥1024

      <!-- Left column: image stack snippet -->
      <div.methylation-hero__images>

        <!-- Desktop grid (display:none on mobile) -->
        <div.methylation-hero__images--grid aria-hidden="false">
          <div.methylation-hero__image-wrap.methylation-hero__image-wrap--hero
            {{ block.shopify_attributes }}                      -- first image block
          >
            <img class="methylation-hero__image" loading="eager" fetchpriority="high" ... />
          </div>
          <div.methylation-hero__image-grid-layout>            -- 2×2 CSS grid, only if image_count > 1
            <div.methylation-hero__image-wrap.--thumb ...>     -- images 2–5 (lazy)
              <img ... />
            </div>
          </div>
        </div>

        <!-- Mobile swiper (display:none ≥1024) -->
        <div.methylation-hero__images--swiper aria-hidden="true">
          <carousel-swiper>
            <script type="application/json">{ swiper config }</script>
            <div.swiper>
              <div.swiper-wrapper>
                <div.swiper-slide>
                  <div.methylation-hero__image-wrap.--swiper>
                    <img ... />
                  </div>
                </div>
                <!-- repeat per image block -->
              </div>
              <div.methylation-hero__swiper-pagination.swiper-pagination />  -- omitted if 1 image
            </div>
          </carousel-swiper>
        </div>

      </div>

      <!-- Right column -->
      <div.methylation-hero__right>

        <!-- Product copy snippet -->
        <div.methylation-hero__copy>
          <p.methylation-hero__eyebrow {{ block.shopify_attributes }} />
          <h1#methylation-hero-heading.methylation-hero__headline-serif {{ block.shopify_attributes }} />
          <p.methylation-hero__headline-script {{ block.shopify_attributes }} />
          <div.methylation-hero__tagline {{ block.shopify_attributes }} />       -- richtext
          <div.methylation-hero__body {{ block.shopify_attributes }} />          -- richtext

          <div.methylation-hero__value-cards.tw-grid.tw-grid-cols-3.tw-gap-4>
            <!-- methylation-hero-value-card snippet × up to 3 -->
            <div.methylation-hero__value-card[.--accented]
              style="--mh-card-accent: #hex"
              {{ block.shopify_attributes }}
            >
              <img.methylation-hero__value-card-icon ... />
              <div.methylation-hero__value-card-accent-bar />  -- only if accent set
              <p.methylation-hero__value-card-label />
              <p.methylation-hero__value-card-value />
            </div>
          </div>

          <div.methylation-hero__price {{ block.shopify_attributes }}>
            <s.methylation-hero__price-compare />
            <span.methylation-hero__price-final />
            <span.methylation-hero__price-save />               -- omitted if no save_label
          </div>

          <a.methylation-hero__cta
            data-cta="methylation-hero"
            {{ block.shopify_attributes }}
          />
        </div>

        <!-- Authority box -->
        <div.methylation-hero__authority>
          <h2.methylation-hero__authority-headline {{ block.shopify_attributes }} />
          <div.methylation-hero__authority-body {{ block.shopify_attributes }} />  -- richtext

          <div.methylation-hero__features>
            <!-- methylation-hero-feature snippet × up to 5 -->
            <div.methylation-hero__feature {{ block.shopify_attributes }}>
              <img.methylation-hero__feature-icon />
              <div.methylation-hero__feature-text>
                <span.methylation-hero__feature-line-1 />
                <span.methylation-hero__feature-line-2 />
              </div>
            </div>
          </div>

          <a.methylation-hero__authority-cta
            data-cta="methylation-hero-authority"
            {{ block.shopify_attributes }}
          />
        </div>

      </div>
    </div>
  </section>
</div>
```

---

## Data-State Attributes

No JS-driven `data-state` attributes are needed for this component. All visibility logic is Liquid.

The `<carousel-swiper>` custom element manages internal Swiper state autonomously.

| Attribute | Element | Values | Purpose |
|-----------|---------|--------|---------|
| `data-cta` | `.methylation-hero__cta` | `"methylation-hero"` | Analytics hook for primary CTA |
| `data-cta` | `.methylation-hero__authority-cta` | `"methylation-hero-authority"` | Analytics hook for authority CTA |
| `aria-hidden` | `.methylation-hero__images--grid` | `"false"` | Grid visible to AT on desktop |
| `aria-hidden` | `.methylation-hero__images--swiper` | `"true"` | Swiper wrapper hidden from AT (Swiper a11y handles slides) |

---

## Liquid Variables / Schema Settings

### Section settings

| Variable | Source | Usage |
|----------|--------|-------|
| `section.settings.color_scheme` | Schema `color_scheme` | CSS color class on `<section>` |
| `section.settings.container_padding_top` | Schema range | `--padding-top` var (desktop, via `<style>` block) |
| `section.settings.container_padding_bottom` | Schema range | `--padding-bottom` var (desktop) |
| `section.settings.container_padding_top_mobile` | Schema range | `--padding-top` var (inline, mobile) |
| `section.settings.container_padding_bottom_mobile` | Schema range | `--padding-bottom` var (inline, mobile) |
| `section.settings.mobile_image_loop` | Schema checkbox | Swiper `loop` config JSON |
| `section.settings.mobile_image_autoplay` | Schema checkbox | Swiper `autoplay` config JSON |
| `section.settings.mobile_image_autoplay_delay` | Schema range | Swiper autoplay `delay` ms |

### Block settings (by type)

| Block type | Setting | Variable used |
|------------|---------|---------------|
| `image` | `image` | `block.settings.image` |
| `image` | `alt` | `block.settings.alt` (fallback for image.alt) |
| `image` | `link` | `block.settings.link` (reserved; not wired to click yet) |
| `eyebrow` | `text` | `block.settings.text` |
| `headline_serif` | `text` | `block.settings.text` |
| `headline_script` | `text` | `block.settings.text` |
| `tagline` | `text` | `block.settings.text` (richtext) |
| `body` | `text` | `block.settings.text` (richtext) |
| `value_card` | `icon`, `label`, `value`, `accent` | `block.settings.*` |
| `price` | `compare_at`, `final`, `save_label` | `block.settings.*` |
| `cta` | `label`, `link` | `block.settings.*` |
| `authority_headline` | `text` | `block.settings.text` |
| `authority_body` | `text` | `block.settings.text` (richtext) |
| `authority_feature` | `icon`, `line_1`, `line_2` | `block.settings.*` |
| `authority_cta` | `label`, `link` | `block.settings.*` |

---

## CSS Custom Properties Used

All declared in `scss/components/methylation-hero-tokens.scss` scoped under `.methylation-hero {}`.

| Property | Figma source |
|----------|-------------|
| `--mh-font-display` | Oswald — display headlines |
| `--mh-font-script` | Allison — script accent |
| `--mh-font-body` | Inter — body/authority |
| `--mh-font-accent` | Montserrat — eyebrow/labels/CTA |
| `--mh-color-red` | `#d2242a` — CTA, price accent |
| `--mh-color-navy` | `#152f4f` — headlines, authority bg |
| `--mh-color-gold` | `#c99b65` — script headline, value accents |
| `--mh-color-body` | `#1f2937` — body text |
| `--mh-color-muted` | `#6b7280` — compare-at, secondary |
| `--mh-color-surface` | `#ffffff` — section background |
| `--mh-color-on-navy` | `#ffffff` — text on navy |
| `--mh-space-section` | clamp spacing — section-level gaps |
| `--mh-space-col-gap` | clamp — desktop column gap |
| `--mh-space-stack-sm/md/lg` | 0.5/1/1.5rem — vertical rhythm |
| `--mh-radius-sm/md/lg/pill` | 0.5/0.75/1rem/999px — corners |
| `--mh-fs-eyebrow` | 24px static |
| `--mh-fs-headline-serif` | clamp(4rem … 5rem) |
| `--mh-fs-headline-script` | clamp(4.375rem … 6rem) |
| `--mh-fs-body` | clamp(0.875rem … 0.9375rem) |
| `--mh-fs-authority-headline` | clamp(2rem … 2.625rem) |
| `--mh-fs-authority-body` | clamp(0.875rem … 1.25rem) |
| `--mh-fs-cta` | clamp(1rem … 1.25rem) |
| `--mh-fs-price-final` | clamp(1.75rem … 2.5rem) |
| `--mh-fs-price-compare` | clamp(1rem … 1.375rem) |
| `--mh-fs-value-label` | clamp(0.6875rem … 0.8125rem) |
| `--mh-fs-value-value` | clamp(1rem … 1.25rem) |
| `--mh-lh-tight/snug/normal` | 1.05 / 1.2 / 1.5 |
| `--mh-ls-eyebrow` | 0.18em |
| `--mh-ls-tight` | -0.01em |
| `--padding-top` | Set inline by Liquid from section setting |
| `--padding-bottom` | Set inline by Liquid from section setting |
| `--mh-card-accent` | Per-block color picker — value card border/bar |

---

## Figma Variants Implemented

| Figma variant / node | Implementation |
|---------------------|----------------|
| Desktop 2-col layout (node 12071:3782) | CSS grid `grid-template-columns: 700px minmax(0,1fr)` at ≥1024px |
| Mobile image stack (node 12071:4252) | `<carousel-swiper>` swiper, `slidesPerView:1.1`, peek edge |
| Mobile product copy (node 12071:4258) | Single-column stack via flex-direction column |
| Hero image — eager load | `loading="eager" fetchpriority="high"` on first `<img>` |
| Supporting 2×2 image grid | `.methylation-hero__image-grid-layout` — CSS grid 2 cols |
| Value cards row | 3-col CSS grid `.methylation-hero__value-cards` |
| Price (compare-at strikethrough + final) | `<s>` + `<span>` in `.methylation-hero__price` |
| Authority box (navy bg, white text) | `.methylation-hero__authority` — CSS vars |
| Primary CTA pill | `.methylation-hero__cta` — border-radius pill, red bg |
| Authority CTA pill (white on navy) | `.methylation-hero__authority-cta` |
| Hover darkening on CTAs | CSS `filter: brightness(0.92)` — no JS |
| Swiper pagination dots | `.swiper-pagination` inside `<carousel-swiper>` |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables transitions |

---

## Figma Variants NOT Implemented

| Variant | Reason |
|---------|--------|
| Image link behavior | `block.settings.link` is captured in schema but wrapping `<a>` around image not wired — no click behavior in design spec; TS Agent can add if needed |
| Swiper navigation arrows | Not in mobile design spec; `<carousel-swiper>` supports it via `navigation: true` config if needed |

---

## TS Handoff Notes

No TypeScript is required for this section as shipped. The `<carousel-swiper>` custom element registered in `ts/sections/global.ts` handles all swiper behavior autonomously via JSON config.

**If visual bugs appear with CSS-only grid/swiper swap:**
Add `ts/sections/methylation-hero.ts` that listens to `matchMedia('(min-width: 1024px)')` and calls `swiper.destroy()` / reinit on the `<carousel-swiper>` instance when breakpoint changes. The element ref is `document.querySelector('.methylation-hero__images--swiper carousel-swiper')`.

**Analytics / event tracking (future):**
Both CTAs carry `data-cta` attributes:
- `.methylation-hero__cta` → `data-cta="methylation-hero"`
- `.methylation-hero__authority-cta` → `data-cta="methylation-hero-authority"`

A global click listener on `[data-cta]` can push events without modifying section markup.

**Font loading prerequisite:**
The following fonts must be loaded in `layout/theme.liquid` (or via the existing `snippets/fonts.liquid`) before this section renders correctly:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Allison&family=Inter:wght@400;500;700&family=Montserrat:wght@500;600&display=swap">
```
Without these, system fallbacks render (`sans-serif`, `cursive`) which is gracefully degraded but visually incorrect.

---

## Token Additions

No new tokens added to `tailwind.config.js`. All brand-specific tokens are scoped CSS custom properties in `scss/components/methylation-hero-tokens.scss`. The section uses standard Tailwind utility classes with the `tw-` prefix for layout primitives only (`tw-grid`, `tw-grid-cols-3`, `tw-gap-4`).

---

## Questions

None. All ambiguous points resolved per brief and reference patterns.
