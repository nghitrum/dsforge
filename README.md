# dsforge

[![CI](https://github.com/nghitrum/dsforge/actions/workflows/ci.yml/badge.svg)](https://github.com/nghitrum/dsforge/actions/workflows/ci.yml)

Your design tokens live in Figma. Your components drift from the spec. Your docs are six sprints out of date. dsforge fixes all three with one config file.

<video src="https://github.com/user-attachments/assets/727fcfe2-9814-49e6-9160-29b8b6590b6a" autoplay loop muted playsinline></video>

## Before / After

**Before**

- Design tokens transcribed by hand into CSS variables across three repos
- Component variants documented in a Notion page that nobody updates
- AI coding tools guessing at constraints because there is no machine-readable spec

**After**

```
design-system.config.json  →  dsforge generate
```

```
dist-ds/
├── src/           9 typed React components
├── tokens/        CSS custom properties, JS map, Tailwind extension
├── docs/          MDX documentation per component
├── metadata/      AI-readable JSON contracts per component
└── showcase.html  visual docs — open directly in the browser, no server
```

One config. One command. Everything consistent, everything regeneratable.

---

## Quick start

```bash
npx dsforge@latest init      # scaffold config + rules
npx dsforge@latest generate  # generate the full design system
npx dsforge@latest showcase  # open the visual docs in your browser
```

Output lands in `dist-ds/`. Regenerate it any time by running `generate` again.

---

## Config

`design-system.config.json` is the single source of truth. A minimal example:

```json
{
  "meta": { "name": "Acme DS", "version": "1.0.0" },
  "tokens": {
    "global": {
      "brand-600": "#2563eb",
      "neutral-900": "#0f172a",
      "neutral-0": "#ffffff"
    },
    "semantic": {
      "color-action": "{global.brand-600}",
      "color-text-primary": "{global.neutral-900}",
      "color-bg-default": "{global.neutral-0}"
    }
  },
  "typography": {
    "fontFamily": "Inter, system-ui, sans-serif",
    "roles": {
      "body": { "size": 16, "weight": 400, "lineHeight": 1.6 },
      "heading": { "size": 24, "weight": 700, "lineHeight": 1.2 }
    }
  },
  "themes": {
    "light": {},
    "dark": { "color-bg-default": "#0f172a", "color-text-primary": "#f1f5f9" }
  }
}
```

Tokens use a three-tier system: **global → semantic → component**. References use `{layer.key}` syntax and are resolved at generate time.

---

## What you get

### 9 React components

Button · Input · Card · Badge · Checkbox · Radio · Select · Spinner · Toast

Each component is typed, themed with your actual tokens, and ships with a prop table, copyable TSX examples, WCAG accessibility notes, and an AI metadata contract.

### CSS tokens

`base.css` — global and semantic CSS custom properties
`light.css` / `dark.css` — theme overrides
`tokens.js` — JS token map for runtime use
`tailwind.js` — Tailwind theme extension, ready to drop into `tailwind.config.js`

### MDX docs

One `.mdx` file per component, generated from your config. Import them into any docs site.

### AI metadata contracts

Each component emits `dist-ds/metadata/<component>.json`:

```json
{
  "component": "Button",
  "role": "action-trigger",
  "variants": ["primary", "secondary", "danger", "ghost"],
  "destructiveVariants": ["danger"],
  "accessibilityContract": {
    "keyboard": true,
    "focusRing": "required",
    "ariaLabel": "required-for-icon-only"
  },
  "aiGuidance": [
    "Use primary for the single most important action on a surface.",
    "Never place two primary buttons side by side.",
    "Use danger only for irreversible destructive actions."
  ]
}
```

AI coding assistants can read these before generating UI — no more inferring constraints from source code.

### Visual showcase

`showcase.html` is a self-contained documentation site. No build step, no server — open it directly in the browser.

Includes live component previews with all variants and states, themed with your actual tokens. Theme switching (light/dark) is built in when both themes are defined in config.

### npm-ready package

`dist-ds/` includes `package.json`, `tsconfig.json`, and a barrel `index.ts`. Run `npm publish` from `dist-ds/` to ship the design system as a package.

---

## Validation

`dsforge validate` runs nine health checks and produces a scored report:

| Check              | Max score |
| ------------------ | --------- |
| Token architecture | 15        |
| Typography         | 10        |
| Spacing            | 10        |
| Radius             | 5         |
| Elevation          | 5         |
| Motion             | 5         |
| Themes             | 10        |
| Token resolution   | 14        |
| Governance rules   | 15        |

Scores below 70 are flagged as warnings. WCAG contrast is checked automatically for all color token pairs.

`design-system.rules.json` encodes your governance constraints:

```json
{
  "governance": {
    "requireSemanticTokens": true,
    "forbidHardcodedColors": true,
    "requireAccessibilityProps": true
  }
}
```

---

## Diff

`dsforge diff old.config.json new.config.json` classifies every change:

- **BREAKING** — tokens removed or renamed that are referenced by components
- **CHANGED** — existing values modified
- **ADDED** — new tokens or sections

Run this before deploying a config update to understand downstream impact.

---

## Commands

| Command            | What it does                                                         |
| ------------------ | -------------------------------------------------------------------- |
| `dsforge init`     | Scaffold `design-system.config.json` and `design-system.rules.json`  |
| `dsforge generate` | Run the full pipeline — tokens, components, metadata, docs, showcase |
| `dsforge validate` | Run 9 health checks and score against governance rules               |
| `dsforge diff`     | Compare two configs — BREAKING / CHANGED / ADDED                     |
| `dsforge showcase` | Open `dist-ds/showcase.html` in your default browser                 |

Run `dsforge` with no arguments for an interactive menu.

---

## Coming next

- Additional components: Modal, Table, Tooltip, DatePicker
- **Pro**: AI-assisted token generation from brand guidelines or a Figma file
- Figma Variables API sync
- CI integration — fail builds on governance violations

---

## Development

```bash
git clone https://github.com/your-org/dsforge
cd dsforge
npm install

npm run dev       # run the CLI without a build step
npm run typecheck # type-check without emitting
npm test          # run the test suite
```

---

## License

MIT
