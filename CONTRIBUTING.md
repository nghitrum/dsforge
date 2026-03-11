# Contributing to dsforge

---

## Prerequisites

- **Node.js ≥ 18** — check with `node --version`
- Git

```bash
git clone https://github.com/nghitrum/dsforge
cd dsforge
npm install
```

---

## Running locally

Build the TypeScript source, then run the CLI from the built output:

```bash
npm run build
node dist/cli/index.js --help
```

For a faster edit-and-run cycle during development, use `tsx` to run directly from source — no build step required:

```bash
npm run dev
# equivalent: npx tsx src/cli/index.ts
```

To test the full generate pipeline against a local config:

```bash
# from the project root
npm run dev -- init     # scaffold a config
npm run dev -- generate # run the pipeline
npm run dev -- showcase # open the result
```

---

## Running tests

```bash
npm test
```

The test suite uses [Vitest](https://vitest.dev/) and covers:

- **Token resolver** (`src/core/token-resolver.test.ts`) — the three-tier resolution engine, circular reference detection, and unresolved reference reporting
- **React adapter** (`src/adapters/__tests__/react-adapter.test.ts`) — component generation, token injection, and variant handling for all 9 components

To run tests in watch mode:

```bash
npm run test:watch
```

To type-check without emitting:

```bash
npm run typecheck
```

---

## Adding a component

Each component requires four changes. Use an existing component (e.g. `badge`) as a reference.

### 1. Create the React component generator

**File:** `src/adapters/react/components/{name}.ts`

Export a single function `generate{Name}(config, rule): string` that returns the full `.tsx` source as a string. The function receives the resolved config and the component's rules entry.

```
src/adapters/react/components/badge.ts   ← reference implementation
```

### 2. Create the showcase definition

**File:** `src/generators/showcase/components/{name}.ts`

Export a `{name}Def` factory function with the signature:

```ts
(config: DesignSystemConfig, tokens: Record<string, string>) => ComponentDef
```

`ComponentDef` describes the live previews, prop table, code examples, and accessibility notes that appear in the showcase. See `src/generators/showcase/types.ts` for the full type definition and `src/generators/showcase/components/badge.ts` for a minimal example.

### 3. Register in the showcase

**File:** `src/generators/showcase/registry.ts`

Import the def and add an entry to `SHOWCASE_COMPONENTS`:

```ts
import { {name}Def } from "./components/{name}";

// in SHOWCASE_COMPONENTS:
{
  id: "{name}",
  label: "{Name}",
  pageDescription: "One sentence describing what this component does.",
  def: {name}Def,
},
```

### 4. Register in the React adapter

**File:** `src/adapters/react/index.ts`

Import the generator, add the component name to `REACT_COMPONENTS`, and add a `case` to the `generateComponent` switch:

```ts
import { generate{Name} } from "./components/{name}";

export const REACT_COMPONENTS = [
  // ... existing entries
  "{name}",
] as const;

// in the switch statement:
case "{name}":
  content = generate{Name}(config, rule);
  break;
```

After all four changes, run `npm run build && node dist/cli/index.js generate` to confirm the component appears in `dist-ds/src/` and in the showcase.

---

## Submitting a PR

**Branch naming:** `feat/{description}`, `fix/{description}`, or `chore/{description}`.

**What to include:**

- The code change
- A test if the change affects the token resolver or adapter logic
- An update to `CHANGELOG.md` under the `Unreleased` section

**What reviewers check:**

- `npm test` passes with no failures
- `npm run typecheck` passes with no errors
- `npm run build` completes without warnings
- `node dist/cli/index.js validate` passes against `tests/fixtures/design-system.config.json`
- New component generators include a showcase definition and are registered in both `registry.ts` and `index.ts`
- No hardcoded values that belong in config
