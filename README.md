# dsforge

**AI-native design system generator.** One config file. One command. Typed React components, CSS tokens, governance validation, MDX docs, and a live visual showcase — all wired together and ready to ship.

```
dsforge generate
```

---

## Why

Mid-sized teams repeat the same manual cycle: design tokens get transcribed by hand, components drift from specs, docs fall out of date, and AI coding tools have no way to know the rules. dsforge collapses that cycle into a single source of truth.

Write your design standards once in `design-system.config.json`. dsforge generates everything else — and keeps it consistent every time you run it.

---

## Installation

```bash
npm install -g dsforge
# or run without installing
npx dsforge
```

Requires **Node.js ≥ 18**.

---

## Quick start

```bash
# 1. Scaffold a config and rules file in the current directory
dsforge init

# 2. Generate the full design system
dsforge generate

# 3. Open the visual showcase in your browser
dsforge showcase
```

Output lands in `dist-ds/`. Everything in there is gitignored by default — regenerate it any time from the source config.

---

## Commands

| Command            | What it does                                                                      |
| ------------------ | --------------------------------------------------------------------------------- |
| `dsforge init`     | Interactively scaffold `design-system.config.json` and `design-system.rules.json` |
| `dsforge generate` | Run the full pipeline → tokens, components, metadata, docs, showcase              |
| `dsforge validate` | Run 9 health checks and score the config against your governance rules            |
| `dsforge diff`     | Compare two config files and report BREAKING / CHANGED / ADDED changes            |
| `dsforge showcase` | Open `dist-ds/showcase.html` in your default browser                              |

All commands are also available as an interactive menu: run `dsforge` with no arguments.

---

## Config file

`design-system.config.json` is the single source of truth. A minimal example:

```json
{
  "meta": { "name": "Acme DS", "version": "1.0.0" },

  "tokens": {
    "global": {
      "blue-600": "#2563eb",
      "gray-900": "#0f172a",
      "white": "#ffffff"
    },
    "semantic": {
      "color-action": "{global.blue-600}",
      "color-text-primary": "{global.gray-900}",
      "color-bg-default": "{global.white}"
    }
  },

  "typography": {
    "fontFamily": "Inter, system-ui, sans-serif",
    "roles": {
      "body": { "size": 14, "weight": 400, "lineHeight": 1.6 },
      "heading": { "size": 24, "weight": 700, "lineHeight": 1.2 }
    }
  },

  "spacing": { "baseUnit": 4, "scale": { "1": 4, "2": 8, "4": 16, "6": 24 } },
  "radius": { "sm": 2, "md": 4, "lg": 8, "full": 9999 },
  "elevation": { "0": "none", "1": "0 1px 3px rgb(0 0 0 / 0.1)" },
  "motion": {
    "duration": { "fast": 120, "base": 200 },
    "easing": { "ease": "ease-in-out" }
  },

  "themes": {
    "light": {},
    "dark": {
      "color-bg-default": "#0f172a",
      "color-text-primary": "#f8fafc"
    }
  }
}
```

Tokens use a three-tier system: **global → semantic → component**. References use `{layer.key}` syntax and are resolved at generate time.

---

## Rules file

`design-system.rules.json` encodes your governance constraints. dsforge validates the generated output against them:

```json
{
  "governance": {
    "requireSemanticTokens": true,
    "forbidHardcodedColors": true,
    "requireAccessibilityProps": true
  },
  "components": {
    "button": {
      "allowedVariants": ["primary", "secondary", "danger", "ghost"],
      "requiredProps": ["children"]
    }
  }
}
```

---

## Output structure

Running `dsforge generate` produces:

```
dist-ds/
├── package.json          — publishable package manifest
├── tsconfig.json
├── README.md
├── CHANGELOG.md          — preserved on subsequent runs; edit freely
│
├── src/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── ThemeProvider.tsx
│   └── index.ts          — barrel export
│
├── tokens/
│   ├── base.css          — global + semantic CSS custom properties
│   ├── light.css         — light theme overrides
│   ├── dark.css          — dark theme overrides
│   ├── tokens.js         — JS token map
│   └── tailwind.js       — Tailwind theme extension
│
├── metadata/
│   ├── index.json        — system-level metadata
│   ├── button.json       — per-component AI contract
│   ├── input.json
│   └── card.json
│
├── docs/
│   ├── index.mdx
│   ├── button.mdx
│   ├── input.mdx
│   └── card.mdx
│
├── assets/
│   └── favicon.svg
│
└── showcase.html         — self-contained visual docs (no server needed)
```

---

## Showcase

`showcase.html` is a zero-dependency self-contained documentation site. Open it directly in a browser — no build step, no server.

It includes:

- **Foundations** — color swatches, type scale, spacing bars, radius previews, elevation levels, motion previews with live animation
- **Components** — each component gets five tabs:
  - **Overview** — live previews of all variants and states, themed with your actual tokens
  - **Props** — full prop table with types, defaults, and required flag
  - **Examples** — copyable TSX snippets with live previews
  - **Accessibility** — WCAG criterion cards with level badges
  - **AI Metadata** — the JSON contract with copyable output and usage guidance

Theme switching (light/dark) is built in when both themes are defined in config.

---

## AI metadata

Each component emits a machine-readable contract to `dist-ds/metadata/<component>.json`:

```json
{
  "component": "Button",
  "role": "action-trigger",
  "hierarchyLevel": "primary",
  "interactionModel": "synchronous",
  "layoutImpact": "inline",
  "destructiveVariants": ["danger"],
  "accessibilityContract": {
    "keyboard": true,
    "focusRing": "required",
    "ariaLabel": "required-for-icon-only"
  },
  "variants": ["primary", "secondary", "danger", "ghost"],
  "aiGuidance": [
    "Use primary for the single most important action on a surface.",
    "Never place two primary buttons side by side.",
    "Use danger only for irreversible destructive actions."
  ]
}
```

AI coding assistants can read this before generating UI to understand constraints, hierarchy, and accessibility requirements — without having to infer them from component source code.

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

Scores below 70 are flagged as warnings; errors always require resolution. WCAG contrast is checked automatically for all color token pairs.

---

## Diff

`dsforge diff old.config.json new.config.json` compares two configs and classifies every change:

- **BREAKING** — tokens removed or renamed that are referenced by components
- **CHANGED** — existing values modified
- **ADDED** — new tokens or sections

Use this before deploying a config update to understand downstream impact.

---

## Development

```bash
git clone https://github.com/your-org/dsforge
cd dsforge
npm install

# Run the CLI in dev mode (no build step needed)
npm run dev

# Type-check
npm run typecheck

# Run tests
npm test
```

---

## Project structure

```
src/
├── cli/
│   ├── index.ts              — entry point + subcommand routing
│   ├── menu.ts               — interactive menu loop
│   ├── prompt.ts             — shared readline helpers
│   └── commands/
│       ├── init.ts
│       ├── generate.ts
│       ├── validate.ts
│       ├── diff.ts
│       └── showcase.ts
│
├── core/
│   └── token-resolver.ts     — three-tier token resolution engine
│
├── generators/
│   ├── tokens/               — CSS custom properties + JS/Tailwind maps
│   ├── components/           — Button, Input, Card, ThemeProvider
│   ├── metadata/             — AI contract generator
│   ├── docs/                 — MDX generator
│   ├── package/              — package.json, tsconfig, README, CHANGELOG
│   └── showcase/             — self-contained HTML docs generator
│
├── schema/
│   └── config.schema.ts      — Zod schemas for config + rules
│
├── types/
│   └── index.ts              — all shared TypeScript types
│
└── utils/
    ├── fs.ts                 — file I/O helpers
    ├── logger.ts             — chalk-based CLI logger
    └── contrast.ts           — WCAG contrast math
```

---

## Roadmap

- More components: Modal, Select, Toast, Table
- AI-assisted token suggestions from brand guidelines
- Figma token sync via Variables API
- Change impact report with semantic versioning inference
- CI/CD integration — fail builds on governance violations
- Hosted platform for team collaboration

---

## License

MIT
