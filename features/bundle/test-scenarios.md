# Test Scenarios — Bundle Section

## Visual / State Scenarios

### S1 — Default render (all 5 products configured, all available)
- Section rendered with 5 product cards in a grid.
- Each card shows image, title, price.
- Headline displays above grid.
- "Save 20%" (or merchant-configured percentage label) visible.
- CTA button "Add bundle to cart" enabled.
- `data-state="idle"` on CTA.

### S2 — Editor: fewer than 5 products configured
- In theme editor (`request.design_mode`), warning banner visible: "Bundle requires 5 products."
- CTA button is disabled (`disabled`, `aria-disabled="true"`).
- Storefront view: cards render for whatever is configured; CTA inert.

### S3 — One configured product has no available variant (sold out, deleted, draft)
- Card for that product either hides or shows OOS state.
- CTA button disabled.
- Editor: warning surfaces product handle that's unavailable.

### S4 — Loading state during add-to-cart
- Click CTA → `data-state="busy"`, button shows loading indicator (spinner / disabled text).
- Subsequent clicks ignored (`this.busy` guard).

### S5 — Error response from `/cart/add.js`
- Simulate 422 (e.g. one product becomes unavailable between page load and click).
- `data-state="error"`, button re-enables, `bundle-cta:error` event dispatched.
- User-visible error message displayed near CTA.

### S6 — Success — drawer opens
- All 5 lines added.
- `CartAddEvent` (`cart:update`) dispatched with `sections` map.
- `cart-drawer-component` with `auto-open` attribute opens automatically.
- Cart bubble count increments by 5.

---

## Discount Behaviour Scenarios

### D1 — Fresh cart + add bundle → 20% discount applies
- Empty cart, click CTA, drawer opens with 5 lines.
- Discount line in cart summary shows -20% on bundle items.
- Subtotal reflects discount.

### D2 — Remove one line → discount drops
- After D1, remove any one of the 5 bundle lines.
- Function re-evaluates, returns no discount.
- Cart summary updates: discount line disappears.

### D3 — Re-add the removed product manually → discount returns
- After D2, navigate to the removed product PDP and add to cart manually.
- Function detects all 5 productIds present, re-applies 20% discount.

### D4 — Add unrelated product alongside bundle
- After D1, add a 6th non-bundle product.
- Discount remains on the 5 bundle lines. Unrelated line is not discounted.

### D5 — Drift gotcha simulation
- Merchant configures section with products A, B, C, D, E.
- Discount metafield contains A, B, C, D, F (one mismatch).
- Click CTA → cart receives A, B, C, D, E.
- Function sees A, B, C, D present but not F → returns no discount.
- Result: customer paid full price for 5 items. Verifies why brief calls this out as critical risk.

---

## Data Edge Case Scenarios

### E1 — Long product title (3+ lines)
- Title truncates or wraps cleanly without breaking card height.

### E2 — Missing product image
- Placeholder (`{{ 'product-1' | placeholder_svg_tag }}`) renders.

### E3 — Zero price product
- Price renders as "Free" or `$0.00` per theme convention.

### E4 — Duplicate product across two pickers
- Cart receives quantity 2 of that product.
- Function still triggers if all 5 unique productIds in metafield are present (duplicate doesn't break anything but the visual grid shows duplicate cards). Merchant warning recommended in section info text.

### E5 — Product picker left empty
- See S2.

---

## Responsive Scenarios

### R1 — Mobile (< 750px)
- Cards stack 1-column.
- CTA full-width.
- Spacing between cards uses theme spacing token.

### R2 — Tablet/desktop (≥ 750px)
- 5-column grid.
- CTA centered, max-width 320px below grid.

### R3 — Editor preview at narrow widths
- Editor's `request.visual_preview_mode` does not break layout.

---

## JS Interaction Scenarios

### J1 — Spam-click guard
- Rapid 5 clicks on CTA → only one `POST /cart/add.js` fires.

### J2 — Network failure mid-request
- Drop network during POST → error state, no partial cart pollution (Shopify rejects atomically).

### J3 — `cart-drawer-component` not present on page (e.g. cart page)
- After successful add, redirect to `/cart` (fallback) OR no-op the drawer-open dispatch. Confirm behaviour: theme's `cart-drawer-component` is in `main-layout.liquid`-equivalent; verify it's present on all storefront pages. If not, fallback to `window.location.assign('/cart')`.

### J4 — `bundle_id` cart attribute persists
- After add, inspect `cart.attributes.bundle_id` via `/cart.js` → matches the value set on `data-bundle-id`.

### J5 — Multiple bundle sections on same page
- Two `<bundle-cta-component>` instances with different configs.
- Each operates independently; each click adds its own 5 variants.

---

## Cross-Component Event Scenarios

### X1 — `CartAddEvent` payload
- Listener on `document` for `cart:update` receives event with `detail.resource` (cart object), `detail.sourceId`, `detail.data.sections`.
- `cart-icon` bubble updates count.
- `cart-drawer-component` opens (if `auto-open`).

### X2 — `CartErrorEvent` payload
- On 422, `cart:error` dispatched with `detail.data.message`.
- Any global error toast component handles it.

---

## Build / Validation Scenarios

### B1 — `yarn typecheck` passes after component edits.
### B2 — `yarn lint` passes (no `any`, explicit return types).
### B3 — `shopify-dev-mcp` theme validator passes on `sections/bundle.liquid`.
### B4 — `yarn start` produces a clean webpack build; `assets/global.js` includes updated `BundleCtaComponent`.
### B5 — Section appears in theme editor's "Add section" picker and presets render correctly.
