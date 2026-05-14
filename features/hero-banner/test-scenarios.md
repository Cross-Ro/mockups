# Hero Banner — Test Scenarios

## Visual States

### Default (all content present)
- [ ] Background image renders full-width, covers section, no distortion
- [ ] Subtitle "NEW ARRIVALS" uppercase, 16px, medium weight, white
- [ ] Heading 60px bold white on desktop, 32px on mobile
- [ ] Description 16px white at 70% opacity
- [ ] CTA pill button: #027db3 background, white bold text, border-radius full

### Missing content (Liquid conditionals)
- [ ] No subtitle setting -- subtitle element not in DOM
- [ ] No heading setting -- heading element not in DOM
- [ ] No description setting -- description element not in DOM
- [ ] No button_text setting -- CTA not in DOM
- [ ] All text blank -- only background image renders (no empty whitespace collapse issues)
- [ ] No background image -- fallback solid color background visible

### Overlay
- [ ] overlay_opacity at 0 -- no visible overlay
- [ ] overlay_opacity at 50 -- semi-transparent dark layer over image
- [ ] overlay_opacity at 100 -- fully dark overlay (text still readable)

---

## Responsive Breakpoints

### Desktop (>=1024px)
- [ ] Heading 60px
- [ ] Content container respects `content_max_width` setting, centered
- [ ] Horizontal padding 20px on content container

### Tablet (768px - 1023px)
- [ ] Heading scales to 32px
- [ ] Content still left-aligned, full-width with padding

### Mobile (<768px)
- [ ] Heading 32px
- [ ] Content full-width with 20px padding
- [ ] Background image still covers, no horizontal scroll
- [ ] CTA button remains tappable (min 44px touch target)

---

## Data Edge Cases

- [ ] Very long heading (100+ chars) -- wraps gracefully, no overflow
- [ ] Very long description (3+ paragraphs via richtext) -- no layout break
- [ ] Very long button text -- button expands horizontally, no text cutoff
- [ ] Special characters in text fields (quotes, ampersands, HTML entities)
- [ ] Richtext description with links -- links visible and clickable
- [ ] Very small background image (200x200) -- scales up without pixelation artifacts at edges
- [ ] Very large background image (4000px+) -- srcset serves appropriate size

---

## Interaction

- [ ] CTA button hover state -- visible color change (darken)
- [ ] CTA button links to correct URL from `button_link` setting
- [ ] CTA with blank `button_link` -- button still renders but href is `#` or omitted

---

## Performance

- [ ] Background image uses `loading="eager"` and `fetchpriority="high"`
- [ ] Srcset provides multiple image sizes (480, 768, 1024, 1920)
- [ ] No layout shift on image load (section has min-height or aspect ratio)

---

## Theme Editor

- [ ] Section appears as "Hero Banner" in Theme Editor
- [ ] All settings render correctly in editor sidebar
- [ ] Live preview updates when changing text settings
- [ ] Image picker works for background_image
- [ ] Range sliders work for padding and overlay opacity
- [ ] Content max-width setting visually affects layout in preview
