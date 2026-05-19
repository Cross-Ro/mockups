# Feature Brief — Bundle Section

## What & Why

**Feature name:** `bundle` — a merchant-configurable Shopify theme section that surfaces a 5-product bundle and adds all 5 first-available variants to the cart in one click. A Shopify Function (`bundle-discount`, DiscountAutomaticNode `gid://shopify/DiscountAutomaticNode/1444340564226`) applies a productDiscount when all listed products are present in the cart.

**Purpose:** Give merchants a drop-in section to promote the 5-product bundle anywhere on the storefront. The theme is responsible for *presenting* the bundle and *adding the variants*; it is **not** responsible for applying the discount. Discount is enforced server-side by the function reading metafield `$app:config` / `bundle` (JSON: `{ bundleId, productIds[], percentage }`).

**Figma:** None — text spec only.

---

## Architecture Decisions

### Liquid type — Section
- **Decision:** Standalone section file at `sections/bundle.liquid`.
- **Reasoning:** Merchant must place it on any page via theme editor and configure 5 product pickers + headline + percentage text. Sections are the only Liquid type that exposes editor settings UI to merchants.
- **Alternative considered:** Theme app extension app-block. Rejected — bundle data lives in theme settings, not in the discount app. Section is simpler and the function reads metafields independently of the theme.

### Component boundaries
- `sections/bundle.liquid` — section file, owns layout, schema, the `<bundle-cta-component>` wrapper element with `data-variants` and `data-bundle-id` attributes.
- `snippets/bundle-product-card.liquid` — single product card snippet (image, title, price). One snippet rendered 5x in a loop. Keeps section file focused on layout + CTA; isolates card markup for reuse and testing.
- **Do NOT reuse `snippets/product-card.liquid`** — that snippet expects card block context (`block` param, gap settings, badges, color schemes). Overkill and entangled. Bundle card is minimal: image, title, formatted price. Add as new dedicated snippet.

### Shared components to reuse
- `TsComponents/bundle-cta-component.ts` — **already exists and already registered globally** in `ts/sections/global.ts`. Reads `data-variants` (JSON array of variant IDs) and `data-bundle-id`, POSTs `/cart/add.js`, then `/cart/update.js` with `attributes.bundle_id`, dispatches `cart:updated` and looks for `[data-cart-drawer]` to dispatch `cart:open`. **See "Drift with theme cart events" tradeoff below — this component dispatches non-standard event names and must be reconciled before shipping.**
- `snippets/image.liquid` — for responsive product image rendering.
- `snippets/format-price.liquid` — for price formatting consistent with rest of theme.

### Output files
- New: `sections/bundle.liquid`
- New: `snippets/bundle-product-card.liquid`
- Modify: `ts/components/bundle-cta-component.ts` (see tradeoff: align with `ThemeEvents.cartUpdate` / `CartAddEvent`)
- **No new file in `ts/sections/`** — section needs no per-section JS. The web component is shared and already loaded via `global.js`.
- **No new file in `scss/sections/`** unless layout requires it. Prefer inline `{% stylesheet %}` block in `sections/bundle.liquid` matching the pattern used by `featured-product.liquid`. Only promote to `scss/sections/bundle.scss` if styles exceed ~80 lines.

---

## Data

### Section settings (merchant-configurable)
```
product_1, product_2, product_3, product_4, product_5  →  type: product
headline                                                →  type: text
percentage_display                                      →  type: text (informational, e.g. "Save 20%")
color_scheme                                            →  type: color_scheme (follow theme convention)
padding-block-start, padding-block-end                  →  type: range (follow featured-product.liquid pattern)
```

### Data read at render
- `section.settings.product_1..5` — Liquid `product` objects. From each: `.title`, `.featured_media`, `.price`, `.url`, `.selected_or_first_available_variant.id` (used to build the `data-variants` JSON for the CTA).
- `section.settings.headline` — string.
- `section.settings.percentage_display` — string. **Not** the source of truth for the discount; purely a label.

### Data NOT read by theme
- The discount metafield (`$app:config / bundle`) is read by the Shopify Function only. Theme does **not** read it. This is the drift gotcha (documented below).

### Cart attribute written
- `cart.attributes.bundle_id` — set to the value of section setting (or fallback string `'hero-bundle'` as in existing component default). Useful for analytics; does not affect discount eligibility.

---

## Behaviour

### States
The CTA button transitions through:
| State | `data-state` (suggested) | Trigger |
|---|---|---|
| idle | `idle` | initial render |
| busy | `busy` | click → during `/cart/add.js` + `/cart/update.js` POSTs |
| error | `error` | non-2xx response or thrown error |
| idle (after success) | `idle` | both POSTs succeeded; component dispatches cart events |

Currently the existing component uses only `button.disabled` to indicate busy. Brief recommends adding `data-state` attribute on the host element for CSS-driven loading/error UI. This is a small enhancement to the existing component — implementer should add it.

Section-level states:
- **Missing product picker(s)** — if fewer than 5 product settings are filled OR any selected product has no available variant, render an editor-only warning placeholder (`{% if request.design_mode %}`) and disable the CTA button (`disabled`, `aria-disabled="true"`). Storefront visitors see whatever cards are configured but the CTA is inert.
- **All 5 configured and available** — CTA enabled, cards render normally.

### JS events emitted
- `cart:updated` (CustomEvent, current behaviour) — `{ detail: { source: 'bundle-cta', bundleId } }`.
- `cart:open` — dispatched on `[data-cart-drawer]` element.
- `bundle-cta:error` (CustomEvent, bubbles) — `{ detail: { message } }`.

**Recommended change** (see tradeoff): also dispatch theme-standard `CartAddEvent` (event name `cart:update`) so the existing `cart-drawer-component` auto-opens without needing a custom `[data-cart-drawer]` selector.

### JS events listened to
None at the section level. Cart removal flows do not require theme work — the Shopify Function re-evaluates on every cart change.

### API calls
1. `POST /cart/add.js` with payload:
   ```json
   { "items": [{ "id": <variantId>, "quantity": 1 }, ...5 items] }
   ```
   Atomic — if any line item fails to add, Shopify rejects the whole request.
2. `POST /cart/update.js` with payload:
   ```json
   { "attributes": { "bundle_id": "<id>" } }
   ```
3. (Recommended) `GET /cart.js?sections=cart-drawer,cart-icon-bubble` to refresh cart sections matching theme pattern (see `assets/product-form.js` lines 385–479). This would let the existing `cart-drawer-component` re-render via section rendering API.

### Responsive strategy
- **CSS-only.** No DOM duplication. 1-column stack on mobile (< 750px), 5-column grid on desktop (≥ 750px). Use CSS grid with `grid-template-columns: repeat(5, 1fr)` desktop, `1fr` mobile. Follow `featured-product.liquid` breakpoint `750px`.
- CTA button: full-width on mobile, max-width 320px centered on desktop. Below the grid on both.

---

## Implementation Detail

### `sections/bundle.liquid`
- Capture an array of 5 products by iterating `(1..5)` and looking up `section.settings.product_[i]`.
- Build the `data-variants` JSON via a Liquid loop assembling `selected_or_first_available_variant.id` per product, then output through `| json` filter.
- Wrapper element: `<bundle-cta-component data-variants='{{ variant_ids | json }}' data-bundle-id="{{ section.id }}">`
- Inside the wrapper: grid `<ul>` of 5 `<li>` cards (rendered via `bundle-product-card` snippet), then `<button type="button">{{ section.settings.cta_label | default: 'Add bundle to cart' }}</button>`.
- Inline `{% stylesheet %}` block for grid + responsive layout. Match existing pattern from `featured-product.liquid`.
- Schema: see Section settings above.

### `snippets/bundle-product-card.liquid`
- Doc header (`{% doc %}`) declaring `@param {object} product`.
- Renders: image via `{% render 'image', image: product.featured_media.preview_image, ... %}`, title `{{ product.title }}` wrapped in `<a href="{{ product.url }}">`, price via `{% render 'format-price', price: product.price %}`.
- No interactivity inside the card. Click on card title/image navigates to PDP (anchor only).

### `ts/components/bundle-cta-component.ts` (modifications)
- **Import** `CartAddEvent`, `CartErrorEvent`, `ThemeEvents` from `@theme/events` (or via global, as TS bundle is per-section — check Babel module resolution to see if assets/events.js is accessible from ts/. If not, dispatch the event manually using `ThemeEvents.cartUpdate` literal `'cart:update'`).
- After successful POST, fetch `/cart.js?sections=cart-drawer,cart-icon-bubble` and dispatch `CartAddEvent` with `sections` map so cart drawer re-renders.
- Add `data-state` attribute lifecycle: `idle` → `busy` (on click) → `idle` or `error`.
- Keep existing `cart:updated` and `bundle-cta:error` events for backward compatibility (unused today, no consumers, but cheap to keep).
- `init()` / `connectedCallback` responsibilities: attach click listener.
- `destroy()` / `disconnectedCallback` responsibilities: remove click listener.

### SCSS
- Inline `{% stylesheet %}` in section file. Tokens: use theme custom properties (`var(--color-foreground)`, `var(--gap)`) — match existing sections, not Tailwind. **Do not use `tw-` Tailwind classes here** unless a clear precedent exists in another section. Horizon sections use native CSS + custom properties.
- Responsive: single breakpoint at `750px` matching `featured-product.liquid`.

---

## Technical Tradeoffs

### 1. Use existing `bundle-cta-component.ts` vs write new
- **Decision:** Reuse and enhance the existing component.
- **Alternative:** Write a fresh component scoped to this section.
- **Why:** Component already does 90% of the work (parses variants, atomic add, cart attribute write, error event). Already globally registered. Throwing it away and rewriting violates DRY.
- **Downside:** Component's current event dispatch is non-standard (see tradeoff 2). Implementer must reconcile.

### 2. Drift with theme cart events (CRITICAL)
- **Current state:** Existing `bundle-cta-component` dispatches a custom `cart:updated` event and looks for `[data-cart-drawer]` to dispatch `cart:open`. Theme's actual cart drawer is `<cart-drawer-component>` which listens for `CartAddEvent` (event name `'cart:update'`, not `'cart:updated'`) and auto-opens via `auto-open` attribute. Selector `[data-cart-drawer]` does not exist in the theme.
- **Decision:** Update the component to dispatch `CartAddEvent`-shaped event with name `'cart:update'` and fetch cart sections for rendering API. Keep `bundleId` in the `data.source` field.
- **Alternative considered:** Add `[data-cart-drawer]` to the existing drawer element. Rejected — diverges from theme conventions; future theme updates will overwrite.
- **Downside:** Slight scope creep into shared component, but necessary for cart drawer to open at all.

### 3. Section schema vs blocks for cards
- **Decision:** 5 fixed `product` settings on the section. No blocks.
- **Alternative:** Theme block `bundle_card` repeated 5x.
- **Why:** Bundle is exactly 5 products by contract with the Shopify Function. Blocks invite merchants to add 6 or remove to 3, which would silently break discount eligibility. Fixed slots make the constraint visible in the editor.
- **Downside:** If business later wants variable-length bundles, this becomes a refactor.

### 4. Section JS entry vs reusing global registration
- **Decision:** No `ts/sections/bundle.ts` file. The web component is already registered in `global.ts`.
- **Alternative:** Per-section bundle that registers the component on demand.
- **Why:** Avoids duplicate webpack bundle for a component that ships in `global.js` regardless. Section is JS-free at the section-entry level.
- **Downside:** None. Section ships zero new JS bytes for repeat page views.

### 5. CSS-only responsive vs DOM duplication
- **Decision:** CSS grid breakpoint.
- **Alternative:** Two markup blocks (desktop + mobile) with `display: none`.
- **Why:** 5 cards are identical structure on both breakpoints; only column count changes. CSS handles cleanly.

### 6. Inline stylesheet vs `scss/sections/bundle.scss`
- **Decision:** Inline `{% stylesheet %}` in the section file.
- **Alternative:** Dedicated SCSS entry compiled to `assets/bundle.css`.
- **Why:** Matches `featured-product.liquid` pattern. Styles are minimal (grid + button). Avoids webpack rebuild and additional HTTP request.
- **Downside:** Loses Sass features. If styles grow > 80 lines, promote to `scss/sections/bundle.scss`.

### 7. Discount drift gotcha
- **Decision:** Document the constraint in section editor UI via schema `info` field on each product picker, e.g. `"info": "Must match the product configured in the bundle discount metafield"`.
- **Alternative:** Read the discount metafield from theme to render a warning if mismatched.
- **Why:** Theme cannot read shop-level metafields written by another app reliably. Documentation is the pragmatic mitigation.
- **Downside:** Merchant error possible; mismatched products = silent discount-less bundle. Must be called out in launch checklist and merchant-facing release notes.

---

## Constraints and Assumptions

### Constraints
- Bundle size is fixed at 5 products (function contract).
- Theme cannot read the discount metafield to verify alignment.
- All 5 products must be in cart for discount to apply; removing any line drops the discount automatically (function-side, no theme work).
- Variant choice is `selected_or_first_available_variant` only. No variant selector inside the bundle section.

### Assumptions
- Each bundled product has at least one available variant. If not, the CTA must be inert in storefront and warning shown in editor.
- Customers want all 5 products in their cart at quantity 1 each. (If business wants higher quantities, schema would need a per-product quantity field.)
- The merchant placing the section understands they must mirror the discount metafield's product list. Documented but not enforced.
- Horizon's `cart-drawer-component` is the canonical cart UI on the storefront. (Confirmed via `assets/cart-drawer.js`.)

### Drift Gotcha (READ BEFORE LAUNCH)
The Shopify Function reads its product allowlist from the discount metafield `$app:config / bundle`. The section reads its product list from `section.settings.product_1..5`. These two lists are **independent** — the theme cannot validate alignment. If the merchant picks different products in the section than what's in the metafield, customers will add the section's products to cart but the function will not see all the metafield-required products and will return no discount. **Document this in merchant-facing release notes and ideally pin a Notion / runbook entry.** Consider a follow-up: an app proxy / admin UI that writes both the section settings and the metafield from a single source of truth.

---

## Build Validation

- `yarn typecheck` — must pass after modifications to `bundle-cta-component.ts`.
- `yarn lint` — must pass.
- `yarn start` — webpack watch + theme dev; verify `assets/bundle.css` (only if SCSS entry created) and updated `assets/global.js` build successfully.
- `shopify-dev-mcp` theme validator — run against `sections/bundle.liquid` to confirm schema is valid.
- Responsive: test at 360px, 749px, 750px, 1024px, 1440px.
- Manual: add bundle to cart → cart drawer opens → all 5 lines present → discount line displays 20% off. Remove any line → discount disappears. Re-add removed product → discount returns.
