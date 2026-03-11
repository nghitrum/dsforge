/**
 * Showcase generator — entry point.
 *
 * Assembles the final self-contained HTML file from:
 *   registry.ts               — all component entries (add new components here)
 *   types.ts                  — shared interfaces + helpers
 *   foundations.ts            — color / typography / spacing / radius / elevation / motion
 *   page.ts                   — tab page renderer (buildComponentPage)
 */

import type { DesignSystemConfig } from "../../types/index";
import type { ResolutionResult } from "../../core/token-resolver";
import { esc } from "./types";
import { isProUnlocked } from "../../lib/license";
import {
  PRESETS,
  SPACING_PRESETS,
  RADIUS_PRESETS,
  buildSemanticSpacing,
  type Preset,
} from "../../presets/index";
import {
  buildColorSection,
  buildTypographySection,
  buildSpacingSection,
  buildRadiusSection,
  buildElevationSection,
  buildMotionSection,
} from "./foundations";
import { buildComponentPage } from "./page";
import { SHOWCASE_COMPONENTS } from "./registry";

// ─── generateShowcase ─────────────────────────────────────────────────────────

/** Build inline CSS for all three density presets as [data-density] selectors. */
function buildDensityCss(): string {
  const blocks: string[] = [];
  for (const preset of PRESETS) {
    const scale = SPACING_PRESETS[preset];
    const radius = RADIUS_PRESETS[preset];
    const semantic = buildSemanticSpacing(scale);
    const vars: string[] = [];
    for (const [k, v] of Object.entries(scale)) vars.push(`  --spacing-${k}: ${v}px;`);
    for (const [k, v] of Object.entries(semantic)) vars.push(`  --${k}: ${v}px;`);
    for (const [k, v] of Object.entries(radius))
      vars.push(`  --radius-${k}: ${v === 9999 ? "9999px" : `${v}px`};`);
    blocks.push(`    [data-density="${preset}"] {\n${vars.join("\n")}\n    }`);
  }
  return blocks.join("\n");
}

export function generateShowcase(
  config: DesignSystemConfig,
  resolution: ResolutionResult,
): string {
  const tokens = resolution.tokens;
  const name = config.meta?.name ?? "Design System";
  const version = config.meta?.version ?? "0.1.0";
  const themes = Object.keys(config.themes ?? {});
  const defaultDensity: Preset = (config.meta?.preset as Preset) ?? "comfortable";

  const foundationItems = [
    { id: "colors", label: "Colors" },
    { id: "typography", label: "Typography" },
    { id: "spacing", label: "Spacing" },
    { id: "radius", label: "Border Radius" },
    { id: "elevation", label: "Elevation" },
    { id: "motion", label: "Motion" },
  ];

  const componentItems = SHOWCASE_COMPONENTS.map(({ id, label }) => ({ id, label }));

  const allItems = [...foundationItems, ...componentItems];

  const isPro = isProUnlocked();

  const sections: Record<string, string> = {
    colors: buildColorSection(config, tokens),
    typography: buildTypographySection(config),
    spacing: buildSpacingSection(config),
    radius: buildRadiusSection(config),
    elevation: buildElevationSection(config),
    motion: buildMotionSection(config),
    ...Object.fromEntries(
      SHOWCASE_COMPONENTS.map((entry) => [
        entry.id,
        buildComponentPage(entry.def(config, tokens), isPro),
      ]),
    ),
  };

  const flatTokens = Object.fromEntries(
    Object.entries(tokens).map(([k, v]) => [
      k.replace(/^(global|semantic|component)\./, ""),
      v,
    ]),
  );
  const lightTheme = config.themes?.["light"] ?? {};
  const darkTheme = config.themes?.["dark"] ?? {};

  const themeCssLight = Object.entries({ ...flatTokens, ...lightTheme })
    .map(([k, v]) => `  --${k}: ${v};`)
    .join("\n");
  const themeCssDark = Object.entries({ ...flatTokens, ...darkTheme })
    .map(([k, v]) => `  --${k}: ${v};`)
    .join("\n");

  const densityCss = buildDensityCss();

  return `<!DOCTYPE html>
<html lang="en" data-theme="light" data-density="${defaultDensity}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(name)} — Design System Docs</title>
  <link rel="icon" type="image/svg+xml" href="../assets/favicon.svg" />
  <style>
    /* ── Theme tokens ──────────────────────────────────── */
    [data-theme="light"] {
${themeCssLight}
    }
    [data-theme="dark"] {
${themeCssDark}
    }

    /* ── Density presets ───────────────────────────────── */
${densityCss}

    /* ── Reset + base ──────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 16px; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--color-bg-subtle, #f8fafc);
      color: var(--color-text-primary, #0f172a);
      display: flex; min-height: 100vh; line-height: 1.5;
    }

    /* ── Sidebar ──────────────────────────────────────── */
    .sidebar {
      width: 220px; min-width: 220px;
      background: var(--color-bg-default, #fff);
      border-right: 1px solid var(--color-border-default, #e2e8f0);
      height: 100vh; position: sticky; top: 0;
      display: flex; flex-direction: column; overflow-y: auto;
    }
    .sidebar-header { padding: 18px 16px 14px; border-bottom: 1px solid var(--color-border-default, #e2e8f0); }
    .sidebar-title { font-size: 14px; font-weight: 700; color: var(--color-text-primary, #0f172a); letter-spacing: -0.01em; }
    .sidebar-version { font-size: 11px; color: var(--color-text-secondary, #64748b); margin-top: 2px; }
    .sidebar-section { padding: 12px 8px 4px; }
    .sidebar-section-label {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--color-text-secondary, #64748b);
      padding: 0 8px; margin-bottom: 4px;
    }
    .nav-item {
      display: block; padding: 5px 8px; border-radius: 5px;
      font-size: 13px; color: var(--color-text-secondary, #64748b);
      cursor: pointer; text-decoration: none;
      transition: background 120ms, color 120ms;
    }
    .nav-item:hover { background: var(--color-bg-subtle, #f8fafc); color: var(--color-text-primary, #0f172a); }
    .nav-item.active { background: var(--color-bg-overlay, #f1f5f9); color: var(--color-action, #2563eb); font-weight: 500; }

    /* ── Main ─────────────────────────────────────────── */
    .main { flex: 1; overflow-y: auto; }
    .topbar {
      position: sticky; top: 0; z-index: 10;
      background: var(--color-bg-default, #fff);
      border-bottom: 1px solid var(--color-border-default, #e2e8f0);
      padding: 10px 32px;
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
    }
    .topbar-breadcrumb { font-size: 13px; color: var(--color-text-secondary, #64748b); }
    .topbar-breadcrumb span { color: var(--color-text-primary, #0f172a); font-weight: 500; }
    .topbar-actions { display: flex; gap: 8px; align-items: center; }
    .theme-toggle {
      display: flex; gap: 3px;
      background: var(--color-bg-subtle, #f8fafc);
      border: 1px solid var(--color-border-default, #e2e8f0);
      border-radius: 7px; padding: 3px;
    }
    .theme-btn {
      padding: 3px 10px; border-radius: 4px; border: none;
      background: transparent; font-size: 12px; cursor: pointer;
      color: var(--color-text-secondary, #64748b);
      transition: background 120ms, color 120ms;
    }
    .theme-btn.active {
      background: var(--color-bg-default, #fff);
      color: var(--color-text-primary, #0f172a); font-weight: 500;
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
    }
    .density-toggle {
      display: flex; gap: 3px; align-items: center;
      background: var(--color-bg-subtle, #f8fafc);
      border: 1px solid var(--color-border-default, #e2e8f0);
      border-radius: 7px; padding: 3px;
    }
    .density-toggle.locked { opacity: 0.5; cursor: not-allowed; }
    .density-btn {
      padding: 3px 10px; border-radius: 4px; border: none;
      background: transparent; font-size: 12px; cursor: pointer;
      color: var(--color-text-secondary, #64748b);
      transition: background 120ms, color 120ms;
    }
    .density-btn:disabled { cursor: not-allowed; }
    .density-btn.active {
      background: var(--color-bg-default, #fff);
      color: var(--color-text-primary, #0f172a); font-weight: 500;
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
    }
    .density-lock {
      font-size: 10px; font-weight: 600; letter-spacing: 0.04em;
      color: var(--color-text-secondary, #64748b);
      padding: 2px 6px; border-radius: 4px;
      background: var(--color-bg-overlay, #f1f5f9);
      border: 1px solid var(--color-border-default, #e2e8f0);
      white-space: nowrap;
    }
    .content { padding: 36px 40px 80px; max-width: 860px; }
    .page { display: none; }
    .page.active { display: block; }
    .page-title {
      font-size: 26px; font-weight: 700; letter-spacing: -0.02em;
      color: var(--color-text-primary, #0f172a); margin-bottom: 4px;
    }
    .page-desc {
      font-size: 14px; color: var(--color-text-secondary, #64748b);
      margin-bottom: 28px; line-height: 1.65; max-width: 640px;
    }
    .section-block { margin-bottom: 36px; }
    .group-title {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.07em; color: var(--color-text-secondary, #64748b);
      margin-bottom: 14px; padding-bottom: 8px;
      border-bottom: 1px solid var(--color-border-default, #e2e8f0);
    }

    /* ── Foundations: colors ──────────────────────────── */
    .swatch-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .swatch {
      width: 88px; height: 72px; border-radius: 8px; padding: 8px;
      display: flex; flex-direction: column; justify-content: flex-end;
      font-size: 10px; line-height: 1.3; border: 1px solid rgb(0 0 0 / 0.06);
    }
    .swatch-name { font-weight: 600; word-break: break-all; }
    .swatch-value { opacity: 0.8; }

    /* ── Foundations: typography ──────────────────────── */
    .type-family {
      font-size: 13px; color: var(--color-text-secondary, #64748b); font-family: monospace;
      background: var(--color-bg-overlay, #f1f5f9);
      display: inline-block; padding: 4px 10px; border-radius: 6px; margin-bottom: 24px;
    }
    .type-scale { display: flex; flex-direction: column; gap: 2px; }
    .type-row { display: flex; align-items: center; gap: 24px; padding: 12px 0; border-bottom: 1px solid var(--color-border-default, #e2e8f0); }
    .type-meta { width: 140px; min-width: 140px; }
    .type-role { font-size: 12px; font-weight: 600; color: var(--color-action, #2563eb); display: block; }
    .type-spec { font-size: 11px; color: var(--color-text-secondary, #64748b); font-family: monospace; }
    .type-sample { flex: 1; color: var(--color-text-primary, #0f172a); }

    /* ── Foundations: spacing ─────────────────────────── */
    .spacing-list { display: flex; flex-direction: column; gap: 10px; }
    .spacing-row { display: flex; align-items: center; gap: 16px; }
    .spacing-key { width: 160px; min-width: 160px; font-size: 12px; font-family: monospace; color: var(--color-text-secondary, #64748b); }
    .spacing-bar-wrap { flex: 1; }
    .spacing-bar { height: 8px; background: var(--color-action, #2563eb); border-radius: 4px; min-width: 4px; opacity: 0.7; }
    .spacing-val { width: 48px; font-size: 12px; color: var(--color-text-secondary, #64748b); font-family: monospace; text-align: right; }

    /* ── Foundations: radius ──────────────────────────── */
    .radius-grid { display: flex; flex-wrap: wrap; gap: 24px; }
    .radius-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .radius-box { width: 64px; height: 64px; background: var(--color-action, #2563eb); opacity: 0.15; border: 2px solid var(--color-action, #2563eb); }
    .radius-key { font-size: 12px; font-weight: 600; color: var(--color-text-primary, #0f172a); }
    .radius-val { font-size: 11px; color: var(--color-text-secondary, #64748b); font-family: monospace; }

    /* ── Foundations: elevation ───────────────────────── */
    .elevation-grid { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
    .elevation-item { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .elevation-box { width: 80px; height: 80px; background: var(--color-bg-default, #fff); border-radius: 10px; border: 1px solid var(--color-border-default, #e2e8f0); }
    .elevation-key { font-size: 12px; font-weight: 600; color: var(--color-text-primary, #0f172a); }
    .elevation-val { font-size: 10px; color: var(--color-text-secondary, #64748b); font-family: monospace; text-align: center; max-width: 120px; word-break: break-all; }

    /* ── Foundations: motion ──────────────────────────── */
    .motion-grid { display: flex; flex-direction: column; gap: 12px; }
    .motion-item {
      display: flex; align-items: center; gap: 16px; cursor: pointer;
      padding: 10px 12px; border-radius: 8px;
      border: 1px solid var(--color-border-default, #e2e8f0);
      background: var(--color-bg-default, #fff); transition: border-color 150ms;
    }
    .motion-item:hover { border-color: var(--color-action, #2563eb); }
    .motion-track { width: 140px; height: 12px; background: var(--color-bg-overlay, #f1f5f9); border-radius: 6px; position: relative; overflow: hidden; }
    .motion-dot { position: absolute; left: 4px; top: 2px; width: 8px; height: 8px; border-radius: 50%; background: var(--color-action, #2563eb); transform: translateX(0); }
    .motion-key { width: 100px; font-size: 12px; font-weight: 600; color: var(--color-text-primary, #0f172a); }
    .motion-val { flex: 1; font-size: 12px; font-family: monospace; color: var(--color-text-secondary, #64748b); }
    .motion-hint { font-size: 11px; color: var(--color-text-secondary, #64748b); margin-left: auto; }

    /* ── Component tab bar ────────────────────────────── */
    .comp-tab-bar {
      display: flex;
      border-bottom: 1px solid var(--color-border-default, #e2e8f0);
      margin-bottom: 28px;
    }
    .comp-tab {
      padding: 8px 16px;
      background: none; border: none; border-bottom: 2px solid transparent;
      font-size: 13px; font-weight: 500; cursor: pointer;
      color: var(--color-text-secondary, #64748b);
      margin-bottom: -1px; transition: color 120ms, border-color 120ms;
    }
    .comp-tab:hover { color: var(--color-text-primary, #0f172a); }
    .comp-tab.active { color: var(--color-action, #2563eb); border-bottom-color: var(--color-action, #2563eb); }
    .comp-tab-panel { display: none; }
    .comp-tab-panel.active { display: block; }

    /* ── Component overview ───────────────────────────── */
    .comp-overview-section { margin-bottom: 28px; }
    .comp-overview-label {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.07em; color: var(--color-text-secondary, #64748b); margin-bottom: 12px;
    }
    .comp-preview-row {
      display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
      padding: 24px; background: var(--color-bg-default, #fff);
      border: 1px solid var(--color-border-default, #e2e8f0); border-radius: 10px;
    }
    .comp-preview-col {
      display: flex; flex-direction: column; gap: 16px;
      padding: 24px; max-width: 400px;
      background: var(--color-bg-default, #fff);
      border: 1px solid var(--color-border-default, #e2e8f0); border-radius: 10px;
    }

    /* ── Props table ──────────────────────────────────── */
    .props-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .props-table th {
      text-align: left; padding: 8px 12px;
      font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--color-text-secondary, #64748b);
      border-bottom: 2px solid var(--color-border-default, #e2e8f0);
    }
    .props-table td { padding: 10px 12px; border-bottom: 1px solid var(--color-border-default, #e2e8f0); vertical-align: top; line-height: 1.5; }
    .props-table tr:last-child td { border-bottom: none; }
    .prop-name    { font-family: monospace; font-size: 13px; color: var(--color-text-primary, #0f172a); font-weight: 600; }
    .prop-type    { font-family: monospace; font-size: 12px; color: var(--color-action, #2563eb); }
    .prop-default { font-family: monospace; font-size: 12px; color: var(--color-text-secondary, #64748b); }
    .prop-desc    { font-size: 13px; color: var(--color-text-secondary, #64748b); }
    .prop-required-cell { text-align: center; }
    .prop-required {
      display: inline-block; font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.04em;
      color: #dc2626; background: #fef2f2;
      border: 1px solid #fecaca; border-radius: 4px; padding: 2px 6px;
    }
    .prop-optional { color: var(--color-text-secondary, #64748b); font-size: 13px; }

    /* ── Examples ─────────────────────────────────────── */
    .example-block { border: 1px solid var(--color-border-default, #e2e8f0); border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
    .example-header { padding: 14px 16px; border-bottom: 1px solid var(--color-border-default, #e2e8f0); background: var(--color-bg-default, #fff); }
    .example-label { font-size: 13px; font-weight: 600; color: var(--color-text-primary, #0f172a); }
    .example-desc  { font-size: 12px; color: var(--color-text-secondary, #64748b); margin-top: 2px; }
    .example-preview { padding: 28px 24px; background: var(--color-bg-subtle, #f8fafc); border-bottom: 1px solid var(--color-border-default, #e2e8f0); }
    .example-code-wrap { position: relative; }
    .example-code-bar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 6px 14px;
      background: var(--color-bg-overlay, #f1f5f9);
      color: var(--color-text-secondary, #64748b);
      font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
      border-bottom: 1px solid var(--color-border-default, #e2e8f0);
    }
    .copy-btn {
      background: transparent; border: 1px solid var(--color-border-default, #e2e8f0);
      color: var(--color-text-secondary, #64748b); font-size: 11px; padding: 3px 10px;
      border-radius: 4px; cursor: pointer; transition: background 120ms, color 120ms;
    }
    .copy-btn:hover { background: var(--color-bg-subtle, #f8fafc); color: var(--color-text-primary, #0f172a); }
    .copy-btn.copied { color: #16a34a; border-color: #16a34a; }
    .example-code {
      margin: 0; padding: 16px 18px;
      background: var(--color-bg-default, #fff);
      color: var(--color-text-primary, #0f172a);
      border: 1px solid var(--color-border-default, #e2e8f0); border-top: none;
      font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
      font-size: 12.5px; line-height: 1.65; overflow-x: auto; white-space: pre;
    }

    /* ── Accessibility ────────────────────────────────── */
    .a11y-list { display: flex; flex-direction: column; gap: 1px; }
    .a11y-item { padding: 16px; border: 1px solid var(--color-border-default, #e2e8f0); border-radius: 8px; margin-bottom: 10px; background: var(--color-bg-default, #fff); }
    .a11y-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .a11y-criterion { font-size: 13px; font-weight: 600; color: var(--color-text-primary, #0f172a); }
    .a11y-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 99px; letter-spacing: 0.04em; }
    .a11y-badge-a   { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
    .a11y-badge-aa  { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .a11y-badge-aaa { background: #faf5ff; color: #7e22ce; border: 1px solid #e9d5ff; }
    .a11y-desc { font-size: 13px; color: var(--color-text-secondary, #64748b); line-height: 1.6; }

    /* ── AI Metadata ──────────────────────────────────── */
    .ai-meta-intro { padding: 14px 16px; background: var(--color-bg-overlay, #f1f5f9); border: 1px solid var(--color-border-default, #e2e8f0); border-radius: 8px; margin-bottom: 4px; }
    .ai-meta-intro p { font-size: 13px; color: var(--color-text-secondary, #64748b); line-height: 1.6; }
    .ai-meta-intro code { font-family: monospace; font-size: 12px; color: var(--color-action, #2563eb); }
    .ai-guidance-list { padding-left: 20px; display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
    .ai-guidance-list li { font-size: 13px; color: var(--color-text-secondary, #64748b); line-height: 1.6; }

    /* ── Locked tabs ──────────────────────────────────── */
    .comp-tab.locked { opacity: 0.45; cursor: default; }
    .comp-tab.locked:hover { color: var(--color-text-secondary, #64748b); }
    .locked-panel {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 64px 32px; text-align: center;
      border: 1px dashed var(--color-border-default, #e2e8f0); border-radius: 10px;
      background: var(--color-bg-subtle, #f8fafc);
    }
    .locked-icon { font-size: 28px; color: var(--color-text-secondary, #64748b); margin-bottom: 12px; }
    .locked-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary, #0f172a); margin-bottom: 8px; }
    .locked-desc { font-size: 13px; color: var(--color-text-secondary, #64748b); max-width: 360px; line-height: 1.6; margin-bottom: 6px; }
    .locked-hint { font-size: 12px; color: var(--color-text-secondary, #64748b); font-family: monospace; }
    .locked-hint code { background: var(--color-bg-overlay, #f1f5f9); padding: 1px 6px; border-radius: 4px; border: 1px solid var(--color-border-default, #e2e8f0); }

    /* ── Component primitives ─────────────────────────── */
    .ds-btn { border: none; cursor: pointer; font-size: 14px; font-weight: 500; padding: var(--component-padding-sm, 8px) var(--component-padding-md, 16px); border-radius: var(--radius-md, 4px); transition: filter 120ms; }
    .ds-btn:hover:not(:disabled) { filter: brightness(0.92); }
    .ds-field { display: flex; flex-direction: column; gap: var(--component-padding-xs, 4px); }
    .ds-label { font-size: 13px; font-weight: 500; }
    .ds-input { border: 1.5px solid; padding: var(--component-padding-sm, 8px) var(--component-padding-sm, 12px); font-size: 14px; outline: none; border-radius: var(--radius-sm, 2px); transition: border-color 150ms, box-shadow 150ms; width: 100%; }
    .ds-input:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-action, #2563eb) 20%, transparent); border-color: var(--color-action, #2563eb) !important; }
    .ds-card { border: 1px solid; overflow: hidden; width: 220px; border-radius: var(--radius-lg, 8px); }
    .ds-card-header { padding: var(--component-padding-sm, 12px) var(--component-padding-sm, 14px); font-size: 14px; font-weight: 600; }
    .ds-card-body   { padding: var(--component-padding-sm, 12px) var(--component-padding-sm, 14px); }
    .ds-card-footer { padding: var(--component-padding-xs, 10px) var(--component-padding-sm, 14px); display: flex; justify-content: flex-end; }

    /* ── Component docs ───────────────────────────────── */
    .component-docs { margin-top: 36px; }
    .component-description {
      font-size: 14px; color: var(--color-text-secondary, #64748b);
      line-height: 1.65; margin-bottom: 24px; max-width: 640px;
    }
    .component-docs h4 {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.07em; color: var(--color-text-secondary, #64748b);
      margin-bottom: 12px; padding-bottom: 8px;
      border-bottom: 1px solid var(--color-border-default, #e2e8f0);
    }
    .usage-example {
      margin: 0; padding: 16px 18px;
      background: var(--color-bg-default, #fff);
      color: var(--color-text-primary, #0f172a);
      border: 1px solid var(--color-border-default, #e2e8f0); border-radius: 8px;
      font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
      font-size: 12.5px; line-height: 1.65; overflow-x: auto; white-space: pre;
    }

    /* ── Spinner animation ────────────────────────────── */
    @keyframes dsforge-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { @keyframes dsforge-spin { to { transform: none; } } }
  </style>
</head>
<body>

  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-title">${esc(name)}</div>
      <div class="sidebar-version">v${esc(version)}${themes.length ? " · " + themes.join(", ") : ""}</div>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-section-label">Foundations</div>
      ${foundationItems
        .map(
          (item) => `
        <a class="nav-item${item.id === "colors" ? " active" : ""}" onclick="showPage('${item.id}', this)" href="#">${esc(item.label)}</a>
      `,
        )
        .join("")}
    </div>
    <div class="sidebar-section">
      <div class="sidebar-section-label">Components</div>
      ${componentItems
        .map(
          (item) => `
        <a class="nav-item" onclick="showPage('${item.id}', this)" href="#">${esc(item.label)}</a>
      `,
        )
        .join("")}
    </div>
  </aside>

  <div class="main">
    <div class="topbar">
      <div class="topbar-breadcrumb">
        ${esc(name)} / <span id="topbar-current">Colors</span>
      </div>
      <div class="topbar-actions">
        ${isPro
          ? `<div class="density-toggle" id="density-toggle">
            ${PRESETS.map((p) => `
              <button class="density-btn${p === defaultDensity ? " active" : ""}" onclick="setDensity('${p}', this)">${p.charAt(0).toUpperCase() + p.slice(1)}</button>
            `).join("")}
          </div>`
          : `<div class="density-toggle locked" title="Density switching requires dsforge Pro. Set DSFORGE_KEY to unlock.">
            ${PRESETS.map((p) => `
              <button class="density-btn${p === defaultDensity ? " active" : ""}" disabled>${p.charAt(0).toUpperCase() + p.slice(1)}</button>
            `).join("")}
            <span class="density-lock">⊘ Pro</span>
          </div>`
        }
        ${
          themes.length >= 2
            ? `
          <div class="theme-toggle">
            ${themes
              .map(
                (t, i) => `
              <button class="theme-btn${i === 0 ? " active" : ""}" onclick="setTheme('${t}', this)">${esc(t)}</button>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
    </div>

    <div class="content">
      ${allItems
        .map(
          ({ id, label }) => `
        <div class="page${id === "colors" ? " active" : ""}" id="page-${id}">
          <h1 class="page-title">${esc(label)}</h1>
          <p class="page-desc">${esc(pageDesc(id, name))}</p>
          ${sections[id] ?? ""}
        </div>
      `,
        )
        .join("")}
    </div>
  </div>

  <script>
    function showPage(id, el) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.getElementById('page-' + id).classList.add('active');
      el.classList.add('active');
      document.getElementById('topbar-current').textContent = el.textContent.trim();
    }

    function setTheme(name, btn) {
      document.documentElement.setAttribute('data-theme', name);
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }

    function setDensity(name, btn) {
      document.documentElement.setAttribute('data-density', name);
      document.querySelectorAll('.density-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateSpacingValues();
    }

    function updateSpacingValues() {
      const style = getComputedStyle(document.documentElement);
      document.querySelectorAll('[data-spacing-var]').forEach(el => {
        const prop = el.getAttribute('data-spacing-var');
        const val = style.getPropertyValue(prop).trim();
        if (val) el.textContent = val;
      });
    }

    function switchTab(compId, tabId, btn) {
      const tabs   = document.querySelectorAll('#' + compId + '-tabs .comp-tab');
      const panels = document.querySelectorAll('#' + compId + '-tabs .comp-tab-panel');
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      document.getElementById(compId + '-panel-' + tabId).classList.add('active');
    }

    function copyCode(id, btn) {
      const code = document.getElementById(id).textContent;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
      });
    }

    // Populate spacing/radius value labels on load
    document.addEventListener('DOMContentLoaded', updateSpacingValues);
  </script>
</body>
</html>`;
}

// ─── Page descriptions ────────────────────────────────────────────────────────

function pageDesc(id: string, name: string): string {
  // Foundation pages have static descriptions
  const foundations: Record<string, string> = {
    colors: `The color tokens used across ${name}. Global palette tokens are the raw values; semantic tokens map intent to palette.`,
    typography: `Type scale and font settings for ${name}. All sizes, weights, and line heights.`,
    spacing: `Spacing scale based on the configured base unit. Used for padding, margin, and gap values.`,
    radius: `Border radius tokens. Applied to buttons, inputs, cards, and other surfaces.`,
    elevation: `Box shadow levels. Higher levels appear more elevated.`,
    motion: `Duration and easing tokens. Click any row to preview the animation.`,
  };
  if (id in foundations) return foundations[id] ?? "";

  // Component descriptions come from the registry
  const entry = SHOWCASE_COMPONENTS.find((c) => c.id === id);
  return entry?.pageDescription ?? "";
}
