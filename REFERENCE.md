# Module update — Reference & guide

This document compares Module update with the main theme (New-theme), lists what must stay different for TypeScript and tree-shaking, and gives step-by-step deep dives for tree-shaking and adding aliases. For architecture and build pipeline, see **ARCHITECTURE.md**.

---

# Part 1 — New-theme vs Module update

Side-by-side of the main theme (New-theme) and the TypeScript setup (Module update).

---

## 1. Stack & purpose

|                     | New-theme                | Module update                                   |
| ------------------- | ------------------------ | ----------------------------------------------- |
| **Purpose**         | Main Shopify theme build | Same theme build + TypeScript, stricter tooling |
| **JS**              | JS/JSX only              | JS/JSX + **TS/TSX** (Babel)                     |
| **Package manager** | npm or yarn              | **Yarn** (`packageManager`, no lock for npm)    |
| **Node**            | No engines               | `engines: node >= 18, yarn >= 1.22`             |
| **Browserslist**    | (optional)               | Explicit `last 2 versions, not dead`            |

---

## 2. Webpack

| Area                   | New-theme                                                        | Module update                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Entry**              | `...scssEntryPoint`, `...jsEntryPoints`                          | Same + **`...tsEntryPoints`** from `ts/sections/**/*.{ts,tsx}` (one bundle per section file) |
| **Resolve extensions** | `.js`, `.jsx`, `.json`                                           | + **`.ts`, `.tsx`**                                                                                                                        |
| **Aliases**            | `StyleComponents`, `JsComponents`                                | **StyleComponents** (→ `scss/components`), **TsComponents** (→ `ts/components`) |
| **JS rule**            | `(js\|jsx)$` → babel-loader                                      | `(js\|jsx\|ts\|tsx)$` → babel-loader                                                                                                       |
| **Output**             | `assets/`, `[name].js`, `[name].js?[chunkhash]`                  | Same                                                                                                                                       |
| **Optimization**       | Separate blocks for dev and prod (same shape)                    | usedExports, splitChunks (Vendors + common), Terser + CssMinimizer                                                                          |
| **Plugins**            | RemoveEmptyScripts, MiniCssExtract, (dev) WebpackShellPluginNext | Same + **ForkTsCheckerWebpackPlugin**, **ESLintPlugin** (ts/), **playFailSoundPlugin**                                                      |

---

## 3. Babel

|             | New-theme                                            | Module update                |
| ----------- | ---------------------------------------------------- | ---------------------------- |
| **Presets** | preset-react, preset-env (esmodules, modules: false) | Same + **preset-typescript** |
| **Plugins** | transform-runtime                                    | Same                         |

---

## 4. PostCSS

|              | New-theme                                                                       | Module update                                                                        |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Plugins**  | postcss-preset-env (browsers, stage 0, autoprefixer), tailwindcss, autoprefixer | postcss-preset-env (stage 0, autoprefixer), tailwindcss only (no extra autoprefixer) |
| **Browsers** | In postcss `browsers: 'last 2 versions'`                                        | From package.json **browserslist**                                                   |

---

## 5. Tailwind

|              | New-theme                                         | Module update                           |
| ------------ | ------------------------------------------------- | --------------------------------------- |
| **Content**  | sections, blocks, snippets, `./js/**/*`, flowbite | Same + **`./src/**/*.{ts,tsx,js,jsx}`** |
| **Theme**    | Same (screens, colors, spacing, etc.)             | Same                                    |
| **Flowbite** | `prefix: 'tw-'`                                   | Same                                    |
| **prefix**   | `tw-`                                             | Same                                    |

---

## 6. Package.json

|                     | New-theme                                                                            | Module update                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **main**            | `webpack.config.js`                                                                  | `assets/main.js`                                                                                                   |
| **Scripts**         | build, start, deploy, shopify:push/pull + **Playwright tests**                       | **start** (tsc + webpack --watch), **deploy** (webpack && shopify theme push), **typecheck**, **lint**, **emit-declarations** |
| **sideEffects**     | `*.css`, `*.scss`, `*.vue`                                                           | **`*.scss`** only                                                                                                 |
| **Dependencies**    | Theme/runtime (React, Swiper, etc.)                                                  | **@babel/runtime** only                                                                                            |
| **DevDependencies** | Babel (no TS), webpack, sass, postcss, tailwind, flowbite, glob ^7, Playwright, etc. | Babel + **preset-typescript**, webpack, sass, postcss, tailwind, flowbite, **typescript**, glob ^11, no Playwright |

---

## 7. Source & output layout

|                       | New-theme                                    | Module update                                                                                                                             |
| --------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **JS/TS entry dirs**  | `js/sections/**/*.js`                        | `js/sections/**/*.{js,jsx}` + **`ts/sections/**/*.{ts,tsx}`**                                                                              |
| **Component aliases** | `js/components`, `scss/components`           | **`ts/components`** (TsComponents), **`scss/components`** (StyleComponents)                                                               |
| **SCSS**              | `scss/sections/*.scss` (e.g. common-imports) | Same (e.g. `common-imports.scss`)                                                                                                         |
| **Output**            | `assets/` (JS, CSS, shared, vendors)         | Same                                                                                                       |
| **TypeScript**        | —                                            | **`ts/`** (sections, components); **`tsconfig.json`** (rootDir ts/, noEmit, include ts/**/*); optional emit-declarations                 |

---

## 8. Config files only in Module update

- **tsconfig.json** — strict TS, `rootDir: "./ts"`, `include: ["ts/**/*"]`, `noEmit: true`; declarations via `yarn emit-declarations`.
- **.eslintrc.cjs** — ESLint config for `ts/`; used by eslint-webpack-plugin during build.
- **.gitignore** — `.env`, etc.

---

## 9. Summary

- **Shared:** Entry pattern (scss + section JS/TS), output to `assets/`, same Tailwind/Flowbite/PostCSS/Babel (except TS), same optimization idea (usedExports, Vendors + common chunks, Terser + CssMinimizer), dev shell plugin (onBuildStart/onBuildEnd).
- **New-theme only:** JS/JSX, more app deps, Playwright, inline comments in webpack, duplicate dev/prod optimization blocks.
- **Module update only:** TypeScript (Babel), `ts/sections` entries, TsComponents + StyleComponents aliases, ForkTsChecker + ESLint in webpack, Yarn/engines/browserslist, typecheck/lint/emit-declarations scripts, lighter deps.

---

## 10. Same as New-theme vs required for TS + tree-shaking

### Should be the same as New-theme

These are either already identical or can be aligned so both projects behave and look the same except where TS/tree-shaking force a difference.

| Area | New-theme | Module update | Status |
|------|-----------|---------------|--------|
| **Entry pattern** | `...scssEntryPoint`, `...jsEntryPoints` | Same + `...tsEntryPoints` from `ts/sections/**/*.{ts,tsx}` | TS adds one spread (required). |
| **Output** | `assets/`, `[name].js`, `[name].css`, `[name].js?[chunkhash]` | Same | Same. |
| **Optimization** | Separate dev/prod blocks (usedExports, splitChunks, minimizer) | Same | Same. |
| **PostCSS** | postcss-preset-env (browsers, stage 0, autoprefixer), tailwindcss, autoprefixer | Same | Same. |
| **Tailwind** | content, theme, flowbite prefix `tw-` | Same + `./src/**/*` in content | Same; extra path for TS. |
| **sideEffects** | `["*.css", "*.scss", "*.vue"]` | `["*.scss"]` | Module update: SCSS only. |
| **Scripts (core)** | build, start, deploy, shopify:push, shopify:pull | start (tsc + webpack --watch), deploy (webpack && shopify theme push), typecheck, lint | Module update has no separate `build`; deploy runs webpack. |
| **Shell plugin (dev)** | onBuildStart/onBuildEnd, parallel: true | Same | Same. |
| **Webpack glob reduce** | reduce pattern (variable `path` shadows Node) | Same; `p` / `filePath` (no shadow) | Same. |

### Required for TS + tree-shaking (must stay different)

These differences are needed to support TypeScript and your tree-shaking setup. Do not remove them to “match” New-theme.

| Area | Why it must differ |
|------|--------------------|
| **Entry** | `...tsEntryPoints` from `ts/sections/**/*.{ts,tsx}` is required so TS section files are entry points. |
| **resolve.extensions** | `.ts`, `.tsx` must be present so webpack resolves TypeScript files. |
| **resolve.alias** | `TsComponents` → `ts/components`, `StyleComponents` → `scss/components` for stable imports; keep. |
| **JS rule** | `test: /\.(js\|jsx\|ts\|tsx)$/` and babel-loader are required to compile TS/TSX. |
| **Babel** | `@babel/preset-typescript` is required for TypeScript. |
| **package.json** | `typecheck`, `emit-declarations`; `@babel/runtime`; `@babel/preset-typescript`, `typescript` in devDependencies; optional `engines`/`browserslist` for consistency. |
| **Tailwind content** | `./ts/**/*.{ts,tsx,js,jsx}` (or equivalent) is needed so Tailwind sees classes in TS/TSX. |
| **Config only in Module update** | `tsconfig.json` (rootDir ts/, type-check, noEmit); `.eslintrc.cjs`; `.gitignore` for `.env`, etc. |
| **Source layout** | `ts/` (sections, components) and optional emit output for declarations. |

### Minimal changes to “be the same as New-theme” where possible

1. **PostCSS** — In Module update, set `browsers: 'last 2 versions'` on `postcss-preset-env` and add `autoprefixer: {}` so the plugin list and options match New-theme.
2. **Shell plugin** — Use the same onBuildStart/onBuildEnd strings (and emoji) as New-theme so dev UX is identical.
3. **Webpack optimization** — Optionally replace the single `sharedOptimization` with separate `if (mode === 'development')` and `if (mode === 'production')` blocks that mirror New-theme’s blocks (same options, just two blocks). Behavior stays the same; only structure aligns with New-theme.

---

# Part 2 — Deep dives

---

## 11. How tree-shaking drops `unusedExport`

### The source

- **`ts/lib/utils.ts`** (or any `ts/**/*.ts` module) exports e.g. `GreetOptions`, `greet`, `unusedExport`.
- An **entry** in `ts/sections/*.ts` only imports `greet` (and re-exports `greet` + type `GreetOptions`). It never imports `unusedExport`.

So from the entry point, `unusedExport` is **never used**.

### The mechanism (step by step)

1. **`package.json`: `"sideEffects": ["*.scss"]`**  
   Tells webpack: only SCSS is side-effectful; JS/TS can be tree-shaken. So webpack is allowed to remove whole exports if nothing uses them.

2. **Webpack: `optimization.usedExports: true`**  
   Webpack analyzes the dependency graph from each entry (e.g. `ts/sections/new.ts`):
   - It sees `index.ts` → imports `greet` from `./lib/utils`.
   - It marks `greet` (and `GreetOptions`, used by `greet`) as **used**.
   - It marks `unusedExport` as **unused** (no import path leads to it).

3. **Webpack: `optimization.sideEffects: true`**  
   Webpack respects each package’s `sideEffects` (and your app’s `sideEffects`). So it doesn’t have to keep `unusedExport` “just in case” it had side effects.

4. **Production: `mode: 'production'` → minification**  
   With `minimize: true`, webpack’s minimizer actually **removes** the dead code. `usedExports` only *marks* unused code; the minimizer **deletes** it from the bundle.

**Chain:** sideEffects → usedExports (mark unused) → sideEffects: true (allow removal) → minimize (delete unused) → **`unusedExport` is not in the section bundle**.

### Verification

After `yarn deploy` (or a production webpack build):

- `grep unusedExport assets/*.js` → no match in the section bundle that only uses `greet`.
- `grep greet assets/*.js` → match in that bundle (it’s used).

So tree-shaking did drop `unusedExport`.

### If it weren’t dropped

- If you did `import { greet, unusedExport } from '../lib/utils'` in a section file, then `unusedExport` would be marked used and would stay in the bundle.
- If you set `"sideEffects": true` (or omitted it) in `package.json`, webpack would be more conservative and might keep more code.
- In **development** (`yarn start`), `minimize` is false, so the bundle often still contains unused code for faster builds; tree-shaking is most visible in **production** builds.

---

## 12. How to add a new alias

Aliases let you write shorter or stable imports (e.g. `import X from 'Components/Button'` instead of `../../../components/Button`). You must add them in **two** places so both the build and TypeScript/editor understand the same paths.

### Step 1: Webpack (`webpack.config.js`)

In `resolve.alias`, add a new key (alias name) and value (absolute path):

```js
resolve: {
  extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  alias: {
    StyleComponents: path.resolve(__dirname, 'scss/components'),
    TsComponents: path.resolve(__dirname, 'ts/components'),
    // New alias example: "Components" -> "ts/components"
    Components: path.resolve(__dirname, 'ts/components'),
  },
},
```

- **Key** = what you write in imports (e.g. `Components` or `Components/Button`).
- **Value** = `path.resolve(__dirname, 'src/components')` so `Components/Button` resolves to `src/components/Button`.

### Step 2: TypeScript (`tsconfig.json`)

In `compilerOptions.paths`, add a matching pattern so types and IDE resolve the same way:

```json
"paths": {
  "StyleComponents/*": ["scss/components/*"],
  "TsComponents/*": ["ts/components/*"],
  "Components/*": ["ts/components/*"]
}
```

- **Key** = same “alias” name with `/*` (one segment) or `/*/*` (nested) if you need it.
- **Value** = array of path patterns relative to `baseUrl` (here `"."`), so `Components/Button` → `src/components/Button`.

### Step 3: Use it in code

```ts
// Before (relative)
import { Button } from '../components/Button';

// After (alias) — only works if the alias is in both webpack and tsconfig
import { Button } from 'TsComponents/Button';
```

### Checklist

| Step | File | What to add |
|------|------|-------------|
| 1 | `webpack.config.js` | `resolve.alias.AliasName: path.resolve(__dirname, 'path/to/dir')` |
| 2 | `tsconfig.json` | `"paths": { "AliasName/*": ["path/to/dir/*"] }` |
| 3 | Code | `import … from 'AliasName/...'` |

If you add the alias only in webpack, the build may succeed but TypeScript/IDE will show “cannot find module.” If you add it only in tsconfig, types may work but webpack won’t resolve the path. So both are required.
