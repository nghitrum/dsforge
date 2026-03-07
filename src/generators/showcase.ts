import * as path from "path";
import * as fs from "fs-extra";
import {
  DesignSystemConfig,
  GovernanceRules,
  ComponentMetadata,
} from "../types";
import { resolveTokens } from "../utils/resolve-tokens";

export type ShowcaseFormat = "html" | "vite";

export async function generateShowcase(
  config: DesignSystemConfig,
  rules: GovernanceRules,
  metadata: ComponentMetadata[],
  outputDir: string,
  format: ShowcaseFormat,
): Promise<string> {
  const showcaseDir = path.join(outputDir, "showcase");
  await fs.ensureDir(showcaseDir);
  if (format === "html")
    return generateHTML(config, rules, metadata, showcaseDir);
  return generateVite(config, rules, metadata, showcaseDir);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropRow {
  name: string;
  type: string;
  default: string;
  description: string;
}
interface Snippet {
  label: string;
  code: string;
}
interface ComponentDoc {
  description: string;
  usage: string[];
  props: PropRow[];
  snippets: Snippet[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeJSON(val: unknown): string {
  return JSON.stringify(val).replace(/<\/script>/gi, "<\\/script>");
}

// ─── Docs content ─────────────────────────────────────────────────────────────

function buildDocs(
  config: DesignSystemConfig,
  rules: GovernanceRules,
): Record<string, ComponentDoc> {
  const t = resolveTokens(config);
  const bv = rules.button?.allowedVariants ?? [
    "primary",
    "secondary",
    "danger",
  ];

  return {
    Button: {
      description:
        "Triggers an action or event. Supports multiple variants for different semantic weights. Fully keyboard accessible with a visible focus ring.",
      usage: [
        "Use `primary` for the main call-to-action on a page — one per section.",
        "Use `secondary` for supporting actions that don't need as much visual weight.",
        "Use `danger` for destructive actions like deleting or removing data.",
        "Always provide an `aria-label` when the button contains only an icon.",
      ],
      props: [
        {
          name: "variant",
          type: bv.map((v) => `"${v}"`).join(" | "),
          default: '"primary"',
          description: "Visual style of the button",
        },
        {
          name: "children",
          type: "ReactNode",
          default: "—",
          description: "Button label or content",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Prevents interaction and dims the button",
        },
        {
          name: "aria-label",
          type: "string",
          default: "—",
          description: "Required for icon-only buttons",
        },
        {
          name: "onClick",
          type: "(e: MouseEvent) => void",
          default: "—",
          description: "Click handler",
        },
      ],
      snippets: [
        {
          label: "Basic",
          code: '<Button variant="primary">Save changes</Button>',
        },
        {
          label: "Danger",
          code: '<Button variant="danger">Delete account</Button>',
        },
        {
          label: "Disabled",
          code: '<Button variant="primary" disabled>Processing...</Button>',
        },
        {
          label: "Icon only",
          code: '<Button variant="secondary" aria-label="Close dialog">✕</Button>',
        },
      ],
    },

    Input: {
      description:
        "A labelled text input with support for hint text and validation error states. The label is always visible — placeholder alone is not sufficient for accessibility.",
      usage: [
        "Always provide a `label` prop — it renders a visible `<label>` element linked to the input.",
        "Use `hint` for helper text shown below the field before the user interacts.",
        "Use `error` to show validation feedback. This replaces the hint and applies danger styling.",
        "Avoid disabling inputs unless necessary — prefer read-only or explanatory text instead.",
      ],
      props: [
        {
          name: "label",
          type: "string",
          default: "—",
          description: "Visible label text, also used as the input id",
        },
        {
          name: "type",
          type: "string",
          default: '"text"',
          description: "HTML input type (text, email, password, etc.)",
        },
        {
          name: "placeholder",
          type: "string",
          default: "—",
          description: "Placeholder — supplement to label, not a replacement",
        },
        {
          name: "hint",
          type: "string",
          default: "—",
          description: "Helper text shown below the field",
        },
        {
          name: "error",
          type: "string",
          default: "—",
          description: "Validation error message — replaces hint when set",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Disables the input",
        },
      ],
      snippets: [
        {
          label: "Basic",
          code: '<Input label="Full name" placeholder="Jane Smith" />',
        },
        {
          label: "With hint",
          code: '<Input label="Email" type="email" hint="We will never share your email." />',
        },
        {
          label: "With error",
          code: '<Input label="Password" type="password" error="Password must be at least 8 characters." />',
        },
      ],
    },

    Card: {
      description:
        "A surface for grouping related content. Cards establish visual hierarchy through shadow elevation. They are layout containers — they don't carry semantic meaning on their own.",
      usage: [
        'Use shadow="none" for cards inside already-elevated surfaces like modals or sidebars.',
        'Use shadow="small" (default) for standard content grouping.',
        'Use shadow="medium" for cards that need to stand out — featured content, selected state.',
        "Use the `as` prop to render as `<article>`, `<section>`, or `<li>` when semantics matter.",
      ],
      props: [
        {
          name: "shadow",
          type: '"none" | "small" | "medium"',
          default: '"small"',
          description: "Elevation shadow level",
        },
        {
          name: "as",
          type: "ElementType",
          default: '"div"',
          description: "HTML element or component to render as",
        },
        {
          name: "style",
          type: "CSSProperties",
          default: "—",
          description: "Additional inline styles",
        },
        {
          name: "children",
          type: "ReactNode",
          default: "—",
          description: "Card content",
        },
      ],
      snippets: [
        {
          label: "Basic",
          code: '<Card>\n  <Typography variant="h3">Title</Typography>\n  <Typography variant="body">Content here.</Typography>\n</Card>',
        },
        {
          label: "Elevated",
          code: '<Card shadow="medium">\n  <Typography variant="h3">Featured</Typography>\n</Card>',
        },
        {
          label: "Semantic",
          code: '<Card as="article" shadow="small">\n  <Typography variant="h2">Post title</Typography>\n</Card>',
        },
      ],
    },

    Typography: {
      description:
        "Renders text with consistent scale, weight, and color from your design tokens. Maps semantic variants to the correct HTML element by default.",
      usage: [
        "Use `h1`–`h4` for headings — they render as the correct HTML heading element automatically.",
        "Use `body` for paragraph text — renders as `<p>`.",
        "Use `small` for secondary information like timestamps or metadata.",
        "Use `caption` for labels under images or form hints.",
        "Override the rendered element with `as` when you need a different semantic tag.",
      ],
      props: [
        {
          name: "variant",
          type: '"h1" | "h2" | "h3" | "h4" | "body" | "small" | "caption"',
          default: '"body"',
          description: "Text style and default HTML element",
        },
        {
          name: "as",
          type: "ElementType",
          default: "—",
          description: "Override the rendered HTML element",
        },
        {
          name: "color",
          type: "string",
          default: "token: text",
          description: "Text color — accepts any CSS color value",
        },
        {
          name: "children",
          type: "ReactNode",
          default: "—",
          description: "Text content",
        },
      ],
      snippets: [
        {
          label: "Heading",
          code: '<Typography variant="h1">Page title</Typography>',
        },
        {
          label: "Body",
          code: '<Typography variant="body">Paragraph content here.</Typography>',
        },
        {
          label: "Caption",
          code: '<Typography variant="caption">Last updated 2 hours ago</Typography>',
        },
        {
          label: "Override tag",
          code: '<Typography variant="h2" as="h3">Visual h2, semantic h3</Typography>',
        },
      ],
    },

    Stack: {
      description:
        "A layout primitive that arranges children in a row or column with consistent spacing. Replaces manual flexbox and margin hacks with a single declarative component.",
      usage: [
        'Use direction="column" (default) to stack items vertically — forms, lists, page sections.',
        'Use direction="row" to arrange items horizontally — toolbars, button groups, nav items.',
        `The \`gap\` prop is a multiplier of the base spacing unit (${t.spaceXs} = 1×).`,
        "Use `wrap` for responsive layouts that should flow to a new line when the container is narrow.",
      ],
      props: [
        {
          name: "direction",
          type: '"row" | "column"',
          default: '"column"',
          description: "Main axis direction",
        },
        {
          name: "gap",
          type: "number",
          default: "2",
          description: `Spacing multiplier × ${t.spaceXs} base unit`,
        },
        {
          name: "align",
          type: 'CSSProperties["alignItems"]',
          default: '"stretch"',
          description: "Cross-axis alignment",
        },
        {
          name: "justify",
          type: 'CSSProperties["justifyContent"]',
          default: '"flex-start"',
          description: "Main-axis alignment",
        },
        {
          name: "wrap",
          type: "boolean",
          default: "false",
          description: "Allow children to wrap to a new line",
        },
        {
          name: "as",
          type: "ElementType",
          default: '"div"',
          description: "HTML element to render as",
        },
      ],
      snippets: [
        {
          label: "Vertical",
          code: '<Stack gap={3}>\n  <Input label="First name" />\n  <Input label="Last name" />\n  <Button>Submit</Button>\n</Stack>',
        },
        {
          label: "Horizontal",
          code: '<Stack direction="row" gap={2} align="center">\n  <Button variant="secondary">Cancel</Button>\n  <Button variant="primary">Save</Button>\n</Stack>',
        },
      ],
    },
  };
}

// ─── HTML showcase ────────────────────────────────────────────────────────────

async function generateHTML(
  config: DesignSystemConfig,
  rules: GovernanceRules,
  metadata: ComponentMetadata[],
  showcaseDir: string,
): Promise<string> {
  const t = resolveTokens(config);
  const bv = rules.button?.allowedVariants ?? [
    "primary",
    "secondary",
    "danger",
  ];
  const docs = buildDocs(config, rules);

  // ── Google Fonts URL ───────────────────────────────────────────────────────
  const wghts = config.typography.fontWeights.join(";");
  const googleFont = `https://fonts.googleapis.com/css2?family=${t.fontFamily.replace(/ /g, "+")}:wght@${wghts}&display=swap`;

  // ── Token sections ─────────────────────────────────────────────────────────
  const colorSwatches = Object.entries(config.color)
    .map(
      ([name, value]) =>
        `<div class="swatch-wrap" onclick="copyText('${value}')">` +
        `<div class="swatch" style="background:${value}"></div>` +
        `<div class="swatch-label">${name}</div>` +
        `<div class="swatch-value">${value}</div>` +
        `</div>`,
    )
    .join("");

  const typoRows = config.typography.scale
    .map(
      (size, i) =>
        `<div class="token-row">` +
        `<span class="token-name">size${i + 1}</span>` +
        `<span style="font-size:${size}px;font-family:${t.fontFamily},sans-serif;flex:1">The quick brown fox</span>` +
        `<span class="token-value">${size}px</span>` +
        `<button class="copy-btn" onclick="copyText('font-size: ${size}px', this)">Copy</button>` +
        `</div>`,
    )
    .join("");

  const spacingRows = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16]
    .map((m) => {
      const val = m * config.spacing.baseUnit;
      return (
        `<div class="token-row">` +
        `<span class="token-name">space${m}</span>` +
        `<div style="width:${Math.min(val * 2, 240)}px;height:${t.spaceXl};background:${t.colorPrimary};border-radius:${t.radiusSm};flex-shrink:0"></div>` +
        `<span class="token-value">${val}px</span>` +
        `<button class="copy-btn" onclick="copyText('${val}px', this)">Copy</button>` +
        `</div>`
      );
    })
    .join("");

  const radiusRows = config.radius.scale
    .map(
      (r, i) =>
        `<div class="token-row">` +
        `<span class="token-name">radius${i + 1}</span>` +
        `<div style="width:${t.space2xl};height:${t.space2xl};background:${t.colorPrimary};border-radius:${r}px;flex-shrink:0"></div>` +
        `<span class="token-value">${r}px</span>` +
        `<button class="copy-btn" onclick="copyText('${r}px', this)">Copy</button>` +
        `</div>`,
    )
    .join("");

  // ── Navigation items ───────────────────────────────────────────────────────
  const navItems = metadata
    .map(
      (m) =>
        `<button class="nav-item" onclick="show('${m.component.toLowerCase()}', this)">${m.component}</button>`,
    )
    .join("");

  // ── Component sections ─────────────────────────────────────────────────────
  function propsTable(props: PropRow[]): string {
    const rows = props
      .map(
        (p) =>
          `<tr>` +
          `<td><code>${p.name}</code></td>` +
          `<td><code class="type">${esc(p.type)}</code></td>` +
          `<td><code>${esc(p.default)}</code></td>` +
          `<td>${p.description}</td>` +
          `</tr>`,
      )
      .join("");
    return (
      `<table class="props-table">` +
      `<thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>` +
      `<tbody>${rows}</tbody>` +
      `</table>`
    );
  }

  function a11ySection(meta: ComponentMetadata): string {
    const items = [
      meta.accessibilityContract.keyboard
        ? "Keyboard navigable"
        : "Not keyboard navigable",
      meta.accessibilityContract.focusRing !== "none"
        ? `Focus ring: ${meta.accessibilityContract.focusRing}`
        : "No focus ring",
      ...(meta.accessibilityContract.ariaLabel
        ? [`aria-label: ${meta.accessibilityContract.ariaLabel}`]
        : []),
    ];
    return `<ul class="a11y-list">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
  }

  function componentSection(meta: ComponentMetadata): string {
    const doc = docs[meta.component];
    if (!doc) return "";
    const cn = meta.component;
    const cid = cn.toLowerCase();

    const metaItems: [string, string][] = [
      ["Role", meta.role],
      ["Hierarchy", meta.hierarchyLevel],
      ["Interaction", meta.interactionModel],
      ["Layout impact", meta.layoutImpact],
      ["Destructive", meta.destructive ? "yes" : "no"],
      ...(meta.variants
        ? [["Variants", meta.variants.join(", ")] as [string, string]]
        : []),
    ];
    const metaGrid =
      `<div class="meta-grid">` +
      metaItems
        .map(
          ([label, value]) =>
            `<div class="meta-item"><span class="meta-label">${label}</span><code>${value}</code></div>`,
        )
        .join("") +
      `</div>`;

    const usageList = `<ul class="usage-list">${doc.usage.map((u) => `<li>${u}</li>`).join("")}</ul>`;

    const tokenRows = Object.entries(meta.tokens)
      .map(
        ([k, v]) =>
          `<div class="token-row">` +
          `<span class="token-name">${k}</span>` +
          (v.startsWith("#")
            ? `<div style="width:${t.spaceLg};height:${t.spaceLg};border-radius:${t.radiusSm};background:${v};border:${t.borderWidth} solid var(--color-border);flex-shrink:0"></div>`
            : "") +
          `<span class="token-value">${v}</span>` +
          `<button class="copy-btn" onclick="copyText('${k}', this)">Copy</button>` +
          `</div>`,
      )
      .join("");

    const overviewPanel =
      metaGrid +
      `<div class="block-title" style="margin-top:${t.spaceXl}">Usage guidelines</div>` +
      usageList +
      `<div class="block-title" style="margin-top:${t.spaceXl}">Design tokens</div>` +
      tokenRows;

    const previewPanel = `<div class="preview-area">${buildPreview(meta, t, bv)}</div>`;

    const importSnippet =
      `<div class="block-title">Import</div>` +
      `<div class="snippet-panel" style="margin-bottom:${t.spaceXl}">` +
      `<button class="copy-btn snippet-copy" onclick="copySnippet('${cn}', -1, this)">Copy</button>` +
      `<pre><code>${esc(`import { ${cn} } from './generated/components';`)}</code></pre>` +
      `</div>`;

    const exampleSnippets =
      `<div class="block-title">Examples</div>` +
      doc.snippets
        .map(
          (s, si) =>
            `<div style="margin-bottom:${t.spaceLg}">` +
            `<div class="snippet-label">${s.label}</div>` +
            `<div class="snippet-panel">` +
            `<button class="copy-btn snippet-copy" onclick="copySnippet('${cn}', ${si}, this)">Copy</button>` +
            `<pre><code>${esc(s.code)}</code></pre>` +
            `</div></div>`,
        )
        .join("");

    const a11yPanel =
      `<div class="block-title">Accessibility contract</div>` +
      a11ySection(meta) +
      `<div class="block-title" style="margin-top:${t.spaceXl}">AI metadata</div>` +
      `<div class="snippet-panel">` +
      `<button class="copy-btn snippet-copy" onclick="copySnippet('${cn}', 'meta', this)">Copy</button>` +
      `<pre><code>${esc(JSON.stringify(meta, null, 2))}</code></pre>` +
      `</div>`;

    return (
      `<div class="section" id="section-${cid}">` +
      `<div class="page-title">${cn}</div>` +
      `<div class="page-desc">${doc.description}</div>` +
      `<div class="tabs">` +
      `<button class="tab active" onclick="switchTab(this)">Overview</button>` +
      `<button class="tab" onclick="switchTab(this)">Preview</button>` +
      `<button class="tab" onclick="switchTab(this)">Props</button>` +
      `<button class="tab" onclick="switchTab(this)">Code</button>` +
      `<button class="tab" onclick="switchTab(this)">Accessibility</button>` +
      `</div>` +
      `<div class="tab-panel active">${overviewPanel}</div>` +
      `<div class="tab-panel">${previewPanel}</div>` +
      `<div class="tab-panel">${propsTable(doc.props)}</div>` +
      `<div class="tab-panel">${importSnippet + exampleSnippets}</div>` +
      `<div class="tab-panel">${a11yPanel}</div>` +
      `</div>`
    );
  }

  const componentSections = metadata.map(componentSection).join("");

  // ── Snippet data for JS ────────────────────────────────────────────────────
  const snippetData: Record<
    string,
    { import: string; snippets: string[]; meta: string }
  > = {};
  for (const m of metadata) {
    const doc = docs[m.component];
    snippetData[m.component] = {
      import: `import { ${m.component} } from './generated/components';`,
      snippets: doc ? doc.snippets.map((s) => s.code) : [],
      meta: JSON.stringify(m, null, 2),
    };
  }

  // ── CSS — all values from resolved tokens ──────────────────────────────────
  const css = [
    `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`,
    `:root {`,
    `  --color-primary:    ${t.colorPrimary};`,
    `  --color-secondary:  ${t.colorSecondary};`,
    `  --color-danger:     ${t.colorDanger};`,
    `  --color-success:    ${t.colorSuccess};`,
    `  --color-bg:         ${t.colorBackground};`,
    `  --color-text:       ${t.colorText};`,
    `  --color-surface:    ${t.colorSurface};`,
    `  --color-border:     ${t.colorBorder};`,
    `  --color-code-bg:    ${t.colorCodeBg};`,
    `  --color-on-primary: ${t.colorOnPrimary};`,
    `  --shadow-sm:        ${t.shadowSmall};`,
    `  --shadow-md:        ${t.shadowMedium};`,
    `  --font-size-xs:     ${t.fontSizeXs};`,
    `  --font-size-sm:     ${t.fontSizeSm};`,
    `  --font-size-md:     ${t.fontSizeMd};`,
    `  --font-size-ui-xs:  ${t.fontSizeUiXs};`,
    `  --font-size-ui-sm:  ${t.fontSizeUiSm};`,
    `  --font-size-ui-md:  ${t.fontSizeUiMd};`,
    `  --font-weight-md:   ${t.fontWeightMedium};`,
    `  --font-weight-bold: ${t.fontWeightSemibold};`,
    `  --radius-sm:        ${t.radiusSm};`,
    `  --radius-md:        ${t.radiusMd};`,
    `  --radius-lg:        ${t.radiusLg};`,
    `  --radius-full:      ${t.radiusFull};`,
    `  --space-xs:         ${t.spaceXs};`,
    `  --space-sm:         ${t.spaceSm};`,
    `  --space-md:         ${t.spaceMd};`,
    `  --space-lg:         ${t.spaceLg};`,
    `  --space-xl:         ${t.spaceXl};`,
    `  --space-2xl:        ${t.space2xl};`,
    `  --duration:         ${t.duration};`,
    `  --duration-fast:    ${t.durationFast};`,
    `  --easing:           ${t.easing};`,
    `  --sidebar-width:    228px;`,
    `  --topbar-height:    52px;`,
    `  --font:             '${t.fontFamily}', system-ui, sans-serif;`,
    `  --font-mono:        'SF Mono', 'Fira Code', monospace;`,
    `}`,
    `[data-theme='dark'] {`,
    `  --color-bg:       ${t.darkBackground};`,
    `  --color-text:     ${t.darkText};`,
    `  --color-surface:  ${t.darkSurface};`,
    `  --color-border:   ${t.darkBorder};`,
    `  --color-code-bg:  ${t.darkCodeBg};`,
    `}`,
    `body { font-family: var(--font); background: var(--color-bg); color: var(--color-text); display: flex; min-height: 100vh; transition: background var(--duration) var(--easing), color var(--duration) var(--easing); }`,
    `.sidebar { width: var(--sidebar-width); background: var(--color-surface); border-right: 1px solid var(--color-border); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; overflow-y: auto; }`,
    `.sidebar-logo { padding: var(--space-xl) var(--space-lg); border-bottom: 1px solid var(--color-border); }`,
    `.sidebar-logo-title { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); color: var(--color-primary); }`,
    `.sidebar-logo-sub { font-size: var(--font-size-ui-xs); color: var(--color-secondary); margin-top: var(--space-xs); }`,
    `.nav-group { padding: var(--space-lg) var(--space-sm) var(--space-xs); font-size: var(--font-size-ui-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: .1em; color: var(--color-secondary); }`,
    `.nav-item { display: block; width: 100%; padding: var(--space-sm) var(--space-md); margin: 1px 0; border-radius: var(--radius-md); font-size: var(--font-size-ui-md); font-weight: var(--font-weight-md); color: var(--color-text); text-align: left; border: none; background: transparent; cursor: pointer; font-family: var(--font); transition: background var(--duration-fast) var(--easing), color var(--duration-fast) var(--easing); }`,
    `.nav-item:hover { background: var(--color-border); }`,
    `.nav-item.active { background: var(--color-primary); color: var(--color-on-primary); }`,
    `.topbar { position: fixed; top: 0; left: var(--sidebar-width); right: 0; height: var(--topbar-height); background: var(--color-bg); border-bottom: 1px solid var(--color-border); display: flex; align-items: center; justify-content: flex-end; padding: 0 var(--space-2xl); gap: var(--space-sm); z-index: 10; }`,
    `.dark-btn { background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); padding: var(--space-xs) var(--space-lg); border-radius: var(--radius-full); font-size: var(--font-size-ui-sm); font-family: var(--font); font-weight: var(--font-weight-md); cursor: pointer; transition: background var(--duration-fast) var(--easing); }`,
    `.dark-btn:hover { background: var(--color-border); }`,
    `.main { margin-left: var(--sidebar-width); flex: 1; padding: calc(var(--topbar-height) + var(--space-2xl)) var(--space-2xl) 64px; max-width: 900px; }`,
    `.section { display: none; } .section.active { display: block; }`,
    `.page-title { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); margin-bottom: var(--space-xs); }`,
    `.page-desc { font-size: var(--font-size-sm); color: var(--color-secondary); margin-bottom: var(--space-2xl); line-height: 1.6; max-width: 600px; }`,
    `.block-title { font-size: var(--font-size-ui-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: .07em; color: var(--color-secondary); margin-bottom: var(--space-md); padding-bottom: var(--space-sm); border-bottom: 1px solid var(--color-border); }`,
    `.tabs { display: flex; gap: 2px; border-bottom: 2px solid var(--color-border); margin-bottom: var(--space-xl); }`,
    `.tab { padding: var(--space-sm) var(--space-lg); font-size: var(--font-size-ui-md); font-weight: var(--font-weight-md); font-family: var(--font); background: none; border: none; color: var(--color-secondary); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color var(--duration-fast) var(--easing), border-color var(--duration-fast) var(--easing); }`,
    `.tab:hover { color: var(--color-text); }`,
    `.tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }`,
    `.tab-panel { display: none; } .tab-panel.active { display: block; }`,
    `.meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--space-md); margin-bottom: var(--space-sm); }`,
    `.meta-item { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-md) var(--space-lg); }`,
    `.meta-label { display: block; font-size: var(--font-size-ui-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: .07em; color: var(--color-secondary); margin-bottom: var(--space-xs); }`,
    `.meta-item code { font-family: var(--font-mono); font-size: var(--font-size-ui-sm); color: var(--color-primary); }`,
    `.usage-list { padding-left: var(--space-xl); display: flex; flex-direction: column; gap: var(--space-sm); }`,
    `.usage-list li { font-size: var(--font-size-sm); line-height: 1.6; color: var(--color-text); }`,
    `.usage-list code { font-family: var(--font-mono); font-size: var(--font-size-ui-sm); background: var(--color-code-bg); padding: 1px var(--space-xs); border-radius: var(--radius-sm); }`,
    `.token-row { display: flex; align-items: center; gap: var(--space-lg); padding: var(--space-sm) 0; border-bottom: 1px solid var(--color-border); }`,
    `.token-name { font-family: var(--font-mono); font-size: var(--font-size-ui-sm); color: var(--color-primary); width: 120px; flex-shrink: 0; }`,
    `.token-value { font-family: var(--font-mono); font-size: var(--font-size-ui-sm); color: var(--color-secondary); margin-left: auto; }`,
    `.swatches { display: flex; flex-wrap: wrap; gap: var(--space-lg); }`,
    `.swatch-wrap { display: flex; flex-direction: column; align-items: center; gap: var(--space-xs); cursor: pointer; }`,
    `.swatch { width: var(--space-2xl); height: var(--space-2xl); border-radius: var(--radius-lg); border: 1px solid var(--color-border); transition: transform var(--duration-fast) var(--easing); }`,
    `.swatch:hover { transform: scale(1.1); }`,
    `.swatch-label { font-size: var(--font-size-ui-sm); font-weight: var(--font-weight-bold); }`,
    `.swatch-value { font-size: var(--font-size-ui-xs); color: var(--color-secondary); font-family: var(--font-mono); }`,
    `.props-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-ui-md); }`,
    `.props-table th { text-align: left; padding: var(--space-sm) var(--space-md); font-size: var(--font-size-ui-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: .06em; color: var(--color-secondary); border-bottom: 2px solid var(--color-border); }`,
    `.props-table td { padding: var(--space-sm) var(--space-md); border-bottom: 1px solid var(--color-border); vertical-align: top; line-height: 1.5; }`,
    `.props-table code { font-family: var(--font-mono); font-size: var(--font-size-ui-sm); background: var(--color-code-bg); padding: 1px var(--space-xs); border-radius: var(--radius-sm); }`,
    `.props-table code.type { color: var(--color-primary); }`,
    `.snippet-panel { position: relative; background: var(--color-code-bg); border-radius: var(--radius-lg); border: 1px solid var(--color-border); padding: var(--space-lg); margin-top: var(--space-sm); }`,
    `.snippet-panel pre { overflow-x: auto; }`,
    `.snippet-panel code { font-family: var(--font-mono); font-size: var(--font-size-ui-sm); line-height: 1.7; white-space: pre; }`,
    `.snippet-label { font-size: var(--font-size-ui-sm); font-weight: var(--font-weight-bold); color: var(--color-secondary); margin-bottom: var(--space-xs); }`,
    `.snippet-copy { position: absolute; top: var(--space-sm); right: var(--space-sm); }`,
    `.preview-area { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-2xl); display: flex; flex-wrap: wrap; gap: var(--space-xl); align-items: flex-start; }`,
    `.preview-item { display: flex; flex-direction: column; gap: var(--space-sm); align-items: flex-start; }`,
    `.preview-label { font-size: var(--font-size-ui-xs); font-weight: var(--font-weight-bold); color: var(--color-secondary); text-transform: uppercase; letter-spacing: .06em; }`,
    `.a11y-list { padding-left: var(--space-xl); display: flex; flex-direction: column; gap: var(--space-sm); }`,
    `.a11y-list li { font-size: var(--font-size-sm); line-height: 1.6; }`,
    `.copy-btn { font-size: var(--font-size-ui-xs); font-family: var(--font); font-weight: var(--font-weight-md); padding: var(--space-xs) var(--space-md); border-radius: var(--radius-sm); border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-secondary); cursor: pointer; transition: all var(--duration-fast) var(--easing); white-space: nowrap; }`,
    `.copy-btn:hover { background: var(--color-primary); color: var(--color-on-primary); border-color: var(--color-primary); }`,
    `.copy-btn.copied { background: var(--color-success); color: var(--color-on-primary); border-color: var(--color-success); }`,
    `.toast { position: fixed; bottom: var(--space-xl); right: var(--space-xl); background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); box-shadow: var(--shadow-md); padding: var(--space-sm) var(--space-lg); border-radius: var(--radius-lg); font-size: var(--font-size-ui-md); font-weight: var(--font-weight-md); opacity: 0; transform: translateY(var(--space-xs)); transition: opacity var(--duration) var(--easing), transform var(--duration) var(--easing); pointer-events: none; z-index: 100; }`,
    `.toast.show { opacity: 1; transform: none; }`,
  ].join("\n");

  // ── Assemble HTML ──────────────────────────────────────────────────────────
  const html = [
    `<!DOCTYPE html>`,
    `<html lang="en">`,
    `<head>`,
    `  <meta charset="UTF-8" />`,
    `  <meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
    `  <title>Design System</title>`,
    `  <link rel="preconnect" href="https://fonts.googleapis.com">`,
    `  <link href="${googleFont}" rel="stylesheet">`,
    `  <style>${css}</style>`,
    `</head>`,
    `<body>`,
    `<nav class="sidebar">`,
    `  <div class="sidebar-logo">`,
    `    <div class="sidebar-logo-title">Design System</div>`,
    `    <div class="sidebar-logo-sub">Generated by dsforge</div>`,
    `  </div>`,
    `  <div class="nav-group">Foundations</div>`,
    `  <button class="nav-item active" onclick="show('colors', this)">Colors</button>`,
    `  <button class="nav-item" onclick="show('typography', this)">Typography</button>`,
    `  <button class="nav-item" onclick="show('spacing', this)">Spacing</button>`,
    `  <button class="nav-item" onclick="show('radius', this)">Border Radius</button>`,
    `  <div class="nav-group">Components</div>`,
    `  ${navItems}`,
    `</nav>`,
    `<div class="topbar">`,
    `  <button class="dark-btn" onclick="toggleDark(this)">Dark</button>`,
    `</div>`,
    `<main class="main">`,
    `  <div class="section active" id="section-colors">`,
    `    <div class="page-title">Colors</div>`,
    `    <div class="page-desc">Core color palette. Click any swatch to copy its hex value.</div>`,
    `    <div class="block-title">Color tokens</div>`,
    `    <div class="swatches">${colorSwatches}</div>`,
    `  </div>`,
    `  <div class="section" id="section-typography">`,
    `    <div class="page-title">Typography</div>`,
    `    <div class="page-desc">Font family: <strong>${t.fontFamily}</strong> &middot; ${config.typography.scale.length} sizes &middot; ${config.typography.fontWeights.length} weights</div>`,
    `    <div class="block-title">Type scale</div>`,
    `    ${typoRows}`,
    `  </div>`,
    `  <div class="section" id="section-spacing">`,
    `    <div class="page-title">Spacing</div>`,
    `    <div class="page-desc">Base unit: <strong>${config.spacing.baseUnit}px</strong>. All spacing values are multiples of the base unit.</div>`,
    `    <div class="block-title">Spacing scale</div>`,
    `    ${spacingRows}`,
    `  </div>`,
    `  <div class="section" id="section-radius">`,
    `    <div class="page-title">Border Radius</div>`,
    `    <div class="page-desc">Available border radius tokens from your config.</div>`,
    `    <div class="block-title">Radius scale</div>`,
    `    ${radiusRows}`,
    `  </div>`,
    componentSections,
    `</main>`,
    `<div class="toast" id="toast">Copied!</div>`,
    `<script>`,
    `  function show(id, btn) {`,
    `    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));`,
    `    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));`,
    `    document.getElementById('section-' + id).classList.add('active');`,
    `    if (btn) btn.classList.add('active');`,
    `  }`,
    `  function toggleDark(btn) {`,
    `    const dark = document.documentElement.getAttribute('data-theme') === 'dark';`,
    `    document.documentElement.setAttribute('data-theme', dark ? '' : 'dark');`,
    `    btn.textContent = dark ? 'Dark' : 'Light';`,
    `  }`,
    `  function switchTab(btn) {`,
    `    const wrapper = btn.closest('.section');`,
    `    wrapper.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));`,
    `    wrapper.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));`,
    `    btn.classList.add('active');`,
    `    const idx = Array.from(btn.parentElement.querySelectorAll('.tab')).indexOf(btn);`,
    `    const panels = wrapper.querySelectorAll('.tab-panel');`,
    `    if (panels[idx]) panels[idx].classList.add('active');`,
    `  }`,
    `  const SNIPPETS = ${safeJSON(snippetData)};`,
    `  function copySnippet(component, idx, btn) {`,
    `    const entry = SNIPPETS[component];`,
    `    if (!entry) return;`,
    `    const text = idx === -1 ? entry.import : idx === 'meta' ? entry.meta : entry.snippets[idx];`,
    `    if (text != null) copyText(text, btn);`,
    `  }`,
    `  function copyText(text, btn) {`,
    `    navigator.clipboard.writeText(text).then(() => {`,
    `      if (btn) {`,
    `        const orig = btn.textContent;`,
    `        btn.textContent = 'Copied!';`,
    `        btn.classList.add('copied');`,
    `        setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);`,
    `      }`,
    `      const t = document.getElementById('toast');`,
    `      t.classList.add('show');`,
    `      setTimeout(() => t.classList.remove('show'), 2000);`,
    `    });`,
    `  }`,
    `</script>`,
    `</body>`,
    `</html>`,
  ].join("\n");

  const outPath = path.join(showcaseDir, "index.html");
  await fs.writeFile(outPath, html);
  return outPath;
}

// ─── Preview builder ──────────────────────────────────────────────────────────

function buildPreview(
  meta: ComponentMetadata,
  t: ReturnType<typeof resolveTokens>,
  bv: string[],
): string {
  if (meta.component === "Button") {
    return bv
      .map((v) => {
        const bg =
          v === "primary"
            ? t.colorPrimary
            : v === "danger"
              ? t.colorDanger
              : t.colorSecondary;
        return (
          `<div class="preview-item">` +
          `<div class="preview-label">${v}</div>` +
          `<button style="background:${bg};color:${t.colorOnPrimary};border:${t.borderWidth} solid transparent;` +
          `padding:${t.spaceSm} ${t.spaceLg};border-radius:${t.radiusMd};` +
          `font-size:${t.fontSizeMd};font-weight:${t.fontWeightMedium};cursor:pointer;font-family:${t.fontFamily},sans-serif;` +
          `line-height:${t.lineHeightTight};transition:opacity ${t.duration} ${t.easing}">` +
          `${v.charAt(0).toUpperCase() + v.slice(1)}</button>` +
          `</div>`
        );
      })
      .join("");
  }

  if (meta.component === "Input") {
    return (
      `<div class="preview-item" style="min-width:260px">` +
      `<div class="preview-label">Default</div>` +
      `<div style="display:flex;flex-direction:column;gap:${t.spaceXs};width:100%">` +
      `<label style="font-size:${t.fontSizeMd};font-weight:${t.fontWeightMedium};font-family:${t.fontFamily},sans-serif;color:${t.colorText}">Email address</label>` +
      `<input placeholder="you@example.com" style="padding:${t.spaceSm} ${t.spaceMd};border:${t.borderWidth} solid ${t.colorSecondary};` +
      `border-radius:${t.radiusMd};font-size:${t.fontSizeMd};font-family:${t.fontFamily},sans-serif;` +
      `width:100%;outline:none;background:var(--color-bg);color:var(--color-text)" />` +
      `</div></div>` +
      `<div class="preview-item" style="min-width:260px">` +
      `<div class="preview-label">Error state</div>` +
      `<div style="display:flex;flex-direction:column;gap:${t.spaceXs};width:100%">` +
      `<label style="font-size:${t.fontSizeMd};font-weight:${t.fontWeightMedium};font-family:${t.fontFamily},sans-serif;color:${t.colorText}">Password</label>` +
      `<input type="password" placeholder="••••••••" style="padding:${t.spaceSm} ${t.spaceMd};border:${t.borderWidth} solid ${t.colorDanger};` +
      `border-radius:${t.radiusMd};font-size:${t.fontSizeMd};font-family:${t.fontFamily},sans-serif;` +
      `width:100%;outline:none;background:var(--color-bg);color:var(--color-text)" />` +
      `<span style="font-size:${t.fontSizeSm};color:${t.colorDanger};font-family:${t.fontFamily},sans-serif">Password is required</span>` +
      `</div></div>`
    );
  }

  if (meta.component === "Card") {
    return ["none", "small", "medium"]
      .map((s) => {
        const shadow =
          s === "none"
            ? t.shadowNone
            : s === "small"
              ? t.shadowSmall
              : t.shadowMedium;
        return (
          `<div class="preview-item">` +
          `<div class="preview-label">shadow="${s}"</div>` +
          `<div style="background:var(--color-bg);border-radius:${t.radiusLg};padding:${t.spaceXl};` +
          `min-width:200px;box-shadow:${shadow};border:${t.borderWidth} solid var(--color-border)">` +
          `<div style="font-size:${t.fontSizeLg};font-weight:${t.fontWeightSemibold};margin-bottom:${t.spaceXs};font-family:${t.fontFamily},sans-serif">Card title</div>` +
          `<div style="font-size:${t.fontSizeSm};color:${t.colorSecondary};font-family:${t.fontFamily},sans-serif;line-height:${t.lineHeightNormal}">Supporting content goes here.</div>` +
          `</div></div>`
        );
      })
      .join("");
  }

  if (meta.component === "Typography") {
    const variants = [
      {
        label: "h1",
        size: t.fontSize2xl,
        weight: t.fontWeightSemibold,
        lh: t.lineHeightTight,
      },
      {
        label: "h2",
        size: t.fontSizeXl,
        weight: t.fontWeightSemibold,
        lh: t.lineHeightTight,
      },
      {
        label: "h3",
        size: t.fontSizeLg,
        weight: t.fontWeightMedium,
        lh: t.lineHeightSnug,
      },
      {
        label: "body",
        size: t.fontSizeMd,
        weight: t.fontWeightRegular,
        lh: t.lineHeightNormal,
      },
      {
        label: "small",
        size: t.fontSizeSm,
        weight: t.fontWeightRegular,
        lh: t.lineHeightLoose,
      },
      {
        label: "caption",
        size: t.fontSizeXs,
        weight: t.fontWeightRegular,
        lh: t.lineHeightLoose,
      },
    ];
    return (
      `<div style="display:flex;flex-direction:column;gap:${t.spaceLg};width:100%">` +
      variants
        .map(
          (v) =>
            `<div class="preview-item">` +
            `<div class="preview-label">${v.label}</div>` +
            `<span style="font-size:${v.size};font-weight:${v.weight};line-height:${v.lh};font-family:${t.fontFamily},sans-serif">The quick brown fox jumps</span>` +
            `</div>`,
        )
        .join("") +
      `</div>`
    );
  }

  if (meta.component === "Stack") {
    return ["column", "row"]
      .map(
        (dir) =>
          `<div class="preview-item">` +
          `<div class="preview-label">direction="${dir}"</div>` +
          `<div style="display:flex;flex-direction:${dir};gap:${t.spaceSm}">` +
          [1, 2, 3]
            .map(
              (i) =>
                `<div style="background:${t.colorPrimary};opacity:${(1 - i * 0.15).toFixed(2)};` +
                `border-radius:${t.radiusSm};padding:${t.spaceSm} ${t.spaceLg};` +
                `color:${t.colorOnPrimary};font-size:${t.fontSizeSm};font-family:${t.fontFamily},sans-serif">Item ${i}</div>`,
            )
            .join("") +
          `</div></div>`,
      )
      .join("");
  }

  return `<div style="color:var(--color-secondary);font-size:${t.fontSizeSm}">No preview available</div>`;
}

// ─── Vite showcase ────────────────────────────────────────────────────────────

async function generateVite(
  config: DesignSystemConfig,
  rules: GovernanceRules,
  metadata: ComponentMetadata[],
  showcaseDir: string,
): Promise<string> {
  const t = resolveTokens(config);
  const docs = buildDocs(config, rules);
  const bv = rules.button?.allowedVariants ?? [
    "primary",
    "secondary",
    "danger",
  ];
  const wghts = config.typography.fontWeights.join(";");
  const googleFont = `https://fonts.googleapis.com/css2?family=${t.fontFamily.replace(/ /g, "+")}:wght@${wghts}&display=swap`;

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

  await fs.writeFile(
    path.join(showcaseDir, "vite.config.js"),
    `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });`,
  );

  await fs.writeFile(
    path.join(showcaseDir, "index.html"),
    [
      `<!DOCTYPE html>`,
      `<html lang="en">`,
      `  <head>`,
      `    <meta charset="UTF-8" />`,
      `    <meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
      `    <title>Design System</title>`,
      `    <link rel="preconnect" href="https://fonts.googleapis.com">`,
      `    <link href="${googleFont}" rel="stylesheet">`,
      `  </head>`,
      `  <body>`,
      `    <div id="root"></div>`,
      `    <script type="module" src="/src/main.jsx"></script>`,
      `  </body>`,
      `</html>`,
    ].join("\n"),
  );

  await fs.ensureDir(path.join(showcaseDir, "src"));

  await fs.writeFile(
    path.join(showcaseDir, "src", "main.jsx"),
    `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport { App } from './App';\nimport './styles.css';\ncreateRoot(document.getElementById('root')).render(<App />);`,
  );

  // CSS — all custom properties from resolved tokens
  const cssVars = [
    `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}`,
    `:root{`,
    `  --color-primary:    ${t.colorPrimary};`,
    `  --color-secondary:  ${t.colorSecondary};`,
    `  --color-danger:     ${t.colorDanger};`,
    `  --color-success:    ${t.colorSuccess};`,
    `  --color-bg:         ${t.colorBackground};`,
    `  --color-text:       ${t.colorText};`,
    `  --color-surface:    ${t.colorSurface};`,
    `  --color-border:     ${t.colorBorder};`,
    `  --color-code-bg:    ${t.colorCodeBg};`,
    `  --color-on-primary: ${t.colorOnPrimary};`,
    `  --shadow-sm:        ${t.shadowSmall};`,
    `  --shadow-md:        ${t.shadowMedium};`,
    `  --font-size-xs:     ${t.fontSizeXs};`,
    `  --font-size-sm:     ${t.fontSizeSm};`,
    `  --font-size-md:     ${t.fontSizeMd};`,
    `  --font-size-ui-xs:  ${t.fontSizeUiXs};`,
    `  --font-size-ui-sm:  ${t.fontSizeUiSm};`,
    `  --font-size-ui-md:  ${t.fontSizeUiMd};`,
    `  --font-weight-md:   ${t.fontWeightMedium};`,
    `  --font-weight-bold: ${t.fontWeightSemibold};`,
    `  --radius-sm:        ${t.radiusSm};`,
    `  --radius-md:        ${t.radiusMd};`,
    `  --radius-lg:        ${t.radiusLg};`,
    `  --radius-full:      ${t.radiusFull};`,
    `  --space-xs:         ${t.spaceXs};`,
    `  --space-sm:         ${t.spaceSm};`,
    `  --space-md:         ${t.spaceMd};`,
    `  --space-lg:         ${t.spaceLg};`,
    `  --space-xl:         ${t.spaceXl};`,
    `  --space-2xl:        ${t.space2xl};`,
    `  --duration:         ${t.duration};`,
    `  --duration-fast:    ${t.durationFast};`,
    `  --easing:           ${t.easing};`,
    `  --sidebar-width:    228px;`,
    `  --topbar-height:    52px;`,
    `  --font:             '${t.fontFamily}',system-ui,sans-serif;`,
    `  --font-mono:        'SF Mono','Fira Code',monospace;`,
    `}`,
    `.dark{`,
    `  --color-bg:      ${t.darkBackground};`,
    `  --color-text:    ${t.darkText};`,
    `  --color-surface: ${t.darkSurface};`,
    `  --color-border:  ${t.darkBorder};`,
    `  --color-code-bg: ${t.darkCodeBg};`,
    `}`,
    `body{font-family:var(--font);background:var(--color-bg);color:var(--color-text);}`,
  ].join("\n");

  await fs.writeFile(path.join(showcaseDir, "src", "styles.css"), cssVars);
  await fs.writeFile(
    path.join(showcaseDir, "src", "App.jsx"),
    buildViteApp(t, docs, metadata, bv),
  );

  return showcaseDir;
}

// ─── Vite App.jsx builder ─────────────────────────────────────────────────────

function buildViteApp(
  t: ReturnType<typeof resolveTokens>,
  docs: Record<string, ComponentDoc>,
  metadata: ComponentMetadata[],
  bv: string[],
): string {
  const metaJSON = JSON.stringify(metadata);
  const docsJSON = JSON.stringify(docs);
  const bvJSON = JSON.stringify(bv);
  const tokJSON = JSON.stringify({
    colorPrimary: t.colorPrimary,
    colorSecondary: t.colorSecondary,
    colorDanger: t.colorDanger,
    colorSuccess: t.colorSuccess,
    colorBackground: t.colorBackground,
    colorText: t.colorText,
    colorOnPrimary: t.colorOnPrimary,
    colorBorder: t.colorBorder,
    shadowNone: t.shadowNone,
    shadowSmall: t.shadowSmall,
    shadowMedium: t.shadowMedium,
    focusRing: t.focusRing,
    fontFamily: t.fontFamily,
    fontSizeXs: t.fontSizeXs,
    fontSizeSm: t.fontSizeSm,
    fontSizeMd: t.fontSizeMd,
    fontSizeLg: t.fontSizeLg,
    fontSizeXl: t.fontSizeXl,
    fontSize2xl: t.fontSize2xl,
    fontSizeUiXs: t.fontSizeUiXs,
    fontSizeUiSm: t.fontSizeUiSm,
    fontSizeUiMd: t.fontSizeUiMd,
    fontWeightRegular: t.fontWeightRegular,
    fontWeightMedium: t.fontWeightMedium,
    fontWeightSemibold: t.fontWeightSemibold,
    lineHeightTight: t.lineHeightTight,
    lineHeightSnug: t.lineHeightSnug,
    lineHeightNormal: t.lineHeightNormal,
    lineHeightLoose: t.lineHeightLoose,
    spaceUnit: t.spaceUnit,
    spaceXs: t.spaceXs,
    spaceSm: t.spaceSm,
    spaceMd: t.spaceMd,
    spaceLg: t.spaceLg,
    spaceXl: t.spaceXl,
    space2xl: t.space2xl,
    borderWidth: t.borderWidth,
    radiusSm: t.radiusSm,
    radiusMd: t.radiusMd,
    radiusLg: t.radiusLg,
    radiusXl: t.radiusXl,
    radiusFull: t.radiusFull,
    duration: t.duration,
    durationFast: t.durationFast,
    easing: t.easing,
    transition: t.transition,
  });

  return `import { useState, useCallback } from 'react';

const T        = ${tokJSON};
const metadata = ${metaJSON};
const docs     = ${docsJSON};
const bv       = ${bvJSON};

// ── Primitives ────────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button onClick={copy} style={{
      fontSize: T.fontSizeUiXs, padding: T.spaceXs + ' ' + T.spaceMd,
      borderRadius: T.radiusSm, border: T.borderWidth + ' solid var(--color-border)',
      background: copied ? T.colorSuccess : 'var(--color-surface)',
      color: copied ? T.colorOnPrimary : 'var(--color-secondary)',
      cursor: 'pointer', fontFamily: 'inherit', fontWeight: T.fontWeightMedium,
      transition: T.transition, whiteSpace: 'nowrap',
    }}>
      {copied ? 'Copied!' : label}
    </button>
  );
}

function BlockTitle({ children, mt = 0 }) {
  return (
    <div style={{
      fontSize: T.fontSizeUiXs, fontWeight: T.fontWeightSemibold,
      textTransform: 'uppercase', letterSpacing: '.07em',
      color: 'var(--color-secondary)', marginBottom: T.spaceMd,
      paddingBottom: T.spaceSm, borderBottom: T.borderWidth + ' solid var(--color-border)',
      marginTop: mt,
    }}>
      {children}
    </div>
  );
}

function TokenRow({ name, value, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap: T.spaceLg, padding: T.spaceSm + ' 0', borderBottom: T.borderWidth + ' solid var(--color-border)' }}>
      <span style={{ fontFamily:'var(--font-mono)', fontSize: T.fontSizeUiSm, color:'var(--color-primary)', width:120, flexShrink:0 }}>{name}</span>
      {children}
      {value && <span style={{ fontFamily:'var(--font-mono)', fontSize: T.fontSizeUiSm, color:'var(--color-secondary)', marginLeft:'auto' }}>{value}</span>}
      <CopyButton text={value || name} />
    </div>
  );
}

function CodeBlock({ code }) {
  return (
    <div style={{ position:'relative', background:'var(--color-code-bg)', borderRadius: T.radiusLg, border: T.borderWidth + ' solid var(--color-border)', padding: T.spaceLg, marginTop: T.spaceSm }}>
      <div style={{ position:'absolute', top: T.spaceSm, right: T.spaceSm }}><CopyButton text={code} /></div>
      <pre style={{ overflow:'auto' }}><code style={{ fontFamily:'var(--font-mono)', fontSize: T.fontSizeUiSm, lineHeight: T.lineHeightLoose, whiteSpace:'pre' }}>{code}</code></pre>
    </div>
  );
}

function Tabs({ tabs, children }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div style={{ display:'flex', gap:2, borderBottom: '2px solid var(--color-border)', marginBottom: T.spaceXl }}>
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActive(i)} style={{
            padding: T.spaceSm + ' ' + T.spaceLg,
            fontSize: T.fontSizeUiMd, fontWeight: T.fontWeightMedium, fontFamily:'inherit',
            background:'none', border:'none', cursor:'pointer',
            color: active === i ? 'var(--color-primary)' : 'var(--color-secondary)',
            borderBottom: active === i ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: -2, transition: 'color ' + T.durationFast + ' ' + T.easing + ', border-color ' + T.durationFast + ' ' + T.easing,
          }}>{tab}</button>
        ))}
      </div>
      {children[active]}
    </div>
  );
}

function MetaGrid({ meta }) {
  const items = [
    ['Role', meta.role], ['Hierarchy', meta.hierarchyLevel],
    ['Interaction', meta.interactionModel], ['Layout', meta.layoutImpact],
    ['Destructive', meta.destructive ? 'yes' : 'no'],
    ...(meta.variants ? [['Variants', meta.variants.join(', ')]] : []),
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap: T.spaceMd, marginBottom: T.spaceSm }}>
      {items.map(([label, val]) => (
        <div key={label} style={{ background:'var(--color-surface)', border: T.borderWidth + ' solid var(--color-border)', borderRadius: T.radiusLg, padding: T.spaceMd + ' ' + T.spaceLg }}>
          <div style={{ fontSize: T.fontSizeUiXs, fontWeight: T.fontWeightSemibold, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--color-secondary)', marginBottom: T.spaceXs }}>{label}</div>
          <code style={{ fontFamily:'var(--font-mono)', fontSize: T.fontSizeUiSm, color:'var(--color-primary)' }}>{val}</code>
        </div>
      ))}
    </div>
  );
}

function PropsTable({ props }) {
  const thStyle = { textAlign:'left', padding: T.spaceSm + ' ' + T.spaceMd, fontSize: T.fontSizeUiXs, fontWeight: T.fontWeightSemibold, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--color-secondary)', borderBottom: '2px solid var(--color-border)' };
  const tdStyle = { padding: T.spaceSm + ' ' + T.spaceMd, borderBottom: T.borderWidth + ' solid var(--color-border)', verticalAlign:'top', lineHeight: T.lineHeightLoose };
  const codeStyle = { fontFamily:'var(--font-mono)', fontSize: T.fontSizeUiSm, background:'var(--color-code-bg)', padding: '1px ' + T.spaceXs, borderRadius: T.radiusSm };
  return (
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize: T.fontSizeUiMd }}>
      <thead><tr>{['Prop','Type','Default','Description'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
      <tbody>
        {props.map(p => (
          <tr key={p.name}>
            <td style={tdStyle}><code style={codeStyle}>{p.name}</code></td>
            <td style={tdStyle}><code style={{ ...codeStyle, color:'var(--color-primary)' }}>{p.type}</code></td>
            <td style={tdStyle}><code style={codeStyle}>{p.default}</code></td>
            <td style={{ ...tdStyle, color:'var(--color-text)' }}>{p.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Component previews ────────────────────────────────────────────────────────

function ComponentPreview({ meta }) {
  if (meta.component === 'Button') return (
    <div style={{ display:'flex', flexWrap:'wrap', gap: T.spaceXl }}>
      {bv.map(v => {
        const bg = v === 'primary' ? T.colorPrimary : v === 'danger' ? T.colorDanger : T.colorSecondary;
        return (
          <div key={v} style={{ display:'flex', flexDirection:'column', gap: T.spaceSm }}>
            <div style={{ fontSize: T.fontSizeUiXs, fontWeight: T.fontWeightSemibold, color:'var(--color-secondary)', textTransform:'uppercase' }}>{v}</div>
            <button style={{ background: bg, color: T.colorOnPrimary, border: T.borderWidth + ' solid transparent', padding: T.spaceSm + ' ' + T.spaceLg, borderRadius: T.radiusMd, fontSize: T.fontSizeMd, fontWeight: T.fontWeightMedium, cursor:'pointer', fontFamily: T.fontFamily + ',sans-serif', lineHeight: T.lineHeightTight }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          </div>
        );
      })}
    </div>
  );

  if (meta.component === 'Input') return (
    <div style={{ display:'flex', flexWrap:'wrap', gap: T.space2xl }}>
      {[
        { lbl:'Default', label:'Email',    type:'email',    ph:'you@example.com', hint:'We will never share your email.', err: null },
        { lbl:'Error',   label:'Password', type:'password', ph:'••••••••',        hint: null, err:'Password is required' },
      ].map(f => (
        <div key={f.lbl} style={{ minWidth: 260 }}>
          <div style={{ fontSize: T.fontSizeUiXs, fontWeight: T.fontWeightSemibold, color:'var(--color-secondary)', textTransform:'uppercase', marginBottom: T.spaceSm }}>{f.lbl}</div>
          <div style={{ display:'flex', flexDirection:'column', gap: T.spaceXs }}>
            <label style={{ fontSize: T.fontSizeMd, fontWeight: T.fontWeightMedium, color: T.colorText }}>{f.label}</label>
            <input type={f.type} placeholder={f.ph} readOnly style={{ padding: T.spaceSm + ' ' + T.spaceMd, border: T.borderWidth + ' solid ' + (f.err ? T.colorDanger : T.colorSecondary), borderRadius: T.radiusMd, fontSize: T.fontSizeMd, fontFamily: T.fontFamily + ',sans-serif', outline:'none', background:'var(--color-bg)', color:'var(--color-text)', width:'100%' }} />
            {f.hint && <span style={{ fontSize: T.fontSizeSm, color: T.colorSecondary }}>{f.hint}</span>}
            {f.err  && <span style={{ fontSize: T.fontSizeSm, color: T.colorDanger  }}>{f.err}</span>}
          </div>
        </div>
      ))}
    </div>
  );

  if (meta.component === 'Card') return (
    <div style={{ display:'flex', flexWrap:'wrap', gap: T.spaceXl }}>
      {[['none', T.shadowNone], ['small', T.shadowSmall], ['medium', T.shadowMedium]].map(([lbl, shadow]) => (
        <div key={lbl}>
          <div style={{ fontSize: T.fontSizeUiXs, fontWeight: T.fontWeightSemibold, color:'var(--color-secondary)', textTransform:'uppercase', marginBottom: T.spaceSm }}>shadow="{lbl}"</div>
          <div style={{ background:'var(--color-bg)', borderRadius: T.radiusLg, padding: T.spaceXl, minWidth: 200, boxShadow: shadow, border: T.borderWidth + ' solid var(--color-border)' }}>
            <div style={{ fontSize: T.fontSizeLg, fontWeight: T.fontWeightSemibold, marginBottom: T.spaceXs, fontFamily: T.fontFamily + ',sans-serif' }}>Card title</div>
            <div style={{ fontSize: T.fontSizeSm, color: T.colorSecondary, fontFamily: T.fontFamily + ',sans-serif', lineHeight: T.lineHeightNormal }}>Supporting content goes here.</div>
          </div>
        </div>
      ))}
    </div>
  );

  if (meta.component === 'Typography') return (
    <div style={{ display:'flex', flexDirection:'column', gap: T.spaceLg }}>
      {[
        { lbl:'h1',      size: T.fontSize2xl, weight: T.fontWeightSemibold, lh: T.lineHeightTight  },
        { lbl:'h2',      size: T.fontSizeXl,  weight: T.fontWeightSemibold, lh: T.lineHeightTight  },
        { lbl:'h3',      size: T.fontSizeLg,  weight: T.fontWeightMedium,   lh: T.lineHeightSnug   },
        { lbl:'body',    size: T.fontSizeMd,  weight: T.fontWeightRegular,  lh: T.lineHeightNormal },
        { lbl:'small',   size: T.fontSizeSm,  weight: T.fontWeightRegular,  lh: T.lineHeightLoose  },
        { lbl:'caption', size: T.fontSizeXs,  weight: T.fontWeightRegular,  lh: T.lineHeightLoose  },
      ].map(v => (
        <div key={v.lbl}>
          <div style={{ fontSize: T.fontSizeUiXs, fontWeight: T.fontWeightSemibold, color:'var(--color-secondary)', textTransform:'uppercase', marginBottom: T.spaceXs }}>{v.lbl}</div>
          <span style={{ fontSize: v.size, fontWeight: v.weight, lineHeight: v.lh, fontFamily: T.fontFamily + ',sans-serif' }}>The quick brown fox jumps</span>
        </div>
      ))}
    </div>
  );

  if (meta.component === 'Stack') return (
    <div style={{ display:'flex', flexWrap:'wrap', gap: T.space2xl }}>
      {['column','row'].map(dir => (
        <div key={dir}>
          <div style={{ fontSize: T.fontSizeUiXs, fontWeight: T.fontWeightSemibold, color:'var(--color-secondary)', textTransform:'uppercase', marginBottom: T.spaceSm }}>direction="{dir}"</div>
          <div style={{ display:'flex', flexDirection: dir, gap: T.spaceSm }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: T.colorPrimary, opacity: 1 - i * 0.15, borderRadius: T.radiusSm, padding: T.spaceSm + ' ' + T.spaceLg, color: T.colorOnPrimary, fontSize: T.fontSizeSm, fontFamily: T.fontFamily + ',sans-serif' }}>Item {i}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return <div style={{ color:'var(--color-secondary)', fontSize: T.fontSizeSm }}>No preview available</div>;
}

// ── Section pages ─────────────────────────────────────────────────────────────

function ComponentPage({ meta }) {
  const doc = docs[meta.component];
  if (!doc) return null;
  const cn = meta.component;
  return (
    <div>
      <h1 style={{ fontSize: T.fontSize2xl, fontWeight: T.fontWeightSemibold, marginBottom: T.spaceXs }}>{cn}</h1>
      <p style={{ fontSize: T.fontSizeSm, color:'var(--color-secondary)', marginBottom: T.space2xl, lineHeight: T.lineHeightNormal, maxWidth: 600 }}>{doc.description}</p>
      <Tabs tabs={['Overview','Preview','Props','Code','Accessibility']}>
        <div>
          <MetaGrid meta={meta} />
          <BlockTitle mt={T.spaceXl}>Usage guidelines</BlockTitle>
          <ul style={{ paddingLeft: T.spaceXl, display:'flex', flexDirection:'column', gap: T.spaceSm }}>
            {doc.usage.map((u, i) => <li key={i} style={{ fontSize: T.fontSizeSm, lineHeight: T.lineHeightNormal }}>{u}</li>)}
          </ul>
          <BlockTitle mt={T.spaceXl}>Design tokens</BlockTitle>
          {Object.entries(meta.tokens).map(([k, v]) => (
            <TokenRow key={k} name={k} value={v}>
              {v.startsWith('#') && <div style={{ width: T.spaceLg, height: T.spaceLg, borderRadius: T.radiusSm, background: v, border: T.borderWidth + ' solid var(--color-border)', flexShrink: 0 }} />}
            </TokenRow>
          ))}
        </div>
        <div style={{ background:'var(--color-surface)', border: T.borderWidth + ' solid var(--color-border)', borderRadius: T.radiusLg, padding: T.space2xl }}>
          <ComponentPreview meta={meta} />
        </div>
        <PropsTable props={doc.props} />
        <div>
          <BlockTitle>Import</BlockTitle>
          <CodeBlock code={"import { " + cn + " } from './generated/components';"} />
          <BlockTitle mt={T.spaceXl}>Examples</BlockTitle>
          {doc.snippets.map((s, i) => (
            <div key={i} style={{ marginBottom: T.spaceLg }}>
              <div style={{ fontSize: T.fontSizeUiSm, fontWeight: T.fontWeightSemibold, color:'var(--color-secondary)', marginBottom: T.spaceXs }}>{s.label}</div>
              <CodeBlock code={s.code} />
            </div>
          ))}
        </div>
        <div>
          <BlockTitle>Accessibility contract</BlockTitle>
          <ul style={{ paddingLeft: T.spaceXl, display:'flex', flexDirection:'column', gap: T.spaceSm, marginBottom: T.spaceXl }}>
            {[
              meta.accessibilityContract.keyboard ? 'Keyboard navigable' : 'Not keyboard navigable',
              meta.accessibilityContract.focusRing !== 'none' ? 'Focus ring: ' + meta.accessibilityContract.focusRing : 'No focus ring',
              meta.accessibilityContract.ariaLabel ? 'aria-label: ' + meta.accessibilityContract.ariaLabel : null,
            ].filter(Boolean).map((item, i) => <li key={i} style={{ fontSize: T.fontSizeSm, lineHeight: T.lineHeightNormal }}>{item}</li>)}
          </ul>
          <BlockTitle>AI metadata</BlockTitle>
          <CodeBlock code={JSON.stringify(meta, null, 2)} />
        </div>
      </Tabs>
    </div>
  );
}

function ColorsSection() {
  return (
    <div>
      <h1 style={{ fontSize: T.fontSize2xl, fontWeight: T.fontWeightSemibold, marginBottom: T.spaceXs }}>Colors</h1>
      <p style={{ fontSize: T.fontSizeSm, color:'var(--color-secondary)', marginBottom: T.space2xl }}>Core color palette. Click any swatch to copy its hex value.</p>
      <BlockTitle>Color tokens</BlockTitle>
      <div style={{ display:'flex', flexWrap:'wrap', gap: T.spaceLg }}>
        {Object.entries(metadata[0]?.tokens ?? {}).length === 0
          ? <p style={{ color: 'var(--color-secondary)', fontSize: T.fontSizeSm }}>No color tokens.</p>
          : null}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap: T.spaceLg, marginTop: T.spaceSm }}>
        {Object.entries(
          metadata.reduce((acc, m) => ({ ...acc, ...m.tokens }), {} as Record<string,string>)
        ).filter(([, v]) => v.startsWith('#')).map(([name, value]) => (
          <div key={name} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: T.spaceXs, cursor:'pointer' }} onClick={() => navigator.clipboard.writeText(value)}>
            <div style={{ width: T.space2xl, height: T.space2xl, borderRadius: T.radiusLg, background: value, border: T.borderWidth + ' solid var(--color-border)', transition: 'transform ' + T.durationFast + ' ' + T.easing }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
            <span style={{ fontSize: T.fontSizeUiSm, fontWeight: T.fontWeightSemibold }}>{name}</span>
            <span style={{ fontSize: T.fontSizeUiXs, color:'var(--color-secondary)', fontFamily:'var(--font-mono)' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ColorsPage() {
  return (
    <div>
      <h1 style={{ fontSize: T.fontSize2xl, fontWeight: T.fontWeightSemibold, marginBottom: T.spaceXs }}>Colors</h1>
      <p style={{ fontSize: T.fontSizeSm, color:'var(--color-secondary)', marginBottom: T.space2xl }}>Core color palette. Click any swatch to copy its hex value.</p>
      <BlockTitle>Color tokens</BlockTitle>
    </div>
  );
}

function TypographySection() {
  const scale = metadata.find(m => m.component === 'Typography')?.tokens ?? {};
  return (
    <div>
      <h1 style={{ fontSize: T.fontSize2xl, fontWeight: T.fontWeightSemibold, marginBottom: T.spaceXs }}>Typography</h1>
      <p style={{ fontSize: T.fontSizeSm, color:'var(--color-secondary)', marginBottom: T.space2xl }}>Font: <strong>{T.fontFamily}</strong></p>
      <BlockTitle>Type scale</BlockTitle>
      {[
        { name: 'size6', size: T.fontSize2xl, weight: T.fontWeightSemibold },
        { name: 'size5', size: T.fontSizeXl,  weight: T.fontWeightSemibold },
        { name: 'size4', size: T.fontSizeLg,  weight: T.fontWeightMedium   },
        { name: 'size3', size: T.fontSizeMd,  weight: T.fontWeightRegular  },
        { name: 'size2', size: T.fontSizeSm,  weight: T.fontWeightRegular  },
        { name: 'size1', size: T.fontSizeXs,  weight: T.fontWeightRegular  },
      ].map(v => (
        <TokenRow key={v.name} name={v.name} value={v.size}>
          <span style={{ fontSize: v.size, fontWeight: v.weight, fontFamily: T.fontFamily + ',sans-serif', flex: 1 }}>The quick brown fox</span>
        </TokenRow>
      ))}
    </div>
  );
}

function SpacingSection() {
  return (
    <div>
      <h1 style={{ fontSize: T.fontSize2xl, fontWeight: T.fontWeightSemibold, marginBottom: T.spaceXs }}>Spacing</h1>
      <p style={{ fontSize: T.fontSizeSm, color:'var(--color-secondary)', marginBottom: T.space2xl }}>Base unit: <strong>{T.spaceUnit}px</strong> (density-adjusted)</p>
      <BlockTitle>Spacing scale</BlockTitle>
      {[1,2,3,4,5,6,8,10,12,16].map(m => {
        const val = m * T.spaceUnit;
        return (
          <TokenRow key={m} name={"space" + m} value={val + "px"}>
            <div style={{ width: Math.min(val * 2, 240), height: T.spaceXl, background:'var(--color-primary)', borderRadius: T.radiusSm, flexShrink: 0 }} />
          </TokenRow>
        );
      })}
    </div>
  );
}

function RadiusSection() {
  return (
    <div>
      <h1 style={{ fontSize: T.fontSize2xl, fontWeight: T.fontWeightSemibold, marginBottom: T.spaceXs }}>Border Radius</h1>
      <p style={{ fontSize: T.fontSizeSm, color:'var(--color-secondary)', marginBottom: T.space2xl }}>Available border radius tokens.</p>
      <BlockTitle>Radius scale</BlockTitle>
      {[T.radiusSm, T.radiusMd, T.radiusLg, T.radiusXl].map((r, i) => (
        <TokenRow key={i} name={"radius" + (i+1)} value={r}>
          <div style={{ width: T.space2xl, height: T.space2xl, background:'var(--color-primary)', borderRadius: r, flexShrink: 0 }} />
        </TokenRow>
      ))}
    </div>
  );
}

// ── App shell ─────────────────────────────────────────────────────────────────

const NAV = [
  { group: 'Foundations' },
  { id: 'colors',     label: 'Colors'       },
  { id: 'typography', label: 'Typography'   },
  { id: 'spacing',    label: 'Spacing'      },
  { id: 'radius',     label: 'Border Radius'},
  { group: 'Components' },
  ...metadata.map(m => ({ id: m.component.toLowerCase(), label: m.component })),
];

function getSectionComponent(id) {
  if (id === 'colors')     return <ColorsSection />;
  if (id === 'typography') return <TypographySection />;
  if (id === 'spacing')    return <SpacingSection />;
  if (id === 'radius')     return <RadiusSection />;
  const meta = metadata.find(m => m.component.toLowerCase() === id);
  if (meta) return <ComponentPage key={id} meta={meta} />;
  return null;
}

export function App() {
  const [active, setActive] = useState('colors');
  const [dark,   setDark  ] = useState(false);

  return (
    <div className={dark ? 'dark' : ''} style={{ display:'flex', minHeight:'100vh', background:'var(--color-bg)', color:'var(--color-text)', fontFamily:'var(--font)' }}>
      <nav style={{ width:'var(--sidebar-width)', background:'var(--color-surface)', borderRight: T.borderWidth + ' solid var(--color-border)', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, overflowY:'auto' }}>
        <div style={{ padding: T.spaceXl + ' ' + T.spaceLg, borderBottom: T.borderWidth + ' solid var(--color-border)' }}>
          <div style={{ fontSize: T.fontSizeMd, fontWeight: T.fontWeightSemibold, color:'var(--color-primary)' }}>Design System</div>
          <div style={{ fontSize: T.fontSizeUiXs, color:'var(--color-secondary)', marginTop: T.spaceXs }}>Generated by dsforge</div>
        </div>
        {NAV.map((item, i) =>
          item.group ? (
            <div key={i} style={{ padding: T.spaceLg + ' ' + T.spaceSm + ' ' + T.spaceXs, fontSize: T.fontSizeUiXs, fontWeight: T.fontWeightSemibold, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--color-secondary)' }}>{item.group}</div>
          ) : (
            <button key={item.id} onClick={() => setActive(item.id)} style={{
              display:'block', width:'100%', padding: T.spaceSm + ' ' + T.spaceMd, margin:'1px 0',
              borderRadius: T.radiusMd, fontSize: T.fontSizeUiMd, fontWeight: T.fontWeightMedium,
              textAlign:'left', border:'none', cursor:'pointer', fontFamily:'inherit',
              transition: 'background ' + T.durationFast + ' ' + T.easing,
              background: active === item.id ? 'var(--color-primary)' : 'transparent',
              color: active === item.id ? T.colorOnPrimary : 'var(--color-text)',
            }}>{item.label}</button>
          )
        )}
      </nav>

      <div style={{ position:'fixed', top:0, left:'var(--sidebar-width)', right:0, height:'var(--topbar-height)', background:'var(--color-bg)', borderBottom: T.borderWidth + ' solid var(--color-border)', display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'0 ' + T.space2xl, zIndex:10 }}>
        <button onClick={() => setDark(d => !d)} style={{ background:'var(--color-surface)', border: T.borderWidth + ' solid var(--color-border)', color:'var(--color-text)', padding: T.spaceXs + ' ' + T.spaceLg, borderRadius: T.radiusFull, fontSize: T.fontSizeUiSm, fontFamily:'inherit', fontWeight: T.fontWeightMedium, cursor:'pointer' }}>
          {dark ? 'Light' : 'Dark'}
        </button>
      </div>

      <main style={{ marginLeft:'var(--sidebar-width)', flex:1, padding:'calc(var(--topbar-height) + ' + T.space2xl + ') ' + T.space2xl + ' 64px', maxWidth:900 }}>
        {getSectionComponent(active)}
      </main>
    </div>
  );
}
`;
}
