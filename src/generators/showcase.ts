import * as path from "path";
import * as fs from "fs-extra";
import {
  DesignSystemConfig,
  GovernanceRules,
  ComponentMetadata,
} from "../types";

export type ShowcaseFormat = "html" | "vite";

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function generateShowcase(
  config: DesignSystemConfig,
  rules: GovernanceRules,
  metadata: ComponentMetadata[],
  outputDir: string,
  format: ShowcaseFormat,
): Promise<string> {
  const showcaseDir = path.join(outputDir, "showcase");
  await fs.ensureDir(showcaseDir);

  if (format === "html") {
    return generateHTML(config, rules, metadata, showcaseDir);
  } else {
    return generateVite(config, rules, metadata, showcaseDir);
  }
}

// ─── Shared data builders ─────────────────────────────────────────────────────

function buildColorTokens(config: DesignSystemConfig) {
  return Object.entries(config.color).map(([name, value]) => ({ name, value }));
}

function buildTypographyScale(config: DesignSystemConfig) {
  return config.typography.scale.map((size, i) => ({
    label: `size${i + 1}`,
    size,
    weight: config.typography.fontWeights[0],
  }));
}

function buildSpacingScale(config: DesignSystemConfig) {
  return [1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((m) => ({
    label: `space${m}`,
    value: m * config.spacing.baseUnit,
  }));
}

function buildRadiusScale(config: DesignSystemConfig) {
  return config.radius.scale.map((r, i) => ({
    label: `radius${i + 1}`,
    value: r,
  }));
}

// ─── HTML generator ───────────────────────────────────────────────────────────

async function generateHTML(
  config: DesignSystemConfig,
  rules: GovernanceRules,
  metadata: ComponentMetadata[],
  showcaseDir: string,
): Promise<string> {
  const colors = buildColorTokens(config);
  const typoScale = buildTypographyScale(config);
  const spacing = buildSpacingScale(config);
  const radii = buildRadiusScale(config);
  const buttonVariants = rules.button?.allowedVariants ?? [
    "primary",
    "secondary",
    "danger",
  ];
  const { color, typography, radius, spacing: sp } = config;
  const br = radius.scale[1];
  const pad = `${sp.baseUnit * 2}px ${sp.baseUnit * 4}px`;

  const colorSwatches = colors
    .map(
      ({ name, value }) => `
    <div class="swatch-wrap">
      <div class="swatch" style="background:${value}" data-copy="${value}"></div>
      <div class="swatch-label">${name}</div>
      <div class="swatch-value">${value}</div>
    </div>`,
    )
    .join("");

  const typoRows = typoScale
    .map(
      ({ label, size }) => `
    <div class="token-row">
      <span class="token-name">${label}</span>
      <span style="font-size:${size}px;font-family:${typography.fontFamily},sans-serif">
        The quick brown fox
      </span>
      <button class="copy-btn" data-copy="font-size: ${size}px">Copy</button>
    </div>`,
    )
    .join("");

  const spacingRows = spacing
    .map(
      ({ label, value }) => `
    <div class="token-row">
      <span class="token-name">${label}</span>
      <div class="spacing-bar" style="width:${Math.min(value * 2, 300)}px;height:16px;background:${color.primary};border-radius:2px"></div>
      <span class="token-value">${value}px</span>
      <button class="copy-btn" data-copy="${value}px">Copy</button>
    </div>`,
    )
    .join("");

  const radiusRows = radii
    .map(
      ({ label, value }) => `
    <div class="token-row">
      <span class="token-name">${label}</span>
      <div style="width:48px;height:48px;background:${color.primary};border-radius:${value}px;opacity:0.8"></div>
      <span class="token-value">${value}px</span>
      <button class="copy-btn" data-copy="${value}px">Copy</button>
    </div>`,
    )
    .join("");

  const buttonShowcase = buttonVariants
    .map((v) => {
      const bg =
        v === "primary"
          ? color.primary
          : v === "danger"
            ? color.danger
            : color.secondary;
      const snippet = `<Button variant="${v}">${v.charAt(0).toUpperCase() + v.slice(1)}</Button>`;
      return `
    <div class="component-item">
      <button style="
        background:${bg};color:#fff;border:none;padding:${pad};
        border-radius:${br}px;font-size:14px;font-weight:500;cursor:pointer;
        font-family:${typography.fontFamily},sans-serif;
      ">${v.charAt(0).toUpperCase() + v.slice(1)}</button>
      <button class="copy-btn" data-copy='${snippet}'>Copy</button>
    </div>`;
    })
    .join("");

  const inputShowcase = `
    <div class="component-item" style="flex-direction:column;align-items:flex-start;gap:8px;min-width:280px">
      <label style="font-size:14px;font-weight:500;font-family:${typography.fontFamily},sans-serif;color:${color.text}">Email address</label>
      <input type="email" placeholder="you@example.com" style="
        width:100%;padding:${pad};border:1px solid ${color.secondary};
        border-radius:${br}px;font-size:14px;font-family:${typography.fontFamily},sans-serif;
        color:${color.text};background:${color.background};box-sizing:border-box;outline:none;
      "/>
      <button class="copy-btn" data-copy='<Input label="Email address" type="email" placeholder="you@example.com" />'>Copy</button>
    </div>
    <div class="component-item" style="flex-direction:column;align-items:flex-start;gap:8px;min-width:280px">
      <label style="font-size:14px;font-weight:500;font-family:${typography.fontFamily},sans-serif;color:${color.text}">Password</label>
      <input type="password" placeholder="••••••••" style="
        width:100%;padding:${pad};border:1px solid ${color.danger};
        border-radius:${br}px;font-size:14px;font-family:${typography.fontFamily},sans-serif;
        color:${color.text};background:${color.background};box-sizing:border-box;outline:none;
      "/>
      <span style="font-size:12px;color:${color.danger};font-family:${typography.fontFamily},sans-serif">Password is required</span>
      <button class="copy-btn" data-copy='<Input label="Password" type="password" error="Password is required" />'>Copy</button>
    </div>`;

  const cardShowcase = `
    <div class="component-item">
      <div style="
        background:${color.background};border-radius:${radius.scale[2]}px;
        padding:${sp.baseUnit * 6}px;max-width:320px;
        box-shadow:0 1px 3px rgba(0,0,0,0.1);border:1px solid rgba(0,0,0,0.06);
      ">
        <div style="font-size:20px;font-weight:600;margin-bottom:8px;font-family:${typography.fontFamily},sans-serif;color:${color.text}">Card title</div>
        <div style="font-size:14px;color:${color.secondary};font-family:${typography.fontFamily},sans-serif;line-height:1.6">
          This is a card component with a small shadow. Use it to group related content.
        </div>
      </div>
      <button class="copy-btn" data-copy='<Card shadow="small"><Typography variant="h3">Title</Typography></Card>'>Copy</button>
    </div>
    <div class="component-item">
      <div style="
        background:${color.background};border-radius:${radius.scale[2]}px;
        padding:${sp.baseUnit * 6}px;max-width:320px;
        box-shadow:0 4px 12px rgba(0,0,0,0.12);border:1px solid rgba(0,0,0,0.06);
      ">
        <div style="font-size:20px;font-weight:600;margin-bottom:8px;font-family:${typography.fontFamily},sans-serif;color:${color.text}">Elevated card</div>
        <div style="font-size:14px;color:${color.secondary};font-family:${typography.fontFamily},sans-serif;line-height:1.6">
          This card uses the medium shadow for more visual elevation.
        </div>
      </div>
      <button class="copy-btn" data-copy='<Card shadow="medium"><Typography variant="h3">Title</Typography></Card>'>Copy</button>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Design System Showcase</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=${typography.fontFamily.replace(/ /g, "+")}:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --color-primary: ${color.primary};
      --color-secondary: ${color.secondary};
      --color-danger: ${color.danger};
      --color-bg: ${color.background};
      --color-text: ${color.text};
      --color-surface: #f8fafc;
      --color-border: rgba(0,0,0,0.08);
      --sidebar-width: 220px;
      --font: '${typography.fontFamily}', system-ui, sans-serif;
    }
    [data-theme="dark"] {
      --color-bg: #0f172a;
      --color-text: #f1f5f9;
      --color-surface: #1e293b;
      --color-border: rgba(255,255,255,0.08);
    }

    body {
      font-family: var(--font);
      background: var(--color-bg);
      color: var(--color-text);
      display: flex;
      min-height: 100vh;
      transition: background 0.2s, color 0.2s;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: var(--sidebar-width);
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0; left: 0; bottom: 0;
      overflow-y: auto;
    }
    .sidebar-logo {
      padding: 24px 20px 16px;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-primary);
      border-bottom: 1px solid var(--color-border);
    }
    .sidebar-logo span { font-weight: 400; font-size: 12px; color: var(--color-secondary); display: block; margin-top: 2px; }
    .nav-section { padding: 16px 12px 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-secondary); }
    .nav-item {
      display: block; padding: 8px 12px; margin: 2px 4px;
      border-radius: 6px; font-size: 13px; font-weight: 500;
      color: var(--color-text); text-decoration: none; cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .nav-item:hover { background: var(--color-border); }
    .nav-item.active { background: var(--color-primary); color: #fff; }

    /* ── Main ── */
    .main {
      margin-left: var(--sidebar-width);
      flex: 1;
      padding: 40px 48px;
      max-width: 960px;
    }

    /* ── Header bar ── */
    .topbar {
      position: fixed;
      top: 0; left: var(--sidebar-width); right: 0;
      height: 56px;
      background: var(--color-bg);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 48px;
      gap: 12px;
      z-index: 10;
    }
    .main { padding-top: 88px; }

    .dark-toggle {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-family: var(--font);
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }
    .dark-toggle:hover { background: var(--color-border); }

    /* ── Sections ── */
    .section { display: none; }
    .section.active { display: block; }

    .page-title { font-size: 28px; font-weight: 600; margin-bottom: 6px; }
    .page-desc { font-size: 15px; color: var(--color-secondary); margin-bottom: 36px; }

    .block { margin-bottom: 40px; }
    .block-title { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-secondary); margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--color-border); }

    /* ── Color swatches ── */
    .swatches { display: flex; flex-wrap: wrap; gap: 16px; }
    .swatch-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
    .swatch { width: 72px; height: 72px; border-radius: 12px; border: 1px solid var(--color-border); transition: transform 0.15s; }
    .swatch:hover { transform: scale(1.08); }
    .swatch-label { font-size: 12px; font-weight: 600; }
    .swatch-value { font-size: 11px; color: var(--color-secondary); font-family: monospace; }

    /* ── Token rows ── */
    .token-row { display: flex; align-items: center; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--color-border); }
    .token-name { font-family: monospace; font-size: 13px; color: var(--color-primary); width: 100px; flex-shrink: 0; }
    .token-value { font-family: monospace; font-size: 13px; color: var(--color-secondary); margin-left: auto; }

    /* ── Component items ── */
    .component-row { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
    .component-item { display: flex; flex-direction: column; gap: 12px; }

    /* ── Copy button ── */
    .copy-btn {
      font-size: 11px; font-family: var(--font); font-weight: 500;
      padding: 4px 10px; border-radius: 4px; border: 1px solid var(--color-border);
      background: var(--color-surface); color: var(--color-secondary);
      cursor: pointer; transition: all 0.15s; align-self: flex-start;
    }
    .copy-btn:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    .copy-btn.copied { background: #16a34a; color: #fff; border-color: #16a34a; }

    /* ── Toast ── */
    .toast {
      position: fixed; bottom: 24px; right: 24px;
      background: #1e293b; color: #f1f5f9;
      padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 500;
      opacity: 0; transform: translateY(8px);
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none; z-index: 100;
    }
    .toast.show { opacity: 1; transform: translateY(0); }
  </style>
</head>
<body>

<!-- Sidebar -->
<nav class="sidebar">
  <div class="sidebar-logo">🎨 Design System <span>Auto-generated by dsgen</span></div>
  <div class="nav-section">Foundations</div>
  <a class="nav-item active" onclick="showSection('colors')">Colors</a>
  <a class="nav-item" onclick="showSection('typography')">Typography</a>
  <a class="nav-item" onclick="showSection('spacing')">Spacing</a>
  <a class="nav-item" onclick="showSection('radius')">Border Radius</a>
  <div class="nav-section">Components</div>
  <a class="nav-item" onclick="showSection('button')">Button</a>
  <a class="nav-item" onclick="showSection('input')">Input</a>
  <a class="nav-item" onclick="showSection('card')">Card</a>
  <a class="nav-item" onclick="showSection('typography-comp')">Typography</a>
</nav>

<!-- Top bar -->
<div class="topbar">
  <button class="dark-toggle" onclick="toggleDark()">🌙 Dark mode</button>
</div>

<!-- Main -->
<main class="main">

  <!-- Colors -->
  <div class="section active" id="section-colors">
    <div class="page-title">Colors</div>
    <div class="page-desc">Core color palette. Click any swatch to copy its hex value.</div>
    <div class="block">
      <div class="block-title">Color tokens</div>
      <div class="swatches">${colorSwatches}</div>
    </div>
  </div>

  <!-- Typography tokens -->
  <div class="section" id="section-typography">
    <div class="page-title">Typography</div>
    <div class="page-desc">Font family: <strong>${typography.fontFamily}</strong> · ${typography.scale.length} sizes · ${typography.fontWeights.length} weights</div>
    <div class="block">
      <div class="block-title">Type scale</div>
      ${typoRows}
    </div>
  </div>

  <!-- Spacing -->
  <div class="section" id="section-spacing">
    <div class="page-title">Spacing</div>
    <div class="page-desc">Base unit: <strong>${config.spacing.baseUnit}px</strong>. All spacing is a multiple of the base unit.</div>
    <div class="block">
      <div class="block-title">Spacing scale</div>
      ${spacingRows}
    </div>
  </div>

  <!-- Radius -->
  <div class="section" id="section-radius">
    <div class="page-title">Border Radius</div>
    <div class="page-desc">Available border radius tokens.</div>
    <div class="block">
      <div class="block-title">Radius scale</div>
      ${radiusRows}
    </div>
  </div>

  <!-- Button -->
  <div class="section" id="section-button">
    <div class="page-title">Button</div>
    <div class="page-desc">Variants: ${buttonVariants.join(", ")}. Keyboard accessible with focus ring.</div>
    <div class="block">
      <div class="block-title">Variants</div>
      <div class="component-row">${buttonShowcase}</div>
    </div>
  </div>

  <!-- Input -->
  <div class="section" id="section-input">
    <div class="page-title">Input</div>
    <div class="page-desc">Text inputs with label, hint, and error states.</div>
    <div class="block">
      <div class="block-title">States</div>
      <div class="component-row">${inputShowcase}</div>
    </div>
  </div>

  <!-- Card -->
  <div class="section" id="section-card">
    <div class="page-title">Card</div>
    <div class="page-desc">Content container with configurable shadow and border radius.</div>
    <div class="block">
      <div class="block-title">Shadow variants</div>
      <div class="component-row">${cardShowcase}</div>
    </div>
  </div>

  <!-- Typography component -->
  <div class="section" id="section-typography-comp">
    <div class="page-title">Typography</div>
    <div class="page-desc">Text hierarchy from h1 to caption.</div>
    <div class="block">
      <div class="block-title">Variants</div>
      ${["h1", "h2", "h3", "h4", "body", "small", "caption"]
        .map((v) => {
          const sizeMap: Record<string, number> = {
            h1: config.typography.scale[5],
            h2: config.typography.scale[4],
            h3: config.typography.scale[3],
            h4: config.typography.scale[2],
            body: config.typography.scale[2],
            small: config.typography.scale[1],
            caption: config.typography.scale[0],
          };
          const weightMap: Record<string, number> = {
            h1: 600,
            h2: 600,
            h3: 500,
            h4: 500,
            body: 400,
            small: 400,
            caption: 400,
          };
          const size = sizeMap[v];
          const weight = weightMap[v];
          const snippet = `<Typography variant="${v}">Your text here</Typography>`;
          return `<div class="token-row">
          <span class="token-name">${v}</span>
          <span style="font-size:${size}px;font-weight:${weight};font-family:${typography.fontFamily},sans-serif">${v.charAt(0).toUpperCase() + v.slice(1)} — The quick brown fox</span>
          <button class="copy-btn" data-copy='${snippet}'>Copy</button>
        </div>`;
        })
        .join("")}
    </div>
  </div>

</main>

<div class="toast" id="toast">Copied!</div>

<script>
  function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('section-' + id).classList.add('active');
    event.target.classList.add('active');
  }

  function toggleDark() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    event.target.textContent = isDark ? '🌙 Dark mode' : '☀️ Light mode';
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      if (btn) {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
      }
      showToast('Copied to clipboard!');
    });
  }

  // Copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => copyText(btn.dataset.copy, btn));
  });

  // Swatch click
  document.querySelectorAll('.swatch').forEach(sw => {
    sw.addEventListener('click', () => copyText(sw.dataset.copy, null));
  });
</script>
</body>
</html>`;

  const outPath = path.join(showcaseDir, "index.html");
  await fs.writeFile(outPath, html);
  return outPath;
}

// ─── Vite generator ───────────────────────────────────────────────────────────

async function generateVite(
  config: DesignSystemConfig,
  rules: GovernanceRules,
  metadata: ComponentMetadata[],
  showcaseDir: string,
): Promise<string> {
  const { color, typography, radius, spacing: sp } = config;
  const buttonVariants = rules.button?.allowedVariants ?? [
    "primary",
    "secondary",
    "danger",
  ];
  const br = radius.scale[1];
  const pad = `${sp.baseUnit * 2}px ${sp.baseUnit * 4}px`;

  // package.json
  await fs.writeJson(
    path.join(showcaseDir, "package.json"),
    {
      name: "design-system-showcase",
      version: "0.1.0",
      private: true,
      scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
      dependencies: { react: "^18.2.0", "react-dom": "^18.2.0" },
      devDependencies: { "@vitejs/plugin-react": "^4.2.0", vite: "^5.0.0" },
    },
    { spaces: 2 },
  );

  // vite.config.js
  await fs.writeFile(
    path.join(showcaseDir, "vite.config.js"),
    `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
`.trim(),
  );

  // index.html entry
  await fs.writeFile(
    path.join(showcaseDir, "index.html"),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Design System Showcase</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=${typography.fontFamily.replace(/ /g, "+")}:wght@400;500;600&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
  );

  await fs.ensureDir(path.join(showcaseDir, "src"));

  // tokens.js — inlined config for the app
  const colors = buildColorTokens(config);
  const typoScale = buildTypographyScale(config);
  const spacingScale = buildSpacingScale(config);
  const radiiScale = buildRadiusScale(config);

  await fs.writeFile(
    path.join(showcaseDir, "src", "tokens.js"),
    `
export const tokens = ${JSON.stringify(
      {
        color: config.color,
        typography: {
          fontFamily: config.typography.fontFamily,
          scale: config.typography.scale,
          fontWeights: config.typography.fontWeights,
        },
        spacing: { baseUnit: config.spacing.baseUnit },
        radius: config.radius,
      },
      null,
      2,
    )};
export const buttonVariants = ${JSON.stringify(buttonVariants)};
`.trim(),
  );

  // main.jsx
  await fs.writeFile(
    path.join(showcaseDir, "src", "main.jsx"),
    `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
createRoot(document.getElementById('root')).render(<App />);
`.trim(),
  );

  // styles.css
  await fs.writeFile(
    path.join(showcaseDir, "src", "styles.css"),
    `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --color-primary: ${color.primary};
  --color-secondary: ${color.secondary};
  --color-danger: ${color.danger};
  --color-bg: ${color.background};
  --color-text: ${color.text};
  --color-surface: #f8fafc;
  --color-border: rgba(0,0,0,0.08);
  --sidebar-width: 220px;
  --font: '${typography.fontFamily}', system-ui, sans-serif;
}
.dark {
  --color-bg: #0f172a;
  --color-text: #f1f5f9;
  --color-surface: #1e293b;
  --color-border: rgba(255,255,255,0.08);
}
body { font-family: var(--font); background: var(--color-bg); color: var(--color-text); }
`,
  );

  // App.jsx — full React app
  await fs.writeFile(
    path.join(showcaseDir, "src", "App.jsx"),
    buildViteApp(config, rules, metadata),
  );

  return showcaseDir;
}

function buildViteApp(
  config: DesignSystemConfig,
  rules: GovernanceRules,
  _metadata: ComponentMetadata[],
): string {
  const { color, typography, radius, spacing: sp } = config;
  const buttonVariants = rules.button?.allowedVariants ?? [
    "primary",
    "secondary",
    "danger",
  ];
  const br = radius.scale[1];
  const pad = `${sp.baseUnit * 2}px ${sp.baseUnit * 4}px`;

  return `import { useState, useCallback } from 'react';

const tokens = {
  color: ${JSON.stringify(color)},
  typography: ${JSON.stringify(config.typography)},
  spacing: ${JSON.stringify(config.spacing)},
  radius: ${JSON.stringify(config.radius)},
};

const buttonVariants = ${JSON.stringify(buttonVariants)};

// ─── Primitives ───────────────────────────────────────────────────────────────

function Button({ variant = 'primary', children, ...props }) {
  const bg = variant === 'primary' ? tokens.color.primary
           : variant === 'danger'  ? tokens.color.danger
           : tokens.color.secondary;
  return (
    <button {...props} style={{
      background: bg, color: '#fff', border: 'none',
      padding: '${pad}', borderRadius: '${br}px',
      fontSize: 14, fontWeight: 500, cursor: 'pointer',
      fontFamily: tokens.typography.fontFamily + ',sans-serif',
      transition: 'opacity 0.15s',
      ...props.style,
    }}
    onMouseEnter={e => e.target.style.opacity = '0.85'}
    onMouseLeave={e => e.target.style.opacity = '1'}
    >{children}</button>
  );
}

function Input({ label, error, hint, ...props }) {
  const id = label.toLowerCase().replace(/\\s+/g, '-');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 14, fontWeight: 500 }}>{label}</label>
      <input id={id} {...props} style={{
        padding: '${pad}', borderRadius: '${br}px',
        border: \`1px solid \${error ? tokens.color.danger : tokens.color.secondary}\`,
        fontSize: 14, fontFamily: tokens.typography.fontFamily + ',sans-serif',
        color: 'var(--color-text)', background: 'var(--color-bg)',
        outline: 'none', width: '100%',
      }} />
      {hint && !error && <span style={{ fontSize: 12, color: tokens.color.secondary }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: tokens.color.danger }}>{error}</span>}
    </div>
  );
}

function Card({ children, shadow = 'small', ...props }) {
  const shadows = { none: 'none', small: '0 1px 3px rgba(0,0,0,0.1)', medium: '0 4px 12px rgba(0,0,0,0.12)' };
  return (
    <div {...props} style={{
      background: 'var(--color-bg)', borderRadius: ${radius.scale[2]},
      padding: ${sp.baseUnit * 6}, maxWidth: 360,
      boxShadow: shadows[shadow], border: '1px solid var(--color-border)',
      ...props.style,
    }}>{children}</div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button onClick={copy} style={{
      fontSize: 11, padding: '3px 10px', borderRadius: 4,
      border: '1px solid var(--color-border)', background: copied ? '#16a34a' : 'var(--color-surface)',
      color: copied ? '#fff' : 'var(--color-secondary)',
      cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
      transition: 'all 0.15s',
    }}>{copied ? 'Copied!' : 'Copy'}</button>
  );
}

function SectionTitle({ children }) {
  return <h2 style={{ fontSize: 28, fontWeight: 600, marginBottom: 6 }}>{children}</h2>;
}

function SectionDesc({ children }) {
  return <p style={{ fontSize: 15, color: tokens.color.secondary, marginBottom: 36 }}>{children}</p>;
}

function BlockTitle({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
      color: tokens.color.secondary, marginBottom: 16, paddingBottom: 8,
      borderBottom: '1px solid var(--color-border)',
    }}>{children}</div>
  );
}

function TokenRow({ name, value, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '10px 0', borderBottom: '1px solid var(--color-border)',
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: 13, color: tokens.color.primary, width: 100, flexShrink: 0 }}>{name}</span>
      {children}
      {value && <span style={{ fontFamily: 'monospace', fontSize: 13, color: tokens.color.secondary, marginLeft: 'auto' }}>{value}</span>}
      <CopyButton text={value ?? name} />
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function ColorsSection() {
  const colors = Object.entries(tokens.color);
  return (
    <div>
      <SectionTitle>Colors</SectionTitle>
      <SectionDesc>Core color palette. Click any swatch to copy its hex value.</SectionDesc>
      <BlockTitle>Color tokens</BlockTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {colors.map(([name, value]) => (
          <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            onClick={() => navigator.clipboard.writeText(value)}>
            <div style={{
              width: 72, height: 72, borderRadius: 12, background: value,
              border: '1px solid var(--color-border)', transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>
            <span style={{ fontSize: 11, color: tokens.color.secondary, fontFamily: 'monospace' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypographySection() {
  const scale = tokens.typography.scale;
  const variants = [
    { label: 'h1', size: scale[5], weight: 600 },
    { label: 'h2', size: scale[4], weight: 600 },
    { label: 'h3', size: scale[3], weight: 500 },
    { label: 'h4', size: scale[2], weight: 500 },
    { label: 'body', size: scale[2], weight: 400 },
    { label: 'small', size: scale[1], weight: 400 },
    { label: 'caption', size: scale[0], weight: 400 },
  ];
  return (
    <div>
      <SectionTitle>Typography</SectionTitle>
      <SectionDesc>Font: <strong>{tokens.typography.fontFamily}</strong> · {scale.length} sizes · {tokens.typography.fontWeights.length} weights</SectionDesc>
      <BlockTitle>Type scale</BlockTitle>
      {variants.map(({ label, size, weight }) => (
        <TokenRow key={label} name={label} value={\`\${size}px / \${weight}\`}>
          <span style={{ fontSize: size, fontWeight: weight, fontFamily: tokens.typography.fontFamily + ',sans-serif' }}>
            The quick brown fox
          </span>
        </TokenRow>
      ))}
    </div>
  );
}

function SpacingSection() {
  const multipliers = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
  return (
    <div>
      <SectionTitle>Spacing</SectionTitle>
      <SectionDesc>Base unit: <strong>{tokens.spacing.baseUnit}px</strong>. All values are multiples of the base unit.</SectionDesc>
      <BlockTitle>Spacing scale</BlockTitle>
      {multipliers.map(m => {
        const val = m * tokens.spacing.baseUnit;
        return (
          <TokenRow key={m} name={\`space\${m}\`} value={\`\${val}px\`}>
            <div style={{ width: Math.min(val * 2, 300), height: 16, background: tokens.color.primary, borderRadius: 2 }} />
          </TokenRow>
        );
      })}
    </div>
  );
}

function RadiusSection() {
  return (
    <div>
      <SectionTitle>Border Radius</SectionTitle>
      <SectionDesc>Available border radius tokens.</SectionDesc>
      <BlockTitle>Radius scale</BlockTitle>
      {tokens.radius.scale.map((r, i) => (
        <TokenRow key={i} name={\`radius\${i + 1}\`} value={\`\${r}px\`}>
          <div style={{ width: 48, height: 48, background: tokens.color.primary, borderRadius: r, opacity: 0.8 }} />
        </TokenRow>
      ))}
    </div>
  );
}

function ButtonSection() {
  return (
    <div>
      <SectionTitle>Button</SectionTitle>
      <SectionDesc>Variants: {buttonVariants.join(', ')}. Keyboard accessible with visible focus ring.</SectionDesc>
      <BlockTitle>Variants</BlockTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        {buttonVariants.map(v => (
          <div key={v} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button variant={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</Button>
            <CopyButton text={\`<Button variant="\${v}">\${v}</Button>\`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function InputSection() {
  return (
    <div>
      <SectionTitle>Input</SectionTitle>
      <SectionDesc>Text inputs with label, hint, and error states.</SectionDesc>
      <BlockTitle>States</BlockTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
        <div style={{ minWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Email address" type="email" placeholder="you@example.com" hint="We'll never share your email." />
          <CopyButton text='<Input label="Email address" type="email" hint="..." />' />
        </div>
        <div style={{ minWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Password" type="password" placeholder="••••••••" error="Password is required" />
          <CopyButton text='<Input label="Password" type="password" error="Password is required" />' />
        </div>
      </div>
    </div>
  );
}

function CardSection() {
  return (
    <div>
      <SectionTitle>Card</SectionTitle>
      <SectionDesc>Content container with configurable shadow variants.</SectionDesc>
      <BlockTitle>Shadow variants</BlockTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {['none', 'small', 'medium'].map(shadow => (
          <div key={shadow} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card shadow={shadow}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>shadow="{shadow}"</div>
              <div style={{ fontSize: 14, color: tokens.color.secondary, lineHeight: 1.6 }}>
                Use this card for grouping related content with a {shadow} elevation.
              </div>
            </Card>
            <CopyButton text={\`<Card shadow="\${shadow}">...</Card>\`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TypographyCompSection() {
  const scale = tokens.typography.scale;
  const variants = [
    { label: 'h1', size: scale[5], weight: 600 },
    { label: 'h2', size: scale[4], weight: 600 },
    { label: 'h3', size: scale[3], weight: 500 },
    { label: 'h4', size: scale[2], weight: 500 },
    { label: 'body', size: scale[2], weight: 400 },
    { label: 'small', size: scale[1], weight: 400 },
    { label: 'caption', size: scale[0], weight: 400 },
  ];
  return (
    <div>
      <SectionTitle>Typography</SectionTitle>
      <SectionDesc>Text hierarchy from h1 to caption.</SectionDesc>
      <BlockTitle>Variants</BlockTitle>
      {variants.map(({ label, size, weight }) => (
        <TokenRow key={label} name={label} value={\`\${size}px\`}>
          <span style={{ fontSize: size, fontWeight: weight }}>{label} — The quick brown fox</span>
        </TokenRow>
      ))}
    </div>
  );
}

// ─── App shell ────────────────────────────────────────────────────────────────

const navItems = [
  { section: 'foundations', label: null },
  { id: 'colors',      label: 'Colors' },
  { id: 'typography',  label: 'Typography' },
  { id: 'spacing',     label: 'Spacing' },
  { id: 'radius',      label: 'Border Radius' },
  { section: 'components', label: null },
  { id: 'button',      label: 'Button' },
  { id: 'input',       label: 'Input' },
  { id: 'card',        label: 'Card' },
  { id: 'typo-comp',   label: 'Typography' },
];

const sectionMap = {
  colors:     <ColorsSection />,
  typography: <TypographySection />,
  spacing:    <SpacingSection />,
  radius:     <RadiusSection />,
  button:     <ButtonSection />,
  input:      <InputSection />,
  card:       <CardSection />,
  'typo-comp':<TypographyCompSection />,
};

export function App() {
  const [active, setActive] = useState('colors');
  const [dark, setDark] = useState(false);

  const sidebarStyle = {
    width: 220, background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)',
    display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, overflowY: 'auto',
  };

  return (
    <div className={dark ? 'dark' : ''} style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: tokens.typography.fontFamily + ',sans-serif' }}>

      {/* Sidebar */}
      <nav style={sidebarStyle}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: tokens.color.primary }}>🎨 Design System</div>
          <div style={{ fontSize: 11, color: tokens.color.secondary, marginTop: 2 }}>Auto-generated by dsgen</div>
        </div>

        {navItems.map((item, i) =>
          item.section ? (
            <div key={i} style={{ padding: '16px 12px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tokens.color.secondary }}>
              {item.section}
            </div>
          ) : (
            <button key={item.id} onClick={() => setActive(item.id)} style={{
              display: 'block', width: 'calc(100% - 8px)', margin: '2px 4px', padding: '8px 12px',
              borderRadius: 6, fontSize: 13, fontWeight: 500, textAlign: 'left', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
              background: active === item.id ? tokens.color.primary : 'transparent',
              color: active === item.id ? '#fff' : 'var(--color-text)',
            }}>{item.label}</button>
          )
        )}
      </nav>

      {/* Topbar */}
      <div style={{
        position: 'fixed', top: 0, left: 220, right: 0, height: 56,
        background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        padding: '0 48px', zIndex: 10,
      }}>
        <button onClick={() => setDark(d => !d)} style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          color: 'var(--color-text)', padding: '6px 14px', borderRadius: 20,
          fontSize: 13, fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer',
        }}>{dark ? '☀️ Light mode' : '🌙 Dark mode'}</button>
      </div>

      {/* Content */}
      <main style={{ marginLeft: 220, flex: 1, padding: '88px 48px 48px', maxWidth: 960 }}>
        {sectionMap[active]}
      </main>
    </div>
  );
}
`;
}
