/**
 * Showcase generator.
 * Produces a single self-contained HTML file — no external deps at runtime.
 * Includes: color swatches, typography scale, spacing, radius, elevation,
 * motion, and live component previews (Button, Input, Card).
 */

import type { DesignSystemConfig } from "../../types/index";
import type { ResolutionResult } from "../../core/token-resolver";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function isHex(v: string): boolean {
  return /^#[0-9a-fA-F]{3,8}$/.test(v);
}

function hexLuminance(hex: string): number {
  const c = hex.replace("#", "");
  const full =
    c.length === 3
      ? c
          .split("")
          .map((x) => x + x)
          .join("")
      : c;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const toLinear = (x: number) =>
    x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function textOnColor(hex: string): string {
  return hexLuminance(hex) > 0.35 ? "#111827" : "#ffffff";
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildColorSection(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
): string {
  const groups: Array<{
    title: string;
    items: Array<{ name: string; value: string }>;
  }> = [];

  // Global palette
  const globalEntries = Object.entries(config.tokens?.global ?? {})
    .filter(([, v]) => isHex(String(v)))
    .map(([k, v]) => ({ name: k, value: String(v) }));
  if (globalEntries.length)
    groups.push({ title: "Global Palette", items: globalEntries });

  // Semantic colors
  const semanticEntries = Object.entries(tokens)
    .filter(([k, v]) => k.startsWith("semantic.color") && isHex(v))
    .map(([k, v]) => ({ name: k.replace("semantic.", ""), value: v }));
  if (semanticEntries.length)
    groups.push({ title: "Semantic Colors", items: semanticEntries });

  return groups
    .map(
      ({ title, items }) => `
    <div class="section-block">
      <h3 class="group-title">${esc(title)}</h3>
      <div class="swatch-grid">
        ${items
          .map(
            ({ name, value }) => `
          <div class="swatch" style="background:${value};color:${textOnColor(value)}">
            <span class="swatch-name">${esc(name)}</span>
            <span class="swatch-value">${esc(value)}</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `,
    )
    .join("");
}

function buildTypographySection(config: DesignSystemConfig): string {
  const roles = config.typography?.roles ?? {};
  const ff = config.typography?.fontFamily ?? "system-ui, sans-serif";

  return `
    <div class="section-block">
      <h3 class="group-title">Font Family</h3>
      <div class="type-family">${esc(ff)}</div>
    </div>
    <div class="section-block">
      <h3 class="group-title">Type Scale</h3>
      <div class="type-scale">
        ${Object.entries(roles)
          .map(([role, def]) => {
            const size =
              typeof def === "object" && def !== null
                ? (def as unknown as Record<string, unknown>)["size"]
                : 16;
            const weight =
              typeof def === "object" && def !== null
                ? (def as unknown as Record<string, unknown>)["weight"]
                : 400;
            const lh =
              typeof def === "object" && def !== null
                ? (def as unknown as Record<string, unknown>)["lineHeight"]
                : 1.5;
            return `
            <div class="type-row">
              <div class="type-meta">
                <span class="type-role">${esc(role)}</span>
                <span class="type-spec">${size}px / ${weight} / lh ${lh}</span>
              </div>
              <div class="type-sample" style="font-size:${size}px;font-weight:${weight};line-height:${lh};font-family:${esc(ff)}">
                The quick brown fox
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function buildSpacingSection(config: DesignSystemConfig): string {
  const scale = config.spacing?.scale ?? {};
  const baseUnit = config.spacing?.baseUnit ?? 4;

  return `
    <div class="section-block">
      <h3 class="group-title">Base Unit: ${baseUnit}px</h3>
      <div class="spacing-list">
        ${Object.entries(scale)
          .map(
            ([key, val]) => `
          <div class="spacing-row">
            <span class="spacing-key">${esc(key)}</span>
            <div class="spacing-bar-wrap">
              <div class="spacing-bar" style="width:${Math.min(Number(val) * 2, 320)}px"></div>
            </div>
            <span class="spacing-val">${val}px</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
    <div class="section-block">
      <h3 class="group-title">Semantic Spacing</h3>
      <div class="spacing-list">
        ${Object.entries(config.spacing?.semantic ?? {})
          .map(
            ([key, val]) => `
          <div class="spacing-row">
            <span class="spacing-key">${esc(key)}</span>
            <div class="spacing-bar-wrap">
              <div class="spacing-bar" style="width:${Math.min(Number(val) * 2, 320)}px"></div>
            </div>
            <span class="spacing-val">${val}px</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function buildRadiusSection(config: DesignSystemConfig): string {
  const radius = config.radius ?? {};
  return `
    <div class="section-block">
      <h3 class="group-title">Border Radius</h3>
      <div class="radius-grid">
        ${Object.entries(radius)
          .map(
            ([key, val]) => `
          <div class="radius-item">
            <div class="radius-box" style="border-radius:${val}px"></div>
            <span class="radius-key">${esc(key)}</span>
            <span class="radius-val">${val}px</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function buildElevationSection(config: DesignSystemConfig): string {
  const elevation = config.elevation ?? {};
  return `
    <div class="section-block">
      <h3 class="group-title">Elevation</h3>
      <div class="elevation-grid">
        ${Object.entries(elevation)
          .map(
            ([key, val]) => `
          <div class="elevation-item">
            <div class="elevation-box" style="box-shadow:${val === "none" ? "none" : val}"></div>
            <span class="elevation-key">Level ${esc(key)}</span>
            <span class="elevation-val">${esc(String(val))}</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function buildMotionSection(config: DesignSystemConfig): string {
  const duration = config.motion?.duration ?? {};
  const easing = config.motion?.easing ?? {};
  return `
    <div class="section-block">
      <h3 class="group-title">Duration</h3>
      <div class="motion-grid">
        ${Object.entries(duration)
          .map(
            ([key, val]) => `
          <div class="motion-item" onclick="this.querySelector('.motion-dot').style.transform='translateX(120px)';setTimeout(()=>this.querySelector('.motion-dot').style.transform='',${val}+50)">
            <div class="motion-track"><div class="motion-dot" style="transition:transform ${val}ms linear"></div></div>
            <span class="motion-key">${esc(key)}</span>
            <span class="motion-val">${val}ms</span>
            <span class="motion-hint">click to preview</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
    <div class="section-block">
      <h3 class="group-title">Easing</h3>
      <div class="motion-grid">
        ${Object.entries(easing)
          .map(
            ([key, val]) => `
          <div class="motion-item" onclick="this.querySelector('.motion-dot').style.transform='translateX(120px)';setTimeout(()=>this.querySelector('.motion-dot').style.transform='',500)">
            <div class="motion-track"><div class="motion-dot" style="transition:transform 500ms ${val}"></div></div>
            <span class="motion-key">${esc(key)}</span>
            <span class="motion-val">${esc(String(val))}</span>
            <span class="motion-hint">click to preview</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function componentTokens(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
) {
  return {
    action: tokens["semantic.color-action"] ?? "#2563eb",
    actionHover: tokens["semantic.color-action-hover"] ?? "#1d4ed8",
    actionText: tokens["semantic.color-text-on-color"] ?? "#ffffff",
    bg: tokens["semantic.color-bg-default"] ?? "#ffffff",
    border: tokens["semantic.color-border-default"] ?? "#e2e8f0",
    text: tokens["semantic.color-text-primary"] ?? "#0f172a",
    textSecondary: tokens["semantic.color-text-secondary"] ?? "#64748b",
    radiusMd: config.radius?.["md"] ?? 4,
    radiusLg: config.radius?.["lg"] ?? 8,
    ff: config.typography?.fontFamily ?? "system-ui, sans-serif",
  };
}

function buildButtonSection(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
): string {
  const { action, actionHover, actionText, text, radiusMd, ff } =
    componentTokens(config, tokens);
  void actionHover;

  return `
    <div class="section-block">
      <h3 class="group-title">Variants</h3>
      <div class="component-row" style="font-family:${esc(ff)}">
        <button class="ds-btn ds-btn-primary" style="background:${action};color:${actionText};border-radius:${radiusMd}px">Primary</button>
        <button class="ds-btn ds-btn-secondary" style="background:transparent;color:${action};border:1.5px solid ${action};border-radius:${radiusMd}px">Secondary</button>
        <button class="ds-btn ds-btn-danger" style="background:#dc2626;color:#fff;border-radius:${radiusMd}px">Danger</button>
        <button class="ds-btn ds-btn-ghost" style="background:transparent;color:${text};border-radius:${radiusMd}px">Ghost</button>
        <button class="ds-btn ds-btn-primary" style="background:${action};color:${actionText};border-radius:${radiusMd}px;opacity:0.4;cursor:not-allowed" disabled>Disabled</button>
      </div>
    </div>
    <div class="section-block">
      <h3 class="group-title">Sizes</h3>
      <div class="component-row" style="font-family:${esc(ff)}">
        <button class="ds-btn" style="background:${action};color:${actionText};border-radius:${radiusMd}px;font-size:12px;padding:4px 12px">Small</button>
        <button class="ds-btn" style="background:${action};color:${actionText};border-radius:${radiusMd}px;font-size:14px;padding:8px 16px">Medium</button>
        <button class="ds-btn" style="background:${action};color:${actionText};border-radius:${radiusMd}px;font-size:16px;padding:12px 24px">Large</button>
      </div>
    </div>
  `;
}

function buildInputSection(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
): string {
  const { action, bg, border, text, textSecondary, radiusMd, ff } =
    componentTokens(config, tokens);
  void action;
  return `
    <div class="section-block">
      <h3 class="group-title">States</h3>
      <div class="component-col" style="font-family:${esc(ff)};max-width:360px">
        <div class="ds-field">
          <label class="ds-label" style="color:${text}">Default</label>
          <input class="ds-input" style="border-color:${border};border-radius:${radiusMd}px;color:${text};background:${bg}" placeholder="Placeholder text" />
        </div>
        <div class="ds-field">
          <label class="ds-label" style="color:${text}">With value</label>
          <input class="ds-input" style="border-color:${border};border-radius:${radiusMd}px;color:${text};background:${bg}" value="Some input value" />
        </div>
        <div class="ds-field">
          <label class="ds-label" style="color:${text}">Error state</label>
          <input class="ds-input ds-input-error" style="border-color:#dc2626;border-radius:${radiusMd}px;color:${text};background:${bg}" value="Invalid value" />
          <span class="ds-helper-error" style="color:#dc2626">This field is required</span>
        </div>
        <div class="ds-field">
          <label class="ds-label" style="color:${textSecondary}">Disabled</label>
          <input class="ds-input" style="border-color:${border};border-radius:${radiusMd}px;color:${textSecondary};background:${bg};opacity:0.5" disabled placeholder="Disabled" />
        </div>
      </div>
    </div>
  `;
}

function buildCardSection(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
): string {
  const {
    action,
    actionText,
    bg,
    border,
    text,
    textSecondary,
    radiusMd,
    radiusLg,
    ff,
  } = componentTokens(config, tokens);
  return `
    <div class="section-block">
      <h3 class="group-title">Variants</h3>
      <div class="component-row" style="font-family:${esc(ff)};align-items:flex-start;flex-wrap:wrap">
        <div class="ds-card" style="border-color:${border};border-radius:${radiusLg}px;background:${bg};color:${text}">
          <div class="ds-card-header" style="border-bottom:1px solid ${border}"><strong>Default</strong></div>
          <div class="ds-card-body"><p style="color:${textSecondary};margin:0;font-size:14px">Card body content goes here.</p></div>
          <div class="ds-card-footer" style="border-top:1px solid ${border}">
            <button class="ds-btn" style="background:${action};color:${actionText};border-radius:${radiusMd}px;font-size:13px;padding:6px 14px;font-family:${esc(ff)}">Action</button>
          </div>
        </div>
        <div class="ds-card" style="border-color:transparent;border-radius:${radiusLg}px;background:${bg};color:${text};box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.10)">
          <div class="ds-card-header" style="border-bottom:1px solid ${border}"><strong>Elevated</strong></div>
          <div class="ds-card-body"><p style="color:${textSecondary};margin:0;font-size:14px">Uses elevation shadow instead of a border.</p></div>
        </div>
        <div class="ds-card" style="border:2px solid ${border};border-radius:${radiusLg}px;background:${bg};color:${text}">
          <div class="ds-card-header" style="border-bottom:1px solid ${border}"><strong>Outlined</strong></div>
          <div class="ds-card-body"><p style="color:${textSecondary};margin:0;font-size:14px">Stronger border, no shadow.</p></div>
        </div>
      </div>
    </div>
  `;
}

// ─── Full HTML ─────────────────────────────────────────────────────────────────

export function generateShowcase(
  config: DesignSystemConfig,
  resolution: ResolutionResult,
): string {
  const tokens = resolution.tokens;
  const name = config.meta?.name ?? "Design System";
  const version = config.meta?.version ?? "0.1.0";
  const themes = Object.keys(config.themes ?? {});

  const foundationItems = [
    { id: "colors", label: "Colors" },
    { id: "typography", label: "Typography" },
    { id: "spacing", label: "Spacing" },
    { id: "radius", label: "Border Radius" },
    { id: "elevation", label: "Elevation" },
    { id: "motion", label: "Motion" },
  ];

  const componentItems = [
    { id: "button", label: "Button" },
    { id: "input", label: "Input" },
    { id: "card", label: "Card" },
  ];

  const allItems = [...foundationItems, ...componentItems];

  const sections: Record<string, string> = {
    colors: buildColorSection(config, tokens),
    typography: buildTypographySection(config),
    spacing: buildSpacingSection(config),
    radius: buildRadiusSection(config),
    elevation: buildElevationSection(config),
    motion: buildMotionSection(config),
    button: buildButtonSection(config, tokens),
    input: buildInputSection(config, tokens),
    card: buildCardSection(config, tokens),
  };

  // Build CSS custom properties for light theme (default)
  const lightTheme = config.themes?.["light"] ?? {};
  const darkTheme = config.themes?.["dark"] ?? {};

  const themeCssLight = Object.entries({
    ...Object.fromEntries(
      Object.entries(tokens).map(([k, v]) => [
        k.replace(/^(global|semantic|component)\./, ""),
        v,
      ]),
    ),
    ...lightTheme,
  })
    .map(([k, v]) => `  --${k}: ${v};`)
    .join("\n");

  const themeCssDark = Object.entries({
    ...Object.fromEntries(
      Object.entries(tokens).map(([k, v]) => [
        k.replace(/^(global|semantic|component)\./, ""),
        v,
      ]),
    ),
    ...darkTheme,
  })
    .map(([k, v]) => `  --${k}: ${v};`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(name)} — Design System Docs</title>
  <link rel="icon" type="image/svg+xml" href="../assets/favicon.svg" />
  <style>
    /* ── Theme tokens ─────────────────────────────────────────── */
    [data-theme="light"] {
${themeCssLight}
    }
    [data-theme="dark"] {
${themeCssDark}
    }

    /* ── Reset + base ─────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 14px; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--color-bg-subtle, #f8fafc);
      color: var(--color-text-primary, #0f172a);
      display: flex;
      min-height: 100vh;
      line-height: 1.5;
    }

    /* ── Sidebar ──────────────────────────────────────────────── */
    .sidebar {
      width: 240px;
      min-width: 240px;
      background: var(--color-bg-default, #fff);
      border-right: 1px solid var(--color-border-default, #e2e8f0);
      height: 100vh;
      position: sticky;
      top: 0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .sidebar-header {
      padding: 20px 16px 16px;
      border-bottom: 1px solid var(--color-border-default, #e2e8f0);
    }
    .sidebar-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--color-text-primary, #0f172a);
      letter-spacing: -0.01em;
    }
    .sidebar-version {
      font-size: 11px;
      color: var(--color-text-secondary, #64748b);
      margin-top: 2px;
    }
    .sidebar-section {
      padding: 12px 8px 4px;
    }
    .sidebar-section-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-text-secondary, #64748b);
      padding: 0 8px;
      margin-bottom: 4px;
    }
    .nav-item {
      display: block;
      padding: 6px 8px;
      border-radius: 6px;
      font-size: 13px;
      color: var(--color-text-secondary, #64748b);
      cursor: pointer;
      text-decoration: none;
      transition: background 150ms, color 150ms;
    }
    .nav-item:hover { background: var(--color-bg-subtle, #f8fafc); color: var(--color-text-primary, #0f172a); }
    .nav-item.active { background: var(--color-bg-overlay, #f1f5f9); color: var(--color-action, #2563eb); font-weight: 500; }

    /* ── Main content ─────────────────────────────────────────── */
    .main {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--color-bg-default, #fff);
      border-bottom: 1px solid var(--color-border-default, #e2e8f0);
      padding: 12px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .topbar-breadcrumb {
      font-size: 13px;
      color: var(--color-text-secondary, #64748b);
    }
    .topbar-breadcrumb span { color: var(--color-text-primary, #0f172a); font-weight: 500; }
    .topbar-actions { display: flex; gap: 8px; align-items: center; }
    .theme-toggle {
      display: flex;
      gap: 4px;
      background: var(--color-bg-subtle, #f8fafc);
      border: 1px solid var(--color-border-default, #e2e8f0);
      border-radius: 8px;
      padding: 3px;
    }
    .theme-btn {
      padding: 4px 10px;
      border-radius: 5px;
      border: none;
      background: transparent;
      font-size: 12px;
      cursor: pointer;
      color: var(--color-text-secondary, #64748b);
      transition: background 150ms, color 150ms;
    }
    .theme-btn.active {
      background: var(--color-bg-default, #fff);
      color: var(--color-text-primary, #0f172a);
      font-weight: 500;
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
    }

    .content { padding: 40px 32px 80px; max-width: 900px; }
    .page { display: none; }
    .page.active { display: block; }

    .page-title {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--color-text-primary, #0f172a);
      margin-bottom: 6px;
    }
    .page-desc {
      font-size: 14px;
      color: var(--color-text-secondary, #64748b);
      margin-bottom: 32px;
      line-height: 1.6;
    }
    .section-block { margin-bottom: 40px; }
    .group-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-text-secondary, #64748b);
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--color-border-default, #e2e8f0);
    }

    /* ── Color swatches ───────────────────────────────────────── */
    .swatch-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .swatch {
      width: 88px;
      height: 72px;
      border-radius: 8px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      font-size: 10px;
      line-height: 1.3;
      border: 1px solid rgb(0 0 0 / 0.06);
    }
    .swatch-name { font-weight: 600; word-break: break-all; }
    .swatch-value { opacity: 0.8; }

    /* ── Typography ───────────────────────────────────────────── */
    .type-family {
      font-size: 13px;
      color: var(--color-text-secondary, #64748b);
      font-family: monospace;
      background: var(--color-bg-overlay, #f1f5f9);
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    .type-scale { display: flex; flex-direction: column; gap: 2px; }
    .type-row {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 12px 0;
      border-bottom: 1px solid var(--color-border-default, #e2e8f0);
    }
    .type-meta { width: 140px; min-width: 140px; }
    .type-role { font-size: 12px; font-weight: 600; color: var(--color-action, #2563eb); display: block; }
    .type-spec { font-size: 11px; color: var(--color-text-secondary, #64748b); font-family: monospace; }
    .type-sample { flex: 1; color: var(--color-text-primary, #0f172a); }

    /* ── Spacing ──────────────────────────────────────────────── */
    .spacing-list { display: flex; flex-direction: column; gap: 10px; }
    .spacing-row { display: flex; align-items: center; gap: 16px; }
    .spacing-key { width: 160px; min-width: 160px; font-size: 12px; font-family: monospace; color: var(--color-text-secondary, #64748b); }
    .spacing-bar-wrap { flex: 1; }
    .spacing-bar { height: 8px; background: var(--color-action, #2563eb); border-radius: 4px; min-width: 4px; opacity: 0.7; }
    .spacing-val { width: 48px; font-size: 12px; color: var(--color-text-secondary, #64748b); font-family: monospace; text-align: right; }

    /* ── Radius ───────────────────────────────────────────────── */
    .radius-grid { display: flex; flex-wrap: wrap; gap: 24px; }
    .radius-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .radius-box {
      width: 64px; height: 64px;
      background: var(--color-action, #2563eb);
      opacity: 0.15;
      border: 2px solid var(--color-action, #2563eb);
    }
    .radius-key { font-size: 12px; font-weight: 600; color: var(--color-text-primary, #0f172a); }
    .radius-val { font-size: 11px; color: var(--color-text-secondary, #64748b); font-family: monospace; }

    /* ── Elevation ────────────────────────────────────────────── */
    .elevation-grid { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
    .elevation-item { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .elevation-box {
      width: 80px; height: 80px;
      background: var(--color-bg-default, #fff);
      border-radius: 10px;
      border: 1px solid var(--color-border-default, #e2e8f0);
    }
    .elevation-key { font-size: 12px; font-weight: 600; color: var(--color-text-primary, #0f172a); }
    .elevation-val { font-size: 10px; color: var(--color-text-secondary, #64748b); font-family: monospace; text-align: center; max-width: 120px; word-break: break-all; }

    /* ── Motion ───────────────────────────────────────────────── */
    .motion-grid { display: flex; flex-direction: column; gap: 16px; }
    .motion-item {
      display: flex; align-items: center; gap: 16px; cursor: pointer;
      padding: 10px 12px; border-radius: 8px;
      border: 1px solid var(--color-border-default, #e2e8f0);
      background: var(--color-bg-default, #fff);
      transition: border-color 150ms;
    }
    .motion-item:hover { border-color: var(--color-action, #2563eb); }
    .motion-track {
      width: 140px; height: 12px;
      background: var(--color-bg-overlay, #f1f5f9);
      border-radius: 6px;
      position: relative; overflow: hidden;
    }
    .motion-dot {
      position: absolute; left: 4px; top: 2px;
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--color-action, #2563eb);
      transform: translateX(0);
    }
    .motion-key { width: 100px; font-size: 12px; font-weight: 600; color: var(--color-text-primary, #0f172a); }
    .motion-val { width: 440px; font-size: 12px; font-family: monospace; color: var(--color-text-secondary, #64748b); }
    .motion-hint { font-size: 11px; color: var(--color-text-secondary, #64748b); }

    /* ── Components ───────────────────────────────────────────── */
    .component-row {
      display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
      padding: 24px; background: var(--color-bg-default, #fff);
      border: 1px solid var(--color-border-default, #e2e8f0);
      border-radius: 10px;
    }
    .component-col {
      padding: 24px; background: var(--color-bg-default, #fff);
      border: 1px solid var(--color-border-default, #e2e8f0);
      border-radius: 10px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .ds-btn {
      border: none; cursor: pointer;
      font-size: 14px; font-weight: 500;
      padding: 8px 16px;
      transition: opacity 120ms, filter 120ms;
    }
    .ds-btn:hover:not(:disabled) { filter: brightness(0.92); }
    .ds-field { display: flex; flex-direction: column; gap: 4px; }
    .ds-label { font-size: 13px; font-weight: 500; }
    .ds-input {
      border: 1.5px solid; padding: 8px 12px;
      font-size: 14px; outline: none;
      transition: border-color 150ms, box-shadow 150ms;
      width: 100%;
    }
    .ds-input:focus { box-shadow: 0 0 0 3px rgb(37 99 235 / 0.15); border-color: #2563eb !important; }
    .ds-helper-error { font-size: 12px; }
    .ds-card {
      border: 1px solid; width: 240px;
      overflow: hidden;
    }
    .ds-card-header { padding: 14px 16px; font-size: 14px; font-weight: 600; }
    .ds-card-body { padding: 14px 16px; }
    .ds-card-footer { padding: 12px 16px; display: flex; justify-content: flex-end; }
  </style>
</head>
<body>

  <!-- Sidebar -->
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

  <!-- Main -->
  <div class="main">
    <div class="topbar">
      <div class="topbar-breadcrumb">
        ${esc(name)} / <span id="topbar-current">Colors</span>
      </div>
      <div class="topbar-actions">
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
          <p class="page-desc">${pageDesc(id, name)}</p>
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
  </script>
</body>
</html>`;
}

function pageDesc(id: string, name: string): string {
  const descs: Record<string, string> = {
    colors: `The color tokens used across ${name}. Global palette tokens are the raw values; semantic tokens map intent to palette.`,
    typography: `Type scale and font settings for ${name}. All sizes, weights, and line heights.`,
    spacing: `Spacing scale based on the configured base unit. Used for padding, margin, and gap values.`,
    radius: `Border radius tokens. Applied to buttons, inputs, cards, and other surfaces.`,
    elevation: `Box shadow levels. Higher levels appear more elevated.`,
    motion: `Duration and easing tokens. Click any row to preview the animation.`,
    button: `Button component — variants, sizes, and states.`,
    input: `Input component — all states including error and disabled.`,
    card: `Card component — default, elevated, and outlined variants.`,
  };
  return descs[id] ?? "";
}
