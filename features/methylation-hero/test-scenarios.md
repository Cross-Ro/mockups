# Methylation Hero — Test Scenarios

All scenarios runnable via Playwright against `yarn start` dev server. Use `playwright-mcp` for screenshot diffs; use `playwright` for interaction flows.

---

## Viewport Sweep

Visit landing template, capture screenshot + assert layout at each width. No horizontal scroll at any breakpoint.

| Width | Expected layout |
|-------|-----------------|
| 360px | Single column, swiper visible, swiper pagination dots visible, authority box full-width below copy |
| 390px (`small`) | Same as 360; verify font tokens hit `clamp()` minimums |
| 440px (Figma mobile baseline) | Image swiper matches Figma mobile node `12071:4252`, product copy column matches `12071:4258` |
| 768px (`md-small`) | Still single column (≤1023). Fluid font sizes scale upward from 440. Swiper still active. |
| 1024px (`md`) | **Layout swap.** Two-column grid appears. Image grid (1 hero + 2×2) replaces swiper. Authority box stays under product copy. |
| 1280px (`lg`) | 2-col fully expanded; gap matches Figma desktop node `12071:3782` |
| 1440px (Figma desktop baseline) | Pixel-accurate match for Figma desktop node |
| 1550px (`2xl`) | Max container width caps at 1440; centered with horizontal margins |

For each width:
- [ ] No horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`)
- [ ] Headline serif size matches token clamp() output
- [ ] Headline script size matches token clamp() output
- [ ] Eyebrow stays 24px across all widths

---

## Block Add / Remove / Reorder (Theme Editor)

Driven through Shopify theme editor (or by editing section JSON in templates and reloading).

- [ ] Add `image` block — appears in grid (desktop) and swiper (mobile)
- [ ] Add 5 `image` blocks — desktop renders 1 hero + 2×2; swiper has 5 slides + pagination
- [ ] Add only 1 `image` block — desktop hero fills, supporting grid hidden gracefully; swiper hides pagination
- [ ] Add 3 `image` blocks — desktop hero + 2 supporting (no empty cells or stretched layout)
- [ ] Remove `headline_script` block — gold script line disappears, no whitespace artifact
- [ ] Remove all `value_card` blocks — value-card row collapses, no empty container
- [ ] Reorder `value_card` blocks — order in DOM matches editor order
- [ ] Reorder `authority_feature` blocks — order updates in authority box
- [ ] Remove `cta` block — primary CTA disappears (price still visible)
- [ ] Remove `authority_cta` — authority box still renders without CTA
- [ ] Empty section (zero blocks) — no JS errors; section renders empty container; Theme Editor shows "Add block" prompt

---

## Swiper Interactions (Mobile <1024px)

- [ ] Swipe left / right advances slides
- [ ] Pagination dots clickable; active dot reflects current slide
- [ ] Arrow keys (when focused) navigate slides (if Swiper keyboard module enabled by existing component)
- [ ] Tap on slide image link (if `block.settings.link` set) navigates to URL
- [ ] Autoplay toggle in section settings starts/stops autoplay
- [ ] Autoplay delay setting honored (verify ~4000ms default)
- [ ] Loop setting on: last slide → first slide seamless
- [ ] Loop setting off: pagination next-arrow disabled on last slide
- [ ] Resize from 1100 → 800 → 500: swiper initializes and works without page reload
- [ ] Resize from 500 → 1100: swiper hidden, grid layout visible, no JS errors
- [ ] `prefers-reduced-motion: reduce` — autoplay disabled even if setting enabled

---

## Font Loading & Fallbacks

- [ ] Oswald loaded — serif headline renders condensed bold
- [ ] Allison loaded — script headline renders cursive
- [ ] Inter loaded — body + authority headline render correctly
- [ ] Montserrat loaded — eyebrow + value-card labels render
- [ ] Throttle network to "slow 3G" — `font-display: swap` shows fallback first, swaps without layout shift > 0.1 CLS
- [ ] Block Google Fonts CDN — fallback fonts render readable copy (no invisible text / FOIT)
- [ ] Font file 404 — graceful fallback to system stack, no console errors

---

## CTA Interactions

- [ ] Primary CTA click → navigates to `cta.block.settings.link` URL
- [ ] CTA with blank link → renders `href="#"` or omits href; no broken navigation
- [ ] Authority CTA click → navigates to `authority_cta.block.settings.link`
- [ ] Hover over CTA → `filter: brightness(0.92)` visible
- [ ] Focus CTA via Tab → visible focus ring (`:focus-visible`)
- [ ] CTA color contrast ≥ 4.5:1 against background (axe-core scan)
- [ ] Touch target ≥ 44×44px on mobile

---

## Image Lazy-Load & Performance

- [ ] First image (hero) emits `loading="eager"` + `fetchpriority="high"`
- [ ] Images 2–5 emit `loading="lazy"`
- [ ] `srcset` includes 700/1024/1440 widths for hero, 345/690 for grid thumbs
- [ ] No layout shift > 0.1 CLS on image load (explicit width/height attrs)
- [ ] Image `alt` populated from block setting; empty alt when decorative
- [ ] Largest Contentful Paint < 2.5s on simulated 4G (Lighthouse)
- [ ] Cumulative Layout Shift < 0.1
- [ ] Total Blocking Time < 200ms

---

## Data Edge Cases

- [ ] Very long serif headline (10+ words) — wraps without overflow at all widths
- [ ] Very long script headline — wraps gracefully (script font has wide glyphs)
- [ ] Very long value-card label — truncates with ellipsis OR wraps depending on design (confirm with Figma — assume wrap)
- [ ] Special characters in copy (`&`, `<`, `"`, em-dash) — escaped correctly, no HTML injection
- [ ] Richtext tagline with link — link clickable, styled with brand color
- [ ] Compare-at price missing — final price renders alone, no orphan `<s>` tag
- [ ] Authority feature with only line_1 (no line_2) — renders single line, no empty `<span>`
- [ ] Value card without icon — text-only card, no broken image icon
- [ ] All blocks present with very long content — page still scrolls cleanly

---

## Accessibility (axe-core run)

- [ ] No critical or serious axe violations on section
- [ ] Headlines form proper hierarchy (h1 → h2 → h3, no skipped levels)
- [ ] All interactive elements keyboard-reachable in logical tab order
- [ ] Swiper slides announced via `aria-live` (Swiper component default)
- [ ] Color contrast checks pass for all text/background pairs
- [ ] `prefers-reduced-motion` honored (no autoplay, instant slide transitions)
- [ ] Screen reader (VoiceOver) reads section landmark + headline + copy + CTA in order

---

## Theme Editor

- [ ] Section appears in "Add section" picker as "Methylation Hero"
- [ ] Default preset adds 1 hero image + 4 supporting + 1 eyebrow + 2 headlines + 1 tagline + 1 body + 3 value_cards + 1 price + 1 cta + 1 authority_headline + 1 authority_body + 5 authority_features + 1 authority_cta
- [ ] All block types selectable from "Add block" menu
- [ ] Block reorder via drag works
- [ ] Color scheme picker updates section colors live
- [ ] Padding range sliders update inline styles live
- [ ] Mobile autoplay toggle reflects in preview
- [ ] Section selection highlight box appears around `<section>` element

---

## CSS Variable Scope Validation

- [ ] DevTools inspection shows `--mh-*` vars only on `.methylation-hero` element and descendants — NOT on `:root` or `html`
- [ ] Two `methylation-hero` instances on same page (if allowed) do not leak vars between each other
- [ ] No other section's styles regress when `methylation-hero` is on the page

---

## Build & Lint

- [ ] `yarn typecheck` passes
- [ ] `yarn lint` passes
- [ ] `yarn start` produces `assets/methylation-hero.js` (only if TS entry created) and `assets/methylation-hero.css`
- [ ] No raw hex or px in compiled `methylation-hero.css` rules (grep check on `.methylation-hero__*` selectors — all values should reference `var(--mh-*)`)
