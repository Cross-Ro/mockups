---
name: Image Stack Implementation
description: How to use the three-layer image system in the startup kit: shopify-responsive-image.liquid → snippets/image.liquid → blocks/image.liquid. Covers layout types, parameters, defaults, and usage pattern.
type: reference
---

# Image Stack Implementation

## Three-layer stack

```
blocks/image.liquid
  → snippets/image.liquid
    → snippets/shopify-responsive-image.liquid
```

**`snippets/shopify-responsive-image.liquid`** — lowest level. Handles srcset generation, padding-top aspect ratio, lazysizes, fit modes (`fill`, `crop`, `contain`, `background`). Never call directly from sections — always go through `snippets/image.liquid`.

**`snippets/image.liquid`** — mid-level. Two layout types:
- `full` — fills container, separate desktop + mobile image pickers, mobile falls back to desktop image. Desktop shown at `md:` and above, mobile shown below. Aspect ratios set independently per breakpoint.
- `icon` — centered, max-width constrained (`icon_max_width` px), single image, optional rounded corners (`tw-rounded-xl`). No mobile variant.

Key defaults: full desktop AR `0.79`, full mobile AR `2.37`, icon AR `1` (square).

**`blocks/image.liquid`** — block entry point. Reads schema settings and delegates to `snippets/image.liquid`. Schema exposes: `layout_type` (icon/full), desktop/mobile image pickers, `desktop_aspect_ratio`, `mobile_aspect_ratio`, `icon_max_width`, `icon_rounded`. `mobile_image` and `mobile_aspect_ratio` hidden via `visible_if` when `layout_type == 'icon'`.

## Usage pattern

```liquid
{%- render 'image',
  desktop_image: block.settings.desktop_image,
  mobile_image: block.settings.mobile_image,
  image_id: block.id,
  layout_type: block.settings.layout_type | default: 'icon',
  icon_max_width: block.settings.icon_max_width,
  desktop_aspect_ratio: block.settings.desktop_aspect_ratio,
  mobile_aspect_ratio: block.settings.mobile_aspect_ratio,
  icon_rounded: block.settings.icon_rounded,
  parent_class: parent_class,
  block_shopify_attributes: block.shopify_attributes
-%}
```

`parent_class` prefixes BEM classes on the wrapper (`{{ parent_class }}__image`, `{{ parent_class }}__icon-wrapper`). Set to `"block"` from block files.
