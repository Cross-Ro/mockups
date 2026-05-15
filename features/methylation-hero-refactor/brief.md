# Methylation Hero — Architectural Refactor Brief

## What & Why

**Feature:** `methylation-hero-refactor` — restructure the existing `sections/methylation-hero.liquid` block tree so that content is freely reorderable in the Theme Editor, matching the New-theme `rich-text` / `parent-multicolumn` composition pattern.

**Refactor goal (one sentence):** Replace the three hard-coded "monolithic" parent blocks (`_methylation-image-stack`, `_methylation-product-copy`, `_methylation-authority-box`) — which each render leaves via fragile `child.id contains '_eyebrow'` substring matches — with **generic column parent blocks** that loop `block.blocks` in author-defined order and accept ANY leaf block type.

**Live preview:** https://cross-10004.myshopify.com/?preview_theme_id=160814858498
**Figma:** https://www.figma.com/design/M2Ssx1IIYU7iwaNtwXft3n/10X-HEALTH-SYSTEM?node-id=12071-3782 (node `12071:3782`, fileKey `M2Ssx1IIYU7iwaNtwXft3n`)

> Figma MCP not callable from this planning thread. Design intent reconstructed from existing `features/methylation-hero/brief.md` (which documents node 12071:3782), `templates/index.json` (current authored content), and current section/block markup. Architect to re-pull Figma during implementation if any layout question is ambiguous.

---

## Problem Statement (current state)

```
section: methylation-hero
  block _methylation-image-stack        ← hardcoded "left column"
    leaves: _methylation-image × N
  block _methylation-product-copy       ← hardcoded "right column top"
    leaves: eyebrow, headline-serif, headline-script, tagline, body,
            value-card × N, price, cta
    rendering driven by:
      {%- if cid contains '_eyebrow' -%}…{%- endif -%}
      {%- if cid contains '_headline_serif' -%}…
      {%- if cid contains '_vc_' -%}…
      {%- if cid contains '_price' or cid contains '_cta' -%}…
  block _methylation-authority-box      ← hardcoded "below product copy"
    leaves: authority-headline, authority-body, authority-feature × N, authority-cta
    rendering driven by `child.id contains '_ahead'`, `'_abody'`, `'_f_'`, `'_acta'`
```

**Why this breaks:**
1. **Substring ID matching** (`cid contains '_vc_'`) means renaming a block in the editor (which changes its `block.id`) silently breaks rendering. Block IDs are auto-generated and not stable contract.
2. **Order is hardcoded by Liquid**: even if the merchant reorders blocks in the editor, the parent block re-sorts them into fixed slots (`header-group`, `description-group`, `value-box`, `purchase-group`). Reorder is a no-op.
3. **Adding a new leaf type** (e.g., a "guarantee" badge) requires editing the parent `.liquid` file to add another `if cid contains` branch. Not theme-editor extensible.
4. **Three parents are not interchangeable.** Image-stack only accepts images. Product-copy only accepts copy leaves. Authority-box only accepts authority leaves. A merchant cannot move a `headline-serif` from the product-copy column into the authority column without dev work.

---

## Target Architecture (matches New-theme pattern)

### Reference files (must be studied before implementing)

| File | Pattern to copy |
|------|-----------------|
| `/Users/cross/New-theme/blocks/parent-rich-text.liquid` | Generic column wrapper: loops `block.blocks`, renders each via `{% render nested_block, section: section %}`, no type-specific branching. Per-column settings: `parent_class`, `max_width`, `gap`, `mobile_gap`, `alignment`. |
| `/Users/cross/New-theme/blocks/parent-multicolumn-horizontal-v3.liquid` | Generic parent that allows nested mixed leaf types. |
| `/Users/cross/New-theme/sections/multicolumn-horizontal.liquid` | Section composes N parent blocks side-by-side; section owns the grid container, parents own column content. |

### New block tree

```
section: methylation-hero                         (unchanged file path)
  ├── block: methylation-hero-column   (NEW generic parent — left column "slot")
  │     accepts ANY leaf:
  │       _methylation-image
  │       _methylation-eyebrow
  │       _methylation-headline-serif
  │       _methylation-headline-script
  │       _methylation-tagline
  │       _methylation-body
  │       _methylation-value-card
  │       _methylation-price
  │       _methylation-cta
  │       _methylation-authority-headline
  │       _methylation-authority-body
  │       _methylation-authority-feature
  │       _methylation-authority-cta
  │     renders: {% for nested_block in block.blocks %}{% render nested_block, section: section %}{% endfor %}
  │
  └── block: methylation-hero-column   (same type, second instance — right column "slot")
        same accept list, ordered independently by editor
```

The section places columns side-by-side; merchant adds 1, 2 (typical), or 3+ column instances and reorders blocks inside each independently. Per the user's request this mirrors how `rich-text.liquid` accepts any combination of caption/heading/body/button/image freely orderable.

### Why a single column block type, not "left-column" + "right-column"

Two type names would only differ in default settings. One type with per-instance `max_width` / `alignment` / `parent_class` settings achieves the same outcome and lets the merchant add a third column or reorder columns themselves. Direct New-theme parallel: `parent-rich-text` is a single type used multiple times under the same section.

---

## File Manifest

### NEW files

| File | Purpose |
|------|---------|
| `blocks/methylation-hero-column.liquid` | Generic column parent. Loops `block.blocks` in author order. Settings: `parent_class`, `max_width_desktop`, `gap_desktop`, `gap_mobile`, `alignment` (top / center / end), `column_role` (informational tag only: `images`, `copy`, `authority`, `custom` — used as `data-role` for CSS hooks). Accepts the full 13-leaf list above. |

### MODIFIED files

| File | Change |
|------|--------|
| `sections/methylation-hero.liquid` | Schema `blocks` array: drop `_methylation-image-stack`, `_methylation-product-copy`, `_methylation-authority-box`. Add `methylation-hero-column`. Update `presets` to seed two `methylation-hero-column` instances pre-populated with leaves in current visual order. Section body markup wraps `{% content_for 'blocks' %}` in a flex/grid container so two columns sit side-by-side on desktop and stack on mobile. |
| `scss/sections/methylation-hero.scss` | Replace `.methylation-hero__copy`, `.methylation-hero__images`, `.methylation-hero__authority` parent selectors with column-agnostic selectors: `.methylation-hero__inner` (grid container), `.methylation-hero-column[data-role="images"]`, `[data-role="copy"]`, `[data-role="authority"]`. Leaf-level styles unchanged. |
| `templates/index.json` | Migrated content tree (see Migration Plan below). |

### DELETED files

| File | Reason |
|------|--------|
| `blocks/_methylation-image-stack.liquid` | Replaced by `methylation-hero-column` with `data-role="images"`. Mobile-swiper logic moves into a leaf-level concern (see Mobile Swiper Plan below). |
| `blocks/_methylation-product-copy.liquid` | Replaced by `methylation-hero-column` with `data-role="copy"`. Sub-grouping (`header-group` / `description-group` / `value-box` / `purchase-group`) becomes leaf-level CSS responsibility — leaves carry their own wrapper classes. |
| `blocks/_methylation-authority-box.liquid` | Replaced by `methylation-hero-column` with `data-role="authority"`. The visual "boxed" treatment becomes a column setting (`parent_class: "methylation-hero-column--boxed"`) the merchant applies to that column instance. |

### UNCHANGED files (leaf blocks — all 13 stay as-is)

```
_methylation-image.liquid
_methylation-eyebrow.liquid
_methylation-headline-serif.liquid
_methylation-headline-script.liquid
_methylation-tagline.liquid
_methylation-body.liquid
_methylation-value-card.liquid
_methylation-price.liquid
_methylation-cta.liquid
_methylation-authority-headline.liquid
_methylation-authority-body.liquid
_methylation-authority-feature.liquid
_methylation-authority-cta.liquid
```

Leaves continue to render themselves with their own `block.shopify_attributes` and existing settings. Refactor does NOT touch leaf settings or markup — preserves editor history.

---

## How `block.blocks` Ordering Replaces ID-Suffix Matching

**Before (fragile):**
```liquid
{%- for child in block.blocks -%}
  {%- if child.id contains '_eyebrow' -%}{% render child, section: section %}{%- endif -%}
{%- endfor -%}
{%- for child in block.blocks -%}
  {%- if child.id contains '_headline_serif' -%}{% render child, section: section %}{%- endif -%}
{%- endfor -%}
…repeat for every type, in dev-decided order
```

**After (Shopify-native):**
```liquid
{%- for nested_block in block.blocks -%}
  {%- render nested_block, section: section -%}
{%- endfor -%}
```

Author order is the rendering order. `block.blocks` is already returned in `block_order` sequence by Shopify. No string matching. Renaming a block (editing its handle in editor) is harmless. Adding a brand-new leaf type only requires (a) creating the leaf `blocks/*.liquid` and (b) appending `{ "type": "new-leaf" }` to both the section's `blocks` array AND `methylation-hero-column`'s `blocks` array.

**Group-level spacing** (the current `header-group` / `value-box` / `purchase-group` wrappers) is dropped. Replacement: column-level `gap` setting on `methylation-hero-column` provides uniform stack spacing. Where a tighter sub-group is required visually (e.g. price + cta together), the merchant inserts a `spacer` leaf — OR the leaves themselves carry intrinsic top-margin tokens. Recommend leaves stay margin-less and the column `gap` handles all spacing uniformly (matches `parent-rich-text` approach).

---

## Mobile Swiper Plan (open architectural question — flag for Architect)

The current `_methylation-image-stack` renders images twice: desktop grid + mobile `<carousel-swiper>` of all images. After refactor, the generic column knows nothing about "these are images, swipe them on mobile." Three options:

| Option | Trade-off |
|--------|-----------|
| **A. Column setting `mobile_layout: "swiper" \| "stacked"`** | Column block stays generic in type list but gains layout intelligence. Mirrors `multicolumn-horizontal.liquid` which has `mobile_layout_type`. Recommended. Per-column choice. |
| **B. Wrap swiper logic in a NEW leaf `_methylation-image-swiper`** that nests its own image blocks | Cleanest separation but reintroduces a "specialized parent" — slight regression on the refactor goal. |
| **C. Drop mobile swiper, mobile becomes vertical stack of images** | Simplest. Loses the swipe affordance from current Figma mobile design. Requires merchant sign-off. |

**Recommendation: Option A.** `methylation-hero-column` gets a `mobile_layout` select (default `stacked`). When set to `swiper`, the column wraps its iteration in `<carousel-swiper>` markup with the existing swiper JSON config (loop, autoplay, autoplay_delay settings move to the column too). This keeps the column generic-shaped while supporting the only known mobile behavior variant. The Architect should confirm or override this decision when invoked.

---

## Migration Plan — `templates/index.json`

Current authored tree (single section `methylation_hero_MhX1aP`) contains three nested block trees. After refactor, the same content lives in two `methylation-hero-column` children of the same section. No content is lost.

### Migration mapping

```
OLD                                          NEW
section.blocks.image_stack                →  section.blocks.column_left
  type: _methylation-image-stack            type: methylation-hero-column
  settings.mobile_image_loop                settings.mobile_image_loop      ← moved to column
  settings.mobile_image_autoplay            settings.mobile_image_autoplay  ← moved to column
  settings.mobile_image_autoplay_delay      settings.mobile_image_autoplay_delay
                                            settings.column_role: "images"
                                            settings.mobile_layout: "swiper"
  blocks.img_1.._methylation-image       →  blocks.img_1.._methylation-image       (unchanged)
  blocks.img_2.._methylation-image       →  blocks.img_2.._methylation-image       (unchanged)
  blocks.img_3.._methylation-image       →  blocks.img_3.._methylation-image       (unchanged)
  blocks.img_4.._methylation-image       →  blocks.img_4.._methylation-image       (unchanged)
  blocks.img_5.._methylation-image       →  blocks.img_5.._methylation-image       (unchanged)
  block_order: [img_1..img_5]            →  block_order: [img_1..img_5]            (unchanged)

section.blocks.product_copy             ┐
  type: _methylation-product-copy       │   MERGED INTO →   section.blocks.column_right
                                        │                     type: methylation-hero-column
                                        │                     settings.column_role: "copy_and_authority"
                                        │                     settings.mobile_layout: "stacked"
section.blocks.authority                ┘
  type: _methylation-authority-box

(All leaf children of product_copy AND authority are concatenated under column_right.blocks
 in the visual order they appear today:)
  blocks.eyebrow            ← from product_copy
  blocks.headline_serif     ← from product_copy
  blocks.headline_script    ← from product_copy
  blocks.tagline            ← from product_copy
  blocks.body               ← from product_copy
  blocks.vc_1               ← from product_copy
  blocks.vc_2               ← from product_copy
  blocks.vc_3               ← from product_copy
  blocks.price              ← from product_copy
  blocks.cta                ← from product_copy
  blocks.ahead              ← from authority   (existing authority headline)
  blocks.abody              ← from authority
  blocks.f_1                ← from authority
  blocks.f_2                ← from authority
  blocks.f_3                ← from authority
  blocks.f_4                ← from authority
  blocks.f_5                ← from authority
  blocks.acta               ← from authority

  block_order: [eyebrow, headline_serif, headline_script, tagline, body,
                vc_1, vc_2, vc_3, price, cta,
                ahead, abody, f_1, f_2, f_3, f_4, f_5, acta]
```

> **Decision flag for Architect:** Merge authority into the right column (single column with role `copy_and_authority`) OR keep authority as a **third** column instance with `column_role: "authority"` and `parent_class: "methylation-hero-column--boxed"`. The latter gives merchants the freedom to move authority elsewhere on the page without breaking the visual containment. Recommend 3-column variant. The migration JSON snippet above shows the 2-column merge for brevity; final implementation should produce 3 column instances:
> - `column_images` (role: images, mobile: swiper)
> - `column_copy` (role: copy, mobile: stacked)
> - `column_authority` (role: authority, mobile: stacked, parent_class for boxed treatment)

### Migration execution

1. Back up current `templates/index.json` to `templates/index.json.bak` before any edits.
2. Author new section/block schema files first; keep old block files in place so Shopify doesn't reject the existing template.
3. Hand-edit `templates/index.json` to the new tree.
4. Run `yarn deploy` (which runs `shopify theme push`) and verify Theme Editor renders.
5. Once verified, delete old block files (`_methylation-image-stack.liquid`, `_methylation-product-copy.liquid`, `_methylation-authority-box.liquid`).
6. Re-deploy.

`shopify theme pull` after deploy should be a no-op diff confirming the live store now matches the new tree.

---

## Layout & Responsive

| Breakpoint | Behavior |
|------------|----------|
| `<1024px` (mobile / tablet) | Columns stack vertically full-width. Column with `mobile_layout: swiper` wraps its leaves in `<carousel-swiper>`. Other columns render as a vertical flex stack with `gap_mobile`. |
| `≥1024px` (`md:` in this codebase's Tailwind config) | Section container is `tw-grid` with `auto-cols-fr` (or explicit `tw-grid-cols-[700px_minmax(0,1fr)]` if a left-column fixed width is required per Figma). Each column renders desktop layout: vertical flex stack with `gap_desktop`. |

The section file owns ONLY the outer grid/flex container. Inter-column gap is a section setting (`column_gap_desktop`, `column_gap_mobile`). Intra-column gap is per-column.

---

## Schema Ownership

| Lives on section | Lives on column block | Lives on leaf block |
|------------------|----------------------|---------------------|
| `color_scheme` | `column_role` (data-attr tag) | All existing leaf settings — UNCHANGED |
| `container_padding_*` (4 fields) | `parent_class` | |
| `column_gap_desktop` | `max_width_desktop` | |
| `column_gap_mobile` | `gap_desktop`, `gap_mobile` | |
| `desktop_columns_template` (advanced — optional `auto` \| `1fr 1fr` \| `700px 1fr`) | `alignment` (top/center/end) | |
| | `mobile_layout` (stacked/swiper) | |
| | `mobile_image_loop`, `mobile_image_autoplay`, `mobile_image_autoplay_delay` (only effective when `mobile_layout: swiper`) | |

---

## Tradeoffs

| Decision | Alternative | Why chosen | Known downside |
|----------|-------------|------------|----------------|
| Single generic `methylation-hero-column` block type | Two specialized types `methylation-hero-left-column` + `methylation-hero-right-column` | Mirrors `parent-rich-text` precedent in New-theme. Lets merchants add N columns. | Merchant must configure `column_role` per instance instead of inheriting from type name. |
| Authority as a 3rd column instance | Authority merged into right column | Lets merchants reorder authority block freely; "boxed" visual treatment moves to `parent_class` setting. | Slightly more visible columns in the editor sidebar (3 instead of 2). |
| Mobile swiper as column setting (Option A) | Dedicated `_methylation-image-swiper` parent leaf | Keeps column generic; matches `multicolumn-horizontal.liquid` `mobile_layout_type` precedent. | Column block carries swiper config settings even when not used. Mitigation: settings live under a `header: "Mobile carousel (only when mobile_layout = swiper)"` group. |
| Replace group-wrappers (`header-group`/`value-box`/`purchase-group`) with uniform column `gap` | Keep wrappers, add settings on the column to toggle each | Generic-shape goal wins. Uniform gap is the rich-text precedent. | If Figma shows non-uniform vertical rhythm (e.g. larger gap between body and value-cards), the merchant must insert a `spacer` leaf — slightly more editor work. |
| Delete old parent block files after migration | Keep them as deprecated, mark `enabled_on: []` | Removes dead code, keeps repo lean. | If migration goes wrong post-deploy, rollback requires `git revert` rather than re-enabling. Mitigated by `templates/index.json.bak`. |
| Hand-edit `templates/index.json` for migration | Write a Node script that mutates the JSON | Single template, one-time operation, easier to review in diff. | Manual error risk. Mitigated by JSON validation + Theme Editor visual check. |

---

## Assumptions

1. **Figma layout intact.** Refactor changes nothing visually. Same desktop 2-or-3-column composition, same mobile vertical stack, same swiper on mobile for images. Architect MUST re-pull Figma node `12071:3782` during implementation to confirm.
2. **Leaf block markup is correct as-is.** All 13 leaf `.liquid` files render their own DOM properly and need no changes.
3. **`{% content_for 'blocks' %}` already used in the section** — confirmed in current `sections/methylation-hero.liquid` line 27. The section already iterates blocks generically; only the parent-block layer is broken.
4. **No JS regression.** `<carousel-swiper>` web component handles its own init via mutation observer (existing pattern in New-theme).
5. **No TypeScript changes required.** No `ts/sections/methylation-hero.ts` exists today and none is needed unless mobile-layout swap requires explicit swiper destroy/init (deferred to fallback per existing brief).

---

## Memory / Reference Patterns to Apply

- New-theme rich-text composition (`blocks/parent-rich-text.liquid`)
- New-theme multicolumn section pattern (`sections/multicolumn-horizontal.liquid`)
- Shopify `{% content_for 'blocks' %}` + `{% render nested_block, section: section %}` idiom
- Shopify schema rule: a block listed under `blocks: [{ "type": "X" }]` in another block's schema makes X nestable as a child

---

## Constraints

- Tailwind classes MUST be prefixed `tw-` (project rule).
- Existing color scheme + design tokens stay in `scss/components/methylation-hero-tokens.scss`. No raw hex/px in component SCSS.
- Theme Editor must render without console errors after migration.
- `yarn deploy` must succeed; `yarn typecheck` and `yarn lint` unaffected (no TS changes).
