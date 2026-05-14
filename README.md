# Module update

TypeScript build with tree-shaking (app code + node_modules).

## Global variables & paths

- **TsComponents/** → `ts/components`
- **StyleComponents/** → `scss/components`
- **ts/sections/** — TS/TSX entry points (one bundle per file); **js/sections/** — optional JS/JSX entries
- **assets/** — build output (`[name].js`, `vendors.js`, `shared.js`, `[name].css`)

## Shopify theme folders

| Folder | Purpose |
|--------|--------|
| **assets** | Theme assets; webpack outputs built JS and CSS here. |
| **blocks** | Theme app blocks (JSON). |
| **config** | `settings_schema.json`, `settings_data.json`. |
| **layout** | Layout files (e.g. `theme.liquid`). |
| **locales** | Translations (e.g. `en.default.json`). |
| **sections** | Theme sections (`.liquid` + `.json`). |
| **snippets** | Reusable Liquid snippets. |
| **templates** | Theme templates (e.g. `index.json`, `page.json`). |
| **ts** | TypeScript source: `ts/sections/` (entries), `ts/components/` (TsComponents alias). |
| **js** | Optional JS/JSX section entries (`js/sections/`). |
| **scss** | SCSS: `scss/sections/` (e.g. `common-imports.scss` → `assets/common-imports.css`), `scss/components/` (StyleComponents). |

## How to get started

1. Clone or move this repo; install [Yarn](https://formulae.brew.sh/formula/yarn/) and [asdf](https://asdf-vm.com/guide/getting-started.html) if needed.
2. Run `asdf install` then `yarn`.
3. Copy `.env` from `sampleenv` and set `STORE_URL` and `THEME_ID` for Shopify.
4. **`yarn start`** — type-check + webpack watch (development).
5. **`yarn deploy`** — production webpack build then `shopify theme push`.
6. **`yarn typecheck`** — TypeScript type-check only.
7. **`yarn lint`** — ESLint on `ts/`.

## Config files

| File | Purpose |
|------|--------|
| **yarn.lock** | Lockfile (use `yarn`, not npm). |
| **webpack.config.js** | Entry (scss + ts/sections + js/sections), Babel, SCSS, ForkTsChecker, ESLint, output to `assets/`. |
| **tsconfig.json** | TypeScript: `rootDir` `ts/`, type-check, optional `yarn emit-declarations`. |
| **.babelrc** | Babel: preset-env, preset-react, preset-typescript, transform-runtime. |
| **.eslintrc.cjs** | ESLint for `ts/` (used in webpack build). |
| **postcss.config.js** | PostCSS: tailwindcss, postcss-preset-env (autoprefixer). |
| **tailwind.config.js** | Tailwind content paths and theme. |

## More docs

- **ARCHITECTURE.md** — project layout, build pipeline, tree-shaking, scripts.
- **REFERENCE.md** — comparison with New-theme, deep dives (tree-shaking, adding aliases).
