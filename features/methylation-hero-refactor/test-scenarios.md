# Methylation Hero Refactor — Test Scenarios

Scope: validate that swapping the three monolithic parent blocks for generic `methylation-hero-column` parents preserves rendering, unlocks reorder, and does not regress mobile swiper or layout.

Live preview: https://cross-10004.myshopify.com/?preview_theme_id=160814858498
Figma reference: node `12071:3782` (file `M2Ssx1IIYU7iwaNtwXft3n`)

---

## A. Visual Regression — All Current Elements Still Render

**Goal:** zero visual diff between current production and refactored output at the default authored content.

### A1. Manual — desktop snapshot diff
1. Capture screenshot of current preview URL at viewport 1440x900 BEFORE refactor.
2. Apply refactor, push theme, reload same preview URL at 1440x900.
3. Compare side-by-side.
4. **Pass:** No visible position, color, font, spacing, or image difference. Every element from the BEFORE shot is present in the AFTER shot.

### A2. Manual — mobile snapshot diff
1. Same as A1 but viewport 390x844.
2. **Pass:** Identical visual output. Mobile swiper present with pagination dots. Authority box stacked below product copy.

### A3. Manual element checklist
Open refactored page. Confirm presence of EACH of the following 18 authored elements (from `templates/index.json`):

- [ ] 5 hero images render (`img_1..img_5`)
- [ ] Eyebrow text "SUMMER METHYLATION SPECIAL"
- [ ] Headline serif "DECODE YOUR METHYLATION"
- [ ] Headline script "Design Your Summer"
- [ ] Tagline rich text (bold "Test your methylation. Talk to a Wellness Advisor. Take action.")
- [ ] Body paragraph(s)
- [ ] Value card 1 — DNA icon, "METHYLATION GENETIC TEST", "$599 VALUE", navy accent
- [ ] Value card 2 — Advisor icon, "1:1 WELLNESS ADVISOR CALL", "$47 VALUE", gold accent
- [ ] Value card 3 — Gift icon, "$100 FIRST PROTOCOL CREDIT", "$100 VALUE", red accent
- [ ] Price compare-at "$746.00", final "$599.00", save "Save $147"
- [ ] Primary CTA "CLAIM MY BUNDLE"
- [ ] Authority headline "Doing everything right and still exhausted?"
- [ ] Authority body paragraph
- [ ] Feature 1 "Easy / At-Home Collection"
- [ ] Feature 2 "CLIA- / Certified Lab Partner"
- [ ] Feature 3 "Backed By / 10X Medical Experts"
- [ ] Feature 4 "100% Private / Data"
- [ ] Feature 5 "HIPAA- / Compliant"
- [ ] Authority CTA "DECODE MY METHYLATION"

**Pass:** all 18 boxes ticked.

### A4. Playwright — element presence
```ts
test('methylation hero — all authored elements render after refactor', async ({ page }) => {
  await page.goto(PREVIEW_URL);
  const hero = page.locator('.methylation-hero');
  await expect(hero).toBeVisible();
  await expect(hero.locator('img')).toHaveCount(10); // 5 grid + 5 swiper duplicates, OR 5 if single-source
  await expect(hero.getByText('SUMMER METHYLATION SPECIAL')).toBeVisible();
  await expect(hero.getByText('DECODE YOUR METHYLATION')).toBeVisible();
  await expect(hero.getByText('Design Your Summer')).toBeVisible();
  await expect(hero.getByText('CLAIM MY BUNDLE')).toBeVisible();
  await expect(hero.getByText('DECODE MY METHYLATION')).toBeVisible();
  await expect(hero.getByText('Doing everything right and still exhausted?')).toBeVisible();
  await expect(hero.getByText('$599.00')).toBeVisible();
  await expect(hero.getByText('Save $147')).toBeVisible();
  // value cards
  await expect(hero.getByText('METHYLATION GENETIC TEST')).toBeVisible();
  await expect(hero.getByText('1:1 WELLNESS ADVISOR CALL')).toBeVisible();
  await expect(hero.getByText('$100 FIRST PROTOCOL CREDIT')).toBeVisible();
  // authority features
  for (const text of ['At-Home Collection', 'Certified Lab Partner', '10X Medical Experts', '100% Private', 'HIPAA-']) {
    await expect(hero.getByText(text)).toBeVisible();
  }
});
```

---

## B. Block Reorderability in Editor

**Goal:** prove that author order in `block_order` is the rendering order — kill the old substring-matching behavior.

### B1. Manual — reorder leaves within right column
1. Open Theme Editor for the index template.
2. Expand `methylation-hero` section → right column block.
3. Drag `price` ABOVE `headline_serif`.
4. Save. Reload storefront.
5. **Pass:** Price now visually appears above the serif headline. (Under the OLD architecture this would NOT have happened because `_methylation-product-copy` sorted blocks into fixed slots regardless of order.)
6. Restore order; save again.

### B2. Manual — reorder value cards
1. In editor, swap `vc_1` and `vc_3`.
2. Save, reload.
3. **Pass:** Gift / $100 card appears first, DNA / $599 card appears third.

### B3. Manual — reorder authority features
1. In editor, move `f_5` to first position.
2. Save, reload.
3. **Pass:** "HIPAA- / Compliant" feature appears as the first feature.

### B4. Playwright — DOM order matches block_order
```ts
test('reordering blocks changes DOM order', async ({ page }) => {
  await page.goto(PREVIEW_URL);
  // After applying a test theme with vc_3 listed before vc_1 in templates/index.json:
  const cards = page.locator('[data-block-type="_methylation-value-card"]');
  await expect(cards.nth(0)).toContainText('$100 FIRST PROTOCOL CREDIT');
  await expect(cards.nth(2)).toContainText('METHYLATION GENETIC TEST');
});
```

---

## C. Left and Right Columns Independently Editable

### C1. Manual — add new leaf to left column only
1. In editor, on the **left** column (images), click "Add block" → add an `eyebrow` leaf with text "TEST EYEBROW IN IMAGE COLUMN".
2. Save, reload.
3. **Pass:** "TEST EYEBROW IN IMAGE COLUMN" appears above the images on desktop. The right column is unchanged. (This proves columns accept the full leaf list, not just type-restricted leaves.)
4. Delete the test eyebrow.

### C2. Manual — remove a leaf from right column
1. Delete `body` from the right column.
2. Save, reload.
3. **Pass:** Body paragraph is gone. All other right-column elements still render in order. Left column untouched.
4. Re-add or restore from backup.

### C3. Manual — independent column settings
1. Set left column `gap_desktop = 8px`, right column `gap_desktop = 24px`.
2. Save, reload at desktop viewport.
3. **Pass:** Visible vertical gap between left-column children is smaller than between right-column children.

### C4. Manual — add a third column
1. Add a new `methylation-hero-column` block at section level.
2. Inside it, add an `authority_cta` leaf.
3. Save, reload.
4. **Pass:** Section grid now shows three columns on desktop. Third column renders the CTA only.
5. Delete third column.

### C5. Playwright — section blocks count
```ts
test('section accepts multiple column instances', async ({ page }) => {
  await page.goto(PREVIEW_URL);
  const columns = page.locator('.methylation-hero .methylation-hero-column');
  const count = await columns.count();
  expect(count).toBeGreaterThanOrEqual(2);
  expect(count).toBeLessThanOrEqual(4); // sanity
});
```

---

## D. Mobile Swiper Still Works

### D1. Manual — swiper init
1. Open refactored page on mobile viewport (390x844) or via DevTools device mode.
2. **Pass:**
   - Image column renders as `<carousel-swiper>` (visible `.swiper-wrapper`, slides, pagination dots).
   - First slide visible with peek of slide 2 on the right edge (slidesPerView 1.1).
   - No JS console errors.

### D2. Manual — swipe gesture
1. Drag/swipe left on the swiper.
2. **Pass:** Advances to next image. Pagination dot updates.

### D3. Manual — autoplay (if enabled in settings)
1. In editor, set column `mobile_image_autoplay = true`, `mobile_image_autoplay_delay = 3000`.
2. Save, reload on mobile viewport.
3. **Pass:** Images auto-advance every 3 seconds. Stops on user interaction.
4. Restore default (`autoplay = false`).

### D4. Manual — loop
1. Confirm `mobile_image_loop = true`.
2. Swipe past the last image.
3. **Pass:** Returns to first image without snapping back.

### D5. Manual — desktop swiper hidden
1. Resize to desktop (≥1024px).
2. **Pass:** No swiper visible. Image grid layout shown. No swiper pagination dots leaking through.

### D6. Manual — switch column `mobile_layout` to `stacked`
1. In editor, set left column `mobile_layout = stacked`.
2. Save, reload on mobile.
3. **Pass:** Images render as vertical stack, full-width, no swiper. (Proves `mobile_layout` setting effective.)
4. Restore to `swiper`.

### D7. Playwright — swiper present on mobile
```ts
test('mobile viewport renders swiper', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(PREVIEW_URL);
  await expect(page.locator('.methylation-hero carousel-swiper')).toBeVisible();
  await expect(page.locator('.methylation-hero .swiper-pagination')).toBeVisible();
});

test('desktop viewport hides swiper UI', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PREVIEW_URL);
  const swiper = page.locator('.methylation-hero carousel-swiper');
  // Either not in DOM at desktop, or wrapper is display:none
  const box = await swiper.boundingBox();
  expect(box === null || box.height === 0).toBeTruthy();
});
```

---

## E. Migration Integrity — `templates/index.json`

### E1. JSON validity
1. After hand-editing `templates/index.json`, run `node -e "JSON.parse(require('fs').readFileSync('templates/index.json','utf8'))"`.
2. **Pass:** No syntax error.

### E2. Block count matches
1. Pre-refactor: count leaf blocks under `methylation_hero_MhX1aP` in old tree: `5 (images) + 10 (product_copy children) + 8 (authority children) = 23` leaves.
2. Post-refactor: count leaves nested under all `methylation-hero-column` blocks of the same section.
3. **Pass:** count equals 23. No leaf lost in migration.

### E3. Settings preserved
1. For each migrated leaf, diff `settings` block pre- vs post-refactor.
2. **Pass:** All leaf `settings` objects identical (text strings, image references, accent colors, URLs all match). The only allowed change is the parent path.

### E4. Theme Editor opens without error
1. Open Theme Editor on the refactored theme.
2. Navigate to the methylation-hero section.
3. **Pass:** No "Block type not found" or "Invalid block" toast. All columns expand. All leaves visible in sidebar in expected order.

---

## F. Removal of Old Parent Blocks

### F1. Old block types not referenced
```bash
grep -rn '_methylation-image-stack\|_methylation-product-copy\|_methylation-authority-box' \
  sections/ blocks/ templates/
```
**Pass:** No matches outside of `.bak` files. The three deleted block files are absent from `blocks/`.

### F2. Substring matching eliminated
```bash
grep -rn "child.id contains" blocks/_methylation-*.liquid sections/methylation-hero.liquid
```
**Pass:** Zero matches. The `child.id contains '_eyebrow'` pattern is gone from the codebase.

---

## G. Build & Deploy

### G1. `yarn deploy` succeeds
1. Run `yarn deploy`.
2. **Pass:** Exit code 0. Theme uploaded. No webpack error. No Shopify CLI rejection of schema.

### G2. `yarn lint` and `yarn typecheck` unchanged
1. Run both.
2. **Pass:** Same status as pre-refactor (no new errors introduced — refactor is Liquid/SCSS only).

### G3. Shopify theme check (if available)
```bash
shopify theme check sections/methylation-hero.liquid blocks/methylation-hero-column.liquid
```
**Pass:** No critical/error findings.

---

## Exit criteria
All of A1–A4, B1–B4, C1–C5, D1–D7, E1–E4, F1–F2, G1–G3 pass before the refactor is considered complete.
