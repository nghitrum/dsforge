# dsforge

> AI-Native Design System Generator

Transform a simple config file into production-ready React components, typed design tokens, AI-consumable metadata, governance validation, and a live visual showcase — all from the CLI.

---

## What it does

You define your brand in two files. dsforge takes care of the rest.

```
design-system.config.json   →   tokens, components, docs, metadata
design-system.rules.json    →   governance validation
```

**What gets generated:**

- **Tokens** — typed TypeScript + CSS custom properties
- **Components** — `Button`, `Input`, `Card`, `Typography`, `Stack` in React + TypeScript, with accessibility built in
- **Metadata** — AI-consumable JSON describing each component's role, interaction model, and accessibility contract
- **Docs** — Storybook-ready MDX files
- **Showcase** — a live visual app to browse your entire design system (HTML or Vite + React)

---

## Getting started

### In your project

```bash
npx dsforge
```

That's it. The interactive menu guides you through the rest.

Or run commands directly:

```bash
npx dsforge init       # create config files
npx dsforge generate   # generate everything
npx dsforge validate   # check governance rules
npx dsforge showcase   # launch the visual showcase
```

### As a contributor

```bash
git clone https://github.com/nghitrum/dsforge
cd dsforge
npm install
npm run dev          # interactive menu via ts-node
```

---

## Commands

| Command                   | What it does                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| `dsforge init`            | Creates `design-system.config.json` and `design-system.rules.json` in the current directory |
| `dsforge generate`        | Generates tokens, components, metadata, and docs into `generated/`                          |
| `dsforge validate`        | Runs governance validation against your rules file                                          |
| `dsforge showcase`        | Generates and launches a visual design system showcase                                      |
| `dsforge showcase --html` | Generates a self-contained HTML file and opens it in your browser                           |
| `dsforge showcase --vite` | Generates a Vite + React app, installs deps, and starts the dev server                      |

---

## Config files

### `design-system.config.json`

Defines your brand tokens. This file is committed to git.

```json
{
  "typography": {
    "fontFamily": "Inter",
    "scale": [12, 14, 16, 20, 24, 32],
    "fontWeights": [400, 500, 600]
  },
  "spacing": { "baseUnit": 4 },
  "radius": { "scale": [2, 4, 8, 16] },
  "color": {
    "primary": "#2563eb",
    "secondary": "#64748b",
    "danger": "#dc2626",
    "background": "#ffffff",
    "text": "#111827"
  },
  "philosophy": {
    "density": "comfortable",
    "elevation": "minimal"
  }
}
```

### `design-system.rules.json`

Defines governance rules per component. Also committed to git.

```json
{
  "button": {
    "allowedVariants": ["primary", "secondary", "danger"],
    "maxWidth": "300px",
    "colorPalette": ["primary", "secondary", "danger"],
    "requiredAccessibility": ["aria-label", "keyboard-support"]
  },
  "card": {
    "maxWidth": "600px",
    "borderRadius": ["2px", "4px", "8px"],
    "allowedShadows": ["none", "small", "medium"]
  }
}
```

---

## Generated output

Everything in `generated/` is derived from your config — never edit it by hand. Re-run `dsforge generate` to rebuild.

```
generated/
├── tokens/
│   ├── index.ts          ← typed token object
│   └── tokens.css        ← CSS custom properties
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Typography.tsx
│   ├── Stack.tsx
│   └── index.ts          ← barrel export
├── metadata/
│   ├── Button.json        ← AI-consumable metadata
│   ├── Input.json
│   ├── Card.json
│   └── index.json
├── docs/
│   ├── index.mdx
│   ├── Button.mdx
│   ├── Input.mdx
│   └── Card.mdx
└── showcase/
    └── index.html         ← or a full Vite app
```

---

## Governance validation

`dsforge validate` checks your generated components against `design-system.rules.json` and reports any violations:

```
Governance Validation Report
════════════════════════════════════════
✅ Button — no issues
✅ Input  — no issues

📦 Card
  ⚠ [WARNING] borderRadius "16px" is not in allowed values: [2px, 4px, 8px]

────────────────────────────────────────
Summary: 0 error(s), 1 warning(s)
⚠️  Validation passed with warnings
```

Errors exit with a non-zero code, making it easy to block CI on violations.

---

## AI metadata

Each component gets a machine-readable metadata file designed for AI agents to consume before generating UI:

```json
{
  "component": "Button",
  "role": "action-trigger",
  "hierarchyLevel": "primary",
  "interactionModel": "synchronous",
  "layoutImpact": "inline",
  "destructive": false,
  "accessibilityContract": {
    "keyboard": true,
    "focusRing": "required",
    "ariaLabel": "required-for-icon-only"
  },
  "variants": ["primary", "secondary", "danger"],
  "tokens": {
    "colorPrimary": "#2563eb",
    "borderRadius": "4px"
  }
}
```

---

## Project structure

```
dsforge/
├── src/
│   ├── cli/
│   │   ├── index.ts              ← CLI entrypoint, shared prompt() utility
│   │   └── commands/
│   │       ├── init.ts
│   │       ├── generate.ts
│   │       ├── validate.ts
│   │       └── showcase.ts
│   ├── generators/
│   │   ├── tokens.ts
│   │   ├── components.ts
│   │   ├── metadata.ts
│   │   ├── docs.ts
│   │   └── showcase.ts           ← HTML + Vite app builder
│   ├── validators/
│   │   └── governance.ts
│   ├── utils/
│   │   └── config-loader.ts
│   └── types.ts
├── design-system.config.json     ← your brand config (committed in user projects)
├── design-system.rules.json      ← your governance rules (committed in user projects)
└── generated/                    ← always gitignored
```

---

## Development scripts

```bash
npm run dev          # run CLI via ts-node (interactive menu)
npm run dev -- init      # run a specific command
npm run dev -- generate
npm run dev -- validate
npm run dev -- showcase
npm run build        # compile TypeScript → dist/
npm run typecheck    # type-check without emitting
```

---

## Roadmap

- [ ] More components — Modal, Table, Dropdown, Badge
- [ ] Figma token integration
- [ ] AI-assisted variant suggestions
- [ ] Migration / change impact reports (`dsforge diff`)
- [ ] CI/CD integration guide
- [ ] Hosted platform for teams
