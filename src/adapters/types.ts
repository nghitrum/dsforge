/**
 * src/adapters/types.ts
 *
 * The FrameworkAdapter contract.
 *
 * Every framework adapter — React (current), Vue, Angular, Svelte, React Native,
 * or any future enterprise custom target — must satisfy this interface.
 *
 * Why this exists
 * ───────────────
 * The generate pipeline in src/cli/commands/generate.ts currently hard-codes
 * calls to React-specific generators (generateButton, generateInput, etc.).
 * This interface extracts the shape of those responsibilities so the pipeline
 * can call adapter.generateComponent("Button", ...) instead, and each new
 * framework becomes a single file that satisfies this contract.
 *
 * Scope: what lives in the adapter layer
 * ───────────────────────────────────────
 * Framework-specific outputs — things that change when you target Vue vs React:
 *   • Component source files (TSX → SFC .vue → Angular @Component)
 *   • Theme provider (React context vs Vue provide/inject vs Angular service)
 *   • Barrel index (re-export syntax differs across module formats)
 *   • Token files (CSS vars are universal; React Native needs a JS-only object)
 *   • Component documentation (MDX imports React; Vue Storybook is different)
 *   • Package manifest (peerDependencies, engines, and exports map differ)
 *
 * Framework-agnostic outputs — NOT in the adapter (stay in the core pipeline):
 *   • Token resolution (token-resolver.ts)
 *   • Validation and WCAG checks
 *   • AI metadata JSON (machine-readable; framework-neutral)
 *   • Diff engine and changelog
 */

import type {
  DesignSystemConfig,
  RulesConfig,
  ComponentRule,
} from "../types/index";
import type { ResolutionResult } from "../core/token-resolver";
import type { ComponentMetadata } from "../generators/metadata/generator";

// ─── Shared output type ───────────────────────────────────────────────────────

/**
 * A single generated file, ready to be written to disk.
 *
 * Consolidates the ad-hoc { filename, content } shapes that appear throughout
 * the codebase as CssFile, MetadataFile, DocFile, etc.
 *
 * `filename` is always relative to the adapter's output sub-directory.
 * The pipeline is responsible for constructing the full absolute path.
 *
 * @example
 *   { filename: "Button.tsx",  content: "import React from 'react'; ..." }
 *   { filename: "base.css",    content: ":root { --color-action: #2563eb }" }
 *   { filename: "button.mdx",  content: "---\ntitle: Button\n---\n..." }
 */
export interface GeneratedFile {
  filename: string;
  content: string;
}

// ─── FrameworkAdapter ─────────────────────────────────────────────────────────

/**
 * The contract every framework adapter must satisfy.
 *
 * The generate pipeline calls these methods in order:
 *   1. generateTokenFiles  — tokens/
 *   2. generateComponent   — src/<Name>.<ext>   (once per component)
 *   3. generateThemeProvider — src/ThemeProvider.<ext>
 *   4. generateComponentIndex — src/index.<ext>
 *   5. generateDocs        — docs/
 *   6. generatePackageManifest — package.json
 *
 * Each method must be pure: given the same inputs it must produce the same
 * outputs. No side effects, no disk I/O.
 */
export interface FrameworkAdapter {
  // ─── Identity ──────────────────────────────────────────────────────────────

  /**
   * Stable machine identifier for this adapter.
   * Used in config (output.target), log messages, and test fixtures.
   *
   * Convention: lowercase, no spaces.
   * @example "react" | "vue" | "angular" | "svelte" | "react-native"
   */
  readonly name: string;

  /**
   * File extension applied to every generated component file.
   *
   * The generate pipeline appends this to the component name to form the
   * output filename, e.g. `Button` + `.tsx` → `Button.tsx`.
   *
   * @example "tsx" | "vue" | "component.ts" | "ts"
   */
  readonly componentExtension: string;

  // ─── Component generation ──────────────────────────────────────────────────

  /**
   * Generate the source file for a single named component.
   *
   * The pipeline iterates over all component names defined in the rules config
   * and calls this method once per component. Unknown component names (ones
   * without a specific implementation in the adapter) should fall back to a
   * minimal compliant stub rather than throwing, so the pipeline stays
   * resilient when new component names are added to rules.json.
   *
   * Contract:
   *   • `result.filename` must equal `<PascalCaseName>.<componentExtension>`
   *   • The generated file must compile cleanly for the target framework
   *   • All visual values must be sourced from CSS custom properties or the
   *     resolved token map — no hard-coded color/spacing literals
   *   • The component must satisfy the accessibility requirements in `rule.a11y`
   *
   * @param componentName  PascalCase component name, e.g. "Button", "Input"
   * @param config         The full resolved design system configuration
   * @param rule           Governance rules for this component, or undefined if
   *                       no rule was defined (adapter should use safe defaults)
   */
  generateComponent(
    componentName: string,
    config: DesignSystemConfig,
    rule: ComponentRule | undefined,
  ): GeneratedFile;

  /**
   * Generate the theme provider for this framework.
   *
   * The theme provider is responsible for:
   *   • Accepting a theme name at runtime (e.g. "light" | "dark")
   *   • Applying the correct CSS custom property overrides to a root element
   *     (or equivalent mechanism in the target framework)
   *   • Exposing a hook/composable/service for consumers to read + change the
   *     active theme
   *
   * Contract:
   *   • `result.filename` must equal `ThemeProvider.<componentExtension>`
   *   • Theme names must be derived from `Object.keys(config.themes ?? {})`
   *   • The default theme should be "light" if present, otherwise the first key
   *
   * @param config  Full design system configuration, including themes map
   */
  generateThemeProvider(config: DesignSystemConfig): GeneratedFile;

  /**
   * Generate the barrel index that re-exports all generated components.
   *
   * Consumers import from the package root via this file:
   *   `import { Button, ThemeProvider } from "@myorg/my-ds"`
   *
   * Contract:
   *   • `result.filename` must equal `index.<componentExtension>`
   *     (or `index.ts` for frameworks that separate type and runtime exports)
   *   • All names in `componentNames` plus ThemeProvider must be re-exported
   *   • The file must not contain any implementation logic — only re-exports
   *
   * @param config          Full design system configuration
   * @param componentNames  PascalCase component names that were successfully
   *                        generated (may be a subset of rules keys if any
   *                        generation step failed)
   */
  generateComponentIndex(
    config: DesignSystemConfig,
    componentNames: string[],
  ): GeneratedFile;

  // ─── Token output ──────────────────────────────────────────────────────────

  /**
   * Generate all token output files for this framework.
   *
   * The default React adapter produces:
   *   • tokens/base.css      — all structural tokens as CSS custom properties
   *   • tokens/light.css     — light theme overrides
   *   • tokens/dark.css      — dark theme overrides
   *   • tokens/tokens.js     — ESM export of all resolved tokens as JS consts
   *   • tokens/tailwind.js   — Tailwind CSS theme extension object
   *
   * Other adapters may produce different formats. React Native would emit a
   * tokens/tokens.ts with numeric values (no CSS vars); Angular might produce
   * a SCSS variables file in addition to CSS custom properties.
   *
   * Contract:
   *   • All returned filenames must be relative to the `tokens/` subdirectory
   *   • At minimum, one file must carry the full resolved semantic token set
   *     in a format the adapter's components can consume at runtime
   *   • The token values must match `resolution.tokens` exactly — no
   *     re-resolution or value transformation in the adapter
   *
   * @param config      Full design system configuration
   * @param resolution  Pre-resolved token map from the core token resolver
   */
  generateTokenFiles(
    config: DesignSystemConfig,
    resolution: ResolutionResult,
  ): GeneratedFile[];

  // ─── Documentation ────────────────────────────────────────────────────────

  /**
   * Generate component documentation files for this framework.
   *
   * The React adapter produces MDX files with live React component previews.
   * A Vue adapter would produce MDX with `<script setup>` examples. Angular
   * might produce plain Markdown with Angular template snippets.
   *
   * Contract:
   *   • Must always produce at least one `index.<ext>` overview file
   *   • Per-component docs must be named `<componentName>.<ext>` matching the
   *     component names in `rules`
   *   • Code examples in docs must use the correct framework import syntax,
   *     pointing to the published package name from `config.meta`
   *   • Docs must be kept in sync with `metadataMap` — props, variants, and
   *     accessibility requirements must reflect the metadata, not be hardcoded
   *
   * @param config       Full design system configuration
   * @param rules        Governance rules (source of truth for variants + props)
   * @param metadataMap  Pre-generated AI metadata per component (use as the
   *                     single source of truth for component capabilities)
   */
  generateDocs(
    config: DesignSystemConfig,
    rules: RulesConfig,
    metadataMap: Record<string, ComponentMetadata>,
  ): GeneratedFile[];

  // ─── Package manifest ─────────────────────────────────────────────────────

  /**
   * Generate the package.json for the published design system package.
   *
   * The published package is what downstream consumers install — it is
   * distinct from the dsforge tool itself.
   *
   * Framework differences here are significant:
   *   • React:        peerDependencies: { react: ">=17", react-dom: ">=17" }
   *   • Vue:          peerDependencies: { vue: ">=3" }
   *   • Angular:      peerDependencies: { @angular/core: ">=15" }
   *   • React Native: peerDependencies: { react-native: ">=0.70" }
   *   • Svelte:       peerDependencies: { svelte: ">=3" }
   *
   * The `exports` map should expose the correct entry points for the framework
   * (e.g. Vue SFC consumers need `.vue` source files, not pre-compiled JS).
   *
   * Contract:
   *   • `result.filename` must equal `package.json`
   *   • `result.content` must be valid JSON parseable by `JSON.parse`
   *   • `name` field must be `${config.meta.npmScope}/${config.meta.name}`
   *   • `version` field must equal `config.meta.version`
   *
   * @param config          Full design system configuration
   * @param componentNames  Names of all successfully generated components
   */
  generatePackageManifest(
    config: DesignSystemConfig,
    componentNames: string[],
  ): GeneratedFile;
}

// ─── Adapter registry type ────────────────────────────────────────────────────

/**
 * A lookup map of adapter name → adapter instance.
 *
 * The generate pipeline resolves the active adapter from this map using
 * `config.output?.target ?? "react"` once Task 3 adds that config field.
 *
 * @example
 *   const registry: AdapterRegistry = {
 *     react:  new ReactAdapter(),
 *     vue:    new VueAdapter(),
 *   };
 *   const adapter = registry[config.output?.target ?? "react"];
 */
export type AdapterRegistry = Record<string, FrameworkAdapter>;
