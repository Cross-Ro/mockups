# Execution Plan — Bundle Section

## Components to build
1. `sections/bundle.liquid` — section file with grid layout, CTA wrapper, schema, inline stylesheet
2. `snippets/bundle-product-card.liquid` — single product card (image, title, price)
3. `ts/components/bundle-cta-component.ts` — patch: data-state lifecycle, CartAddEvent dispatch, /cart.js section fetch

## Dependency map
- `snippets/bundle-product-card.liquid` — no dependencies, standalone
- `sections/bundle.liquid` — renders bundle-product-card snippet (snippet must exist first or simultaneously; Liquid rendering is lazy so order doesn't strictly matter for build, but snippet should be written before section for correctness)
- `ts/components/bundle-cta-component.ts` — no Liquid dependencies; patch is self-contained

## Parallel opportunities
- UI Agent writes both Liquid files simultaneously (section + snippet)
- TS Agent runs after UI Agent (markup must be stable before patching component that works with it)

## Sequence
1. UI Agent — write `snippets/bundle-product-card.liquid` + `sections/bundle.liquid` in one pass
2. Visual QA — SKIPPED (no Figma reference, text-spec only per brief)
3. TS Agent — patch `ts/components/bundle-cta-component.ts`
4. Test Agent — run Playwright tests per test-scenarios.md

## Agent assignments
- Step 1: UI Agent (Liquid files)
- Step 2: Visual QA skipped
- Step 3: TS Agent (TypeScript patch)
- Step 4: Test Agent (Playwright)
