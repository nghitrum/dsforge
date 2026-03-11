/**
 * Density preset definitions.
 *
 * This is the single source of truth for compact / comfortable / spacious
 * spacing and radius values. Imported by:
 *   - cli/commands/init.ts     (initial config scaffolding)
 *   - cli/commands/generate.ts (re-applying preset on each generate run)
 *   - generators/tokens/css-vars.ts (emitting density.css for Pro)
 *   - generators/showcase/html.ts  (embedding density CSS in showcase)
 */

import type { DesignSystemConfig } from "../types/index";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Preset = "compact" | "comfortable" | "spacious";

export const PRESETS: readonly Preset[] = [
  "compact",
  "comfortable",
  "spacious",
] as const;

// ─── Spacing scales ───────────────────────────────────────────────────────────

export const SPACING_PRESETS: Record<Preset, Record<string, number>> = {
  compact: {
    "1": 2,
    "2": 4,
    "3": 8,
    "4": 12,
    "5": 16,
    "6": 24,
    "7": 32,
    "8": 48,
  },
  comfortable: {
    "1": 4,
    "2": 8,
    "3": 12,
    "4": 16,
    "5": 24,
    "6": 32,
    "7": 48,
    "8": 64,
  },
  spacious: {
    "1": 6,
    "2": 12,
    "3": 18,
    "4": 24,
    "5": 36,
    "6": 48,
    "7": 72,
    "8": 96,
  },
};

// ─── Radius scales ────────────────────────────────────────────────────────────

export const RADIUS_PRESETS: Record<Preset, Record<string, number>> = {
  compact: { none: 0, sm: 2, md: 3, lg: 6, xl: 10, full: 9999 },
  comfortable: { none: 0, sm: 2, md: 4, lg: 8, xl: 16, full: 9999 },
  spacious: { none: 0, sm: 3, md: 6, lg: 12, xl: 20, full: 9999 },
};

// ─── Base units ───────────────────────────────────────────────────────────────

export const PRESET_BASE_UNITS: Record<Preset, number> = {
  compact: 2,
  comfortable: 4,
  spacious: 6,
};

// ─── Semantic spacing builder ─────────────────────────────────────────────────

/**
 * Derives semantic spacing token values from a raw scale.
 * Keys match the names emitted as CSS custom properties in base.css.
 */
export function buildSemanticSpacing(
  scale: Record<string, number>,
): Record<string, string> {
  return {
    "component-padding-xs": `${scale["1"]}`,
    "component-padding-sm": `${scale["2"]}`,
    "component-padding-md": `${scale["4"]}`,
    "component-padding-lg": `${scale["5"]}`,
    "layout-gap-xs": `${scale["2"]}`,
    "layout-gap-sm": `${scale["3"]}`,
    "layout-gap-md": `${scale["5"]}`,
    "layout-gap-lg": `${scale["6"]}`,
    "layout-section": `${scale["7"]}`,
  };
}

// ─── Preset applicator ────────────────────────────────────────────────────────

/**
 * Re-applies a preset's spacing and radius values to an existing config object.
 * Called during `generate` so that config.meta.preset is always live — editing
 * that field in design-system.config.json and re-running generate is enough to
 * switch density without re-running init.
 */
export function applyPreset(config: DesignSystemConfig, preset: Preset): void {
  const scale = SPACING_PRESETS[preset];
  const radius = RADIUS_PRESETS[preset];
  const baseUnit = PRESET_BASE_UNITS[preset];

  config.spacing = {
    ...config.spacing,
    baseUnit,
    scale,
    semantic: buildSemanticSpacing(scale),
  };

  config.radius = { ...config.radius, ...radius };

  config.philosophy = {
    ...config.philosophy,
    density: preset,
  };
}
