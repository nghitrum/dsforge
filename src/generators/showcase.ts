import * as path from "path";
import * as fs from "fs-extra";
import {
  DesignSystemConfig,
  GovernanceRules,
  ComponentMetadata,
} from "../types";

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

// ─── Docs content ─────────────────────────────────────────────────────────────

function buildDocs(
  config: DesignSystemConfig,
  rules: GovernanceRules,
): Record<string, ComponentDoc> {
  const bv = rules.button?.allowedVariants ?? [
    "primary",
    "secondary",
    "danger",
  ];
  const c = config.color;
  const sp = config.spacing;

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
          type: bv.map((v) => '"' + v + '"').join(" | "),
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
          code: '<Button variant="secondary" aria-label="Close dialog">X</Button>',
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
        "The `gap` prop is a multiplier of the base spacing unit.",
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
          description: "Spacing multiplier x " + sp.baseUnit + "px base unit",
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Safe for embedding inside <script>: escape </script> sequences
function safeJSON(val: unknown): string {
  return JSON.stringify(val).replace(/<\/script>/gi, "<\\/script>");
}

// ─── HTML generator ───────────────────────────────────────────────────────────

async function generateHTML(
  config: DesignSystemConfig,
  rules: GovernanceRules,
  metadata: ComponentMetadata[],
  showcaseDir: string,
): Promise<string> {
  const { color, typography, radius, spacing: sp } = config;
  const bv = rules.button?.allowedVariants ?? [
    "primary",
    "secondary",
    "danger",
  ];
  const br = radius.scale[1];
  const pad = sp.baseUnit * 2 + "px " + sp.baseUnit * 4 + "px";
  const docs = buildDocs(config, rules);
  const font = typography.fontFamily;

  // ── Pre-build sections as plain strings ───────────────────────────────────

  const colorSwatches = Object.entries(color)
    .map(
      ([name, value]) =>
        '<div class="swatch-wrap" onclick="copyText(\'' +
        value +
        "')\">" +
        '<div class="swatch" style="background:' +
        value +
        '"></div>' +
        '<div class="swatch-label">' +
        name +
        "</div>" +
        '<div class="swatch-value">' +
        value +
        "</div>" +
        "</div>",
    )
    .join("");

  const typoRows = config.typography.scale
    .map(
      (size: number, i: number) =>
        '<div class="token-row">' +
        '<span class="token-name">size' +
        (i + 1) +
        "</span>" +
        '<span style="font-size:' +
        size +
        "px;font-family:" +
        font +
        ',sans-serif;flex:1">The quick brown fox</span>' +
        '<span class="token-value">' +
        size +
        "px</span>" +
        '<button class="copy-btn" onclick="copyText(\'font-size: ' +
        size +
        "px', this)\">Copy</button>" +
        "</div>",
    )
    .join("");

  const spacingRows = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16]
    .map((m) => {
      const val = m * sp.baseUnit;
      return (
        '<div class="token-row">' +
        '<span class="token-name">space' +
        m +
        "</span>" +
        '<div style="width:' +
        Math.min(val * 2, 240) +
        "px;height:16px;background:" +
        color.primary +
        ';border-radius:2px;flex-shrink:0"></div>' +
        '<span class="token-value">' +
        val +
        "px</span>" +
        '<button class="copy-btn" onclick="copyText(\'' +
        val +
        "px', this)\">Copy</button>" +
        "</div>"
      );
    })
    .join("");

  const radiusRows = config.radius.scale
    .map(
      (r: number, i: number) =>
        '<div class="token-row">' +
        '<span class="token-name">radius' +
        (i + 1) +
        "</span>" +
        '<div style="width:40px;height:40px;background:' +
        color.primary +
        ";border-radius:" +
        r +
        'px;opacity:0.85;flex-shrink:0"></div>' +
        '<span class="token-value">' +
        r +
        "px</span>" +
        '<button class="copy-btn" onclick="copyText(\'' +
        r +
        "px', this)\">Copy</button>" +
        "</div>",
    )
    .join("");

  const navItems = metadata
    .map(
      (m) =>
        '<button class="nav-item" onclick="show(\'' +
        m.component.toLowerCase() +
        "', this)\">" +
        m.component +
        "</button>",
    )
    .join("");

  // ── Component sections ────────────────────────────────────────────────────

  function propsTable(props: PropRow[]): string {
    const rows = props
      .map(
        (p) =>
          "<tr>" +
          "<td><code>" +
          p.name +
          "</code></td>" +
          '<td><code class="type">' +
          esc(p.type) +
          "</code></td>" +
          "<td><code>" +
          esc(p.default) +
          "</code></td>" +
          "<td>" +
          p.description +
          "</td>" +
          "</tr>",
      )
      .join("");
    return (
      '<table class="props-table">' +
      "<thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>" +
      "<tbody>" +
      rows +
      "</tbody>" +
      "</table>"
    );
  }

  function a11ySection(meta: ComponentMetadata): string {
    const items: string[] = [
      meta.accessibilityContract.keyboard
        ? "Keyboard navigable"
        : "Not keyboard navigable",
      meta.accessibilityContract.focusRing !== "none"
        ? "Focus ring: " + meta.accessibilityContract.focusRing
        : "No focus ring",
    ];
    if (meta.accessibilityContract.ariaLabel)
      items.push("aria-label: " + meta.accessibilityContract.ariaLabel);
    return (
      '<ul class="a11y-list">' +
      items.map((i) => "<li>" + i + "</li>").join("") +
      "</ul>"
    );
  }

  function componentSection(meta: ComponentMetadata): string {
    const doc = docs[meta.component];
    if (!doc) return "";
    const cn = meta.component;
    const cid = cn.toLowerCase();

    // Overview tab
    const metaItems = [
      ["Role", meta.role],
      ["Hierarchy", meta.hierarchyLevel],
      ["Interaction", meta.interactionModel],
      ["Layout impact", meta.layoutImpact],
      ["Destructive", meta.destructive ? "yes" : "no"],
      ...(meta.variants ? [["Variants", meta.variants.join(", ")]] : []),
    ];
    const metaGrid =
      '<div class="meta-grid">' +
      metaItems
        .map(
          ([label, value]) =>
            '<div class="meta-item"><span class="meta-label">' +
            label +
            "</span><code>" +
            value +
            "</code></div>",
        )
        .join("") +
      "</div>";

    const usageList =
      '<ul class="usage-list">' +
      doc.usage.map((u) => "<li>" + u + "</li>").join("") +
      "</ul>";

    const tokenRows = Object.entries(meta.tokens)
      .map(
        ([k, v]) =>
          '<div class="token-row">' +
          '<span class="token-name">' +
          k +
          "</span>" +
          (v.startsWith("#")
            ? '<div style="width:20px;height:20px;border-radius:4px;background:' +
              v +
              ';border:1px solid var(--color-border);flex-shrink:0"></div>'
            : "") +
          '<span class="token-value">' +
          v +
          "</span>" +
          '<button class="copy-btn" onclick="copyText(\'' +
          k +
          "', this)\">Copy</button>" +
          "</div>",
      )
      .join("");

    const overviewPanel =
      metaGrid +
      '<div class="block-title" style="margin-top:24px">Usage guidelines</div>' +
      usageList +
      '<div class="block-title" style="margin-top:24px">Design tokens</div>' +
      tokenRows;

    // Preview tab
    const previewPanel =
      '<div class="preview-area">' +
      buildPreview(meta, config, bv, br, pad) +
      "</div>";

    // Props tab
    const propsPanel = propsTable(doc.props);

    // Code tab
    const importSnippet =
      '<div class="block-title">Import</div>' +
      '<div class="snippet-panel" style="margin-bottom:24px">' +
      '<button class="copy-btn snippet-copy" onclick="copySnippet(\'' +
      cn +
      "', -1, this)\">Copy</button>" +
      "<pre><code>" +
      esc("import { " + cn + " } from './generated/components';") +
      "</code></pre>" +
      "</div>";

    const exampleSnippets =
      '<div class="block-title">Examples</div>' +
      doc.snippets
        .map(
          (s, si) =>
            '<div style="margin-bottom:16px">' +
            '<div class="snippet-label">' +
            s.label +
            "</div>" +
            '<div class="snippet-panel">' +
            '<button class="copy-btn snippet-copy" onclick="copySnippet(\'' +
            cn +
            "', " +
            si +
            ', this)">Copy</button>' +
            "<pre><code>" +
            esc(s.code) +
            "</code></pre>" +
            "</div></div>",
        )
        .join("");

    const codePanel = importSnippet + exampleSnippets;

    // Accessibility tab
    const a11yPanel =
      '<div class="block-title">Accessibility contract</div>' +
      a11ySection(meta) +
      '<div class="block-title" style="margin-top:24px">AI metadata</div>' +
      '<div class="snippet-panel">' +
      '<button class="copy-btn snippet-copy" onclick="copySnippet(\'' +
      cn +
      "', 'meta', this)\">Copy</button>" +
      "<pre><code>" +
      esc(JSON.stringify(meta, null, 2)) +
      "</code></pre>" +
      "</div>";

    return (
      '<div class="section" id="section-' +
      cid +
      '">' +
      '<div class="page-title">' +
      cn +
      "</div>" +
      '<div class="page-desc">' +
      doc.description +
      "</div>" +
      '<div class="tabs">' +
      '<button class="tab active" onclick="switchTab(this)">Overview</button>' +
      '<button class="tab" onclick="switchTab(this)">Preview</button>' +
      '<button class="tab" onclick="switchTab(this)">Props</button>' +
      '<button class="tab" onclick="switchTab(this)">Code</button>' +
      '<button class="tab" onclick="switchTab(this)">Accessibility</button>' +
      "</div>" +
      '<div class="tab-panel active">' +
      overviewPanel +
      "</div>" +
      '<div class="tab-panel">' +
      previewPanel +
      "</div>" +
      '<div class="tab-panel">' +
      propsPanel +
      "</div>" +
      '<div class="tab-panel">' +
      codePanel +
      "</div>" +
      '<div class="tab-panel">' +
      a11yPanel +
      "</div>" +
      "</div>"
    );
  }

  const componentSections = metadata.map(componentSection).join("");

  // ── SNIPPETS data for JS ──────────────────────────────────────────────────
  // Built as a plain object, serialized once — no nested template literals
  const snippetData: Record<
    string,
    { import: string; snippets: string[]; meta: string }
  > = {};
  for (const m of metadata) {
    const doc = docs[m.component];
    snippetData[m.component] = {
      import: "import { " + m.component + " } from './generated/components';",
      snippets: doc ? doc.snippets.map((s) => s.code) : [],
      meta: JSON.stringify(m, null, 2),
    };
  }
  const snippetsJSON = safeJSON(snippetData);

  // ── CSS ───────────────────────────────────────────────────────────────────
  const css = [
    "*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }",
    ":root {",
    "  --color-primary: " + color.primary + ";",
    "  --color-secondary: " + color.secondary + ";",
    "  --color-danger: " + color.danger + ";",
    "  --color-bg: " + color.background + ";",
    "  --color-text: " + color.text + ";",
    "  --color-surface: #f8fafc;",
    "  --color-border: rgba(0,0,0,0.08);",
    "  --color-code-bg: #f1f5f9;",
    "  --sidebar-width: 228px;",
    "  --topbar-height: 52px;",
    "  --font: '" + font + "', system-ui, sans-serif;",
    "  --font-mono: 'SF Mono', 'Fira Code', monospace;",
    "}",
    "[data-theme='dark'] {",
    "  --color-bg: #0f172a; --color-text: #f1f5f9;",
    "  --color-surface: #1e293b; --color-border: rgba(255,255,255,0.08);",
    "  --color-code-bg: #1e293b;",
    "}",
    "body { font-family: var(--font); background: var(--color-bg); color: var(--color-text); display: flex; min-height: 100vh; transition: background .2s, color .2s; }",
    ".sidebar { width: var(--sidebar-width); background: var(--color-surface); border-right: 1px solid var(--color-border); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; overflow-y: auto; }",
    ".sidebar-logo { padding: 18px 16px; border-bottom: 1px solid var(--color-border); }",
    ".sidebar-logo-title { font-size: 16px; font-weight: 600; color: var(--color-primary); }",
    ".sidebar-logo-sub { font-size: 11px; color: var(--color-secondary); margin-top: 2px; }",
    ".nav-group { padding: 16px 8px 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--color-secondary); }",
    ".nav-item { display: block; width: 100%; padding: 7px 10px; margin: 1px 0; border-radius: 6px; font-size: 13px; font-weight: 500; color: var(--color-text); text-align: left; border: none; background: transparent; cursor: pointer; font-family: var(--font); transition: background .12s, color .12s; }",
    ".nav-item:hover { background: var(--color-border); }",
    ".nav-item.active { background: var(--color-primary); color: #fff; }",
    ".topbar { position: fixed; top: 0; left: var(--sidebar-width); right: 0; height: var(--topbar-height); background: var(--color-bg); border-bottom: 1px solid var(--color-border); display: flex; align-items: center; justify-content: flex-end; padding: 0 32px; gap: 10px; z-index: 10; }",
    ".dark-btn { background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); padding: 5px 14px; border-radius: 20px; font-size: 12px; font-family: var(--font); font-weight: 500; cursor: pointer; }",
    ".dark-btn:hover { background: var(--color-border); }",
    ".main { margin-left: var(--sidebar-width); flex: 1; padding: calc(var(--topbar-height) + 40px) 48px 64px; max-width: 900px; }",
    ".section { display: none; } .section.active { display: block; }",
    ".page-title { font-size: 26px; font-weight: 600; margin-bottom: 6px; }",
    ".page-desc { font-size: 14px; color: var(--color-secondary); margin-bottom: 28px; line-height: 1.6; max-width: 600px; }",
    ".block-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--color-secondary); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--color-border); }",
    ".tabs { display: flex; gap: 2px; border-bottom: 2px solid var(--color-border); margin-bottom: 24px; }",
    ".tab { padding: 8px 16px; font-size: 13px; font-weight: 500; font-family: var(--font); background: none; border: none; color: var(--color-secondary); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color .15s, border-color .15s; }",
    ".tab:hover { color: var(--color-text); }",
    ".tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }",
    ".tab-panel { display: none; } .tab-panel.active { display: block; }",
    ".meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 8px; }",
    ".meta-item { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 12px 14px; }",
    ".meta-label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--color-secondary); margin-bottom: 6px; }",
    ".meta-item code { font-family: var(--font-mono); font-size: 12px; color: var(--color-primary); }",
    ".usage-list { padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }",
    ".usage-list li { font-size: 14px; line-height: 1.6; color: var(--color-text); }",
    ".usage-list code { font-family: var(--font-mono); font-size: 12px; background: var(--color-code-bg); padding: 1px 5px; border-radius: 3px; }",
    ".token-row { display: flex; align-items: center; gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--color-border); }",
    ".token-name { font-family: var(--font-mono); font-size: 12px; color: var(--color-primary); width: 120px; flex-shrink: 0; }",
    ".token-value { font-family: var(--font-mono); font-size: 12px; color: var(--color-secondary); margin-left: auto; }",
    ".swatches { display: flex; flex-wrap: wrap; gap: 16px; }",
    ".swatch-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }",
    ".swatch { width: 64px; height: 64px; border-radius: 12px; border: 1px solid var(--color-border); transition: transform .15s; }",
    ".swatch:hover { transform: scale(1.1); }",
    ".swatch-label { font-size: 12px; font-weight: 600; }",
    ".swatch-value { font-size: 11px; color: var(--color-secondary); font-family: var(--font-mono); }",
    ".props-table { width: 100%; border-collapse: collapse; font-size: 13px; }",
    ".props-table th { text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--color-secondary); border-bottom: 2px solid var(--color-border); }",
    ".props-table td { padding: 10px 12px; border-bottom: 1px solid var(--color-border); vertical-align: top; line-height: 1.5; }",
    ".props-table code { font-family: var(--font-mono); font-size: 12px; background: var(--color-code-bg); padding: 1px 5px; border-radius: 3px; }",
    ".props-table code.type { color: var(--color-primary); }",
    ".snippet-panel { position: relative; background: var(--color-code-bg); border-radius: 8px; border: 1px solid var(--color-border); padding: 16px; margin-top: 8px; }",
    ".snippet-panel pre { overflow-x: auto; }",
    ".snippet-panel code { font-family: var(--font-mono); font-size: 12px; line-height: 1.7; white-space: pre; }",
    ".snippet-label { font-size: 12px; font-weight: 600; color: var(--color-secondary); margin-bottom: 4px; }",
    ".snippet-copy { position: absolute; top: 10px; right: 10px; }",
    ".preview-area { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 10px; padding: 32px; display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }",
    ".preview-item { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }",
    ".preview-label { font-size: 11px; font-weight: 600; color: var(--color-secondary); text-transform: uppercase; letter-spacing: .06em; }",
    ".a11y-list { padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }",
    ".a11y-list li { font-size: 14px; line-height: 1.6; }",
    ".copy-btn { font-size: 11px; font-family: var(--font); font-weight: 500; padding: 3px 10px; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-secondary); cursor: pointer; transition: all .15s; white-space: nowrap; }",
    ".copy-btn:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }",
    ".copy-btn.copied { background: #16a34a; color: #fff; border-color: #16a34a; }",
    ".toast { position: fixed; bottom: 24px; right: 24px; background: #1e293b; color: #f1f5f9; padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; opacity: 0; transform: translateY(6px); transition: opacity .2s, transform .2s; pointer-events: none; z-index: 100; }",
    ".toast.show { opacity: 1; transform: none; }",
  ].join("\n");

  // ── Assemble final HTML ───────────────────────────────────────────────────
  const googleFont =
    "https://fonts.googleapis.com/css2?family=" +
    font.replace(/ /g, "+") +
    ":wght@400;500;600&display=swap";

  const html = [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="UTF-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    "  <title>Design System</title>",
    '  <link rel="preconnect" href="https://fonts.googleapis.com">',
    '  <link href="' + googleFont + '" rel="stylesheet">',
    "  <style>",
    css,
    "  </style>",
    "</head>",
    "<body>",
    "",
    '<nav class="sidebar">',
    '  <div class="sidebar-logo">',
    '    <div class="sidebar-logo-title">Design System</div>',
    '    <div class="sidebar-logo-sub">Generated by dsgen</div>',
    "  </div>",
    '  <div class="nav-group">Foundations</div>',
    '  <button class="nav-item active" onclick="show(\'colors\', this)">Colors</button>',
    '  <button class="nav-item" onclick="show(\'typography\', this)">Typography</button>',
    '  <button class="nav-item" onclick="show(\'spacing\', this)">Spacing</button>',
    '  <button class="nav-item" onclick="show(\'radius\', this)">Border Radius</button>',
    '  <div class="nav-group">Components</div>',
    "  " + navItems,
    "</nav>",
    "",
    '<div class="topbar">',
    '  <button class="dark-btn" onclick="toggleDark(this)">Dark</button>',
    "</div>",
    "",
    '<main class="main">',
    "",
    '  <div class="section active" id="section-colors">',
    '    <div class="page-title">Colors</div>',
    '    <div class="page-desc">Core color palette. Click any swatch to copy its hex value.</div>',
    '    <div class="block-title">Color tokens</div>',
    '    <div class="swatches">' + colorSwatches + "</div>",
    "  </div>",
    "",
    '  <div class="section" id="section-typography">',
    '    <div class="page-title">Typography</div>',
    '    <div class="page-desc">Font family: <strong>' +
      font +
      "</strong> &middot; " +
      config.typography.scale.length +
      " sizes &middot; " +
      config.typography.fontWeights.length +
      " weights</div>",
    '    <div class="block-title">Type scale</div>',
    "    " + typoRows,
    "  </div>",
    "",
    '  <div class="section" id="section-spacing">',
    '    <div class="page-title">Spacing</div>',
    '    <div class="page-desc">Base unit: <strong>' +
      sp.baseUnit +
      "px</strong>. All spacing values are multiples of the base unit.</div>",
    '    <div class="block-title">Spacing scale</div>',
    "    " + spacingRows,
    "  </div>",
    "",
    '  <div class="section" id="section-radius">',
    '    <div class="page-title">Border Radius</div>',
    '    <div class="page-desc">Available border radius tokens from your config.</div>',
    '    <div class="block-title">Radius scale</div>',
    "    " + radiusRows,
    "  </div>",
    "",
    componentSections,
    "",
    "</main>",
    "",
    '<div class="toast" id="toast">Copied!</div>',
    "",
    "<script>",
    "  function show(id, btn) {",
    "    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));",
    "    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));",
    "    document.getElementById('section-' + id).classList.add('active');",
    "    if (btn) btn.classList.add('active');",
    "  }",
    "  function toggleDark(btn) {",
    "    const dark = document.documentElement.getAttribute('data-theme') === 'dark';",
    "    document.documentElement.setAttribute('data-theme', dark ? '' : 'dark');",
    "    btn.textContent = dark ? 'Dark' : 'Light';",
    "  }",
    "  function switchTab(btn) {",
    "    const wrapper = btn.closest('.section');",
    "    wrapper.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));",
    "    wrapper.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));",
    "    btn.classList.add('active');",
    "    const idx = Array.from(btn.parentElement.querySelectorAll('.tab')).indexOf(btn);",
    "    const panels = wrapper.querySelectorAll('.tab-panel');",
    "    if (panels[idx]) panels[idx].classList.add('active');",
    "  }",
    "  const SNIPPETS = " + snippetsJSON + ";",
    "  function copySnippet(component, idx, btn) {",
    "    const entry = SNIPPETS[component];",
    "    if (!entry) return;",
    "    const text = idx === -1 ? entry.import : idx === 'meta' ? entry.meta : entry.snippets[idx];",
    "    if (text != null) copyText(text, btn);",
    "  }",
    "  function copyText(text, btn) {",
    "    navigator.clipboard.writeText(text).then(() => {",
    "      if (btn) {",
    "        const orig = btn.textContent;",
    "        btn.textContent = 'Copied!';",
    "        btn.classList.add('copied');",
    "        setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);",
    "      }",
    "      const t = document.getElementById('toast');",
    "      t.classList.add('show');",
    "      setTimeout(() => t.classList.remove('show'), 2000);",
    "    });",
    "  }",
    "</script>",
    "</body>",
    "</html>",
  ].join("\n");

  const outPath = path.join(showcaseDir, "index.html");
  await fs.writeFile(outPath, html);
  return outPath;
}

// ─── Preview builder ──────────────────────────────────────────────────────────

function buildPreview(
  meta: ComponentMetadata,
  config: DesignSystemConfig,
  bv: string[],
  br: number,
  pad: string,
): string {
  const { color, typography, radius, spacing: sp } = config;
  const font = typography.fontFamily;

  if (meta.component === "Button") {
    return bv
      .map((v) => {
        const bg =
          v === "primary"
            ? color.primary
            : v === "danger"
              ? color.danger
              : color.secondary;
        return (
          '<div class="preview-item">' +
          '<div class="preview-label">' +
          v +
          "</div>" +
          '<button style="background:' +
          bg +
          ";color:#fff;border:none;padding:" +
          pad +
          ";border-radius:" +
          br +
          "px;font-size:14px;font-weight:500;cursor:pointer;font-family:" +
          font +
          ',sans-serif">' +
          v.charAt(0).toUpperCase() +
          v.slice(1) +
          "</button></div>"
        );
      })
      .join("");
  }

  if (meta.component === "Input") {
    return (
      '<div class="preview-item" style="min-width:260px">' +
      '<div class="preview-label">Default</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;width:100%">' +
      '<label style="font-size:13px;font-weight:500;font-family:' +
      font +
      ',sans-serif">Email address</label>' +
      '<input placeholder="you@example.com" style="padding:' +
      pad +
      ";border:1px solid " +
      color.secondary +
      ";border-radius:" +
      br +
      "px;font-size:14px;font-family:" +
      font +
      ',sans-serif;width:100%;outline:none;background:var(--color-bg);color:var(--color-text)" />' +
      "</div></div>" +
      '<div class="preview-item" style="min-width:260px">' +
      '<div class="preview-label">Error state</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;width:100%">' +
      '<label style="font-size:13px;font-weight:500;font-family:' +
      font +
      ',sans-serif">Password</label>' +
      '<input type="password" placeholder="••••••••" style="padding:' +
      pad +
      ";border:1px solid " +
      color.danger +
      ";border-radius:" +
      br +
      "px;font-size:14px;font-family:" +
      font +
      ',sans-serif;width:100%;outline:none;background:var(--color-bg);color:var(--color-text)" />' +
      '<span style="font-size:12px;color:' +
      color.danger +
      ";font-family:" +
      font +
      ',sans-serif">Password is required</span>' +
      "</div></div>"
    );
  }

  if (meta.component === "Card") {
    const shadows: Record<string, string> = {
      none: "none",
      small: "0 1px 3px rgba(0,0,0,0.1)",
      medium: "0 4px 12px rgba(0,0,0,0.12)",
    };
    return ["none", "small", "medium"]
      .map(
        (s) =>
          '<div class="preview-item">' +
          '<div class="preview-label">shadow="' +
          s +
          '"</div>' +
          '<div style="background:var(--color-bg);border-radius:' +
          radius.scale[2] +
          "px;padding:" +
          sp.baseUnit * 5 +
          "px;min-width:200px;box-shadow:" +
          shadows[s] +
          ';border:1px solid var(--color-border)">' +
          '<div style="font-size:15px;font-weight:600;margin-bottom:6px;font-family:' +
          font +
          ',sans-serif">Card title</div>' +
          '<div style="font-size:13px;color:' +
          color.secondary +
          ";font-family:" +
          font +
          ',sans-serif;line-height:1.5">Supporting content goes here.</div>' +
          "</div></div>",
      )
      .join("");
  }

  if (meta.component === "Typography") {
    const variants = [
      { label: "h1", size: typography.scale[5], weight: 600 },
      { label: "h2", size: typography.scale[4], weight: 600 },
      { label: "h3", size: typography.scale[3], weight: 500 },
      { label: "body", size: typography.scale[2], weight: 400 },
      { label: "small", size: typography.scale[1], weight: 400 },
      { label: "caption", size: typography.scale[0], weight: 400 },
    ];
    return (
      '<div style="display:flex;flex-direction:column;gap:16px;width:100%">' +
      variants
        .map(
          (v) =>
            '<div class="preview-item">' +
            '<div class="preview-label">' +
            v.label +
            "</div>" +
            '<span style="font-size:' +
            v.size +
            "px;font-weight:" +
            v.weight +
            ";font-family:" +
            font +
            ',sans-serif">The quick brown fox jumps</span>' +
            "</div>",
        )
        .join("") +
      "</div>"
    );
  }

  if (meta.component === "Stack") {
    return ["column", "row"]
      .map(
        (dir) =>
          '<div class="preview-item">' +
          '<div class="preview-label">direction="' +
          dir +
          '"</div>' +
          '<div style="display:flex;flex-direction:' +
          dir +
          ";gap:" +
          sp.baseUnit * 2 +
          'px">' +
          [1, 2, 3]
            .map(
              (i) =>
                '<div style="background:' +
                color.primary +
                ";opacity:" +
                (1 - i * 0.15) +
                ";border-radius:4px;padding:8px 16px;color:#fff;font-size:13px;font-family:" +
                font +
                ',sans-serif">Item ' +
                i +
                "</div>",
            )
            .join("") +
          "</div></div>",
      )
      .join("");
  }

  return '<div style="color:var(--color-secondary);font-size:13px">No preview available</div>';
}

// ─── Vite generator ───────────────────────────────────────────────────────────

async function generateVite(
  config: DesignSystemConfig,
  rules: GovernanceRules,
  metadata: ComponentMetadata[],
  showcaseDir: string,
): Promise<string> {
  const { color, typography } = config;
  const font = typography.fontFamily;
  const docs = buildDocs(config, rules);
  const bv = rules.button?.allowedVariants ?? [
    "primary",
    "secondary",
    "danger",
  ];

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
    "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });",
  );

  const googleFont =
    "https://fonts.googleapis.com/css2?family=" +
    font.replace(/ /g, "+") +
    ":wght@400;500;600&display=swap";

  await fs.writeFile(
    path.join(showcaseDir, "index.html"),
    [
      "<!DOCTYPE html>",
      '<html lang="en">',
      "  <head>",
      '    <meta charset="UTF-8" />',
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      "    <title>Design System</title>",
      '    <link rel="preconnect" href="https://fonts.googleapis.com">',
      '    <link href="' + googleFont + '" rel="stylesheet">',
      "  </head>",
      "  <body>",
      '    <div id="root"></div>',
      '    <script type="module" src="/src/main.jsx"></script>',
      "  </body>",
      "</html>",
    ].join("\n"),
  );

  await fs.ensureDir(path.join(showcaseDir, "src"));

  await fs.writeFile(
    path.join(showcaseDir, "src", "main.jsx"),
    "import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport { App } from './App';\nimport './styles.css';\ncreateRoot(document.getElementById('root')).render(<App />);",
  );

  const cssVars = [
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}",
    ":root{",
    "  --color-primary:" + color.primary + ";",
    "  --color-secondary:" + color.secondary + ";",
    "  --color-danger:" + color.danger + ";",
    "  --color-bg:" + color.background + ";",
    "  --color-text:" + color.text + ";",
    "  --color-surface:#f8fafc;",
    "  --color-border:rgba(0,0,0,0.08);",
    "  --color-code-bg:#f1f5f9;",
    "  --sidebar-width:228px;",
    "  --topbar-height:52px;",
    "  --font:'" + font + "',system-ui,sans-serif;",
    "  --font-mono:'SF Mono','Fira Code',monospace;",
    "}",
    ".dark{--color-bg:#0f172a;--color-text:#f1f5f9;--color-surface:#1e293b;--color-border:rgba(255,255,255,0.08);--color-code-bg:#1e293b;}",
    "body{font-family:var(--font);background:var(--color-bg);color:var(--color-text);}",
  ].join("\n");

  await fs.writeFile(path.join(showcaseDir, "src", "styles.css"), cssVars);
  await fs.writeFile(
    path.join(showcaseDir, "src", "App.jsx"),
    buildViteApp(config, docs, metadata, bv),
  );

  return showcaseDir;
}

function buildViteApp(
  config: DesignSystemConfig,
  docs: Record<string, ComponentDoc>,
  metadata: ComponentMetadata[],
  bv: string[],
): string {
  const { color, typography, radius, spacing: sp } = config;
  const font = typography.fontFamily;
  const br = radius.scale[1];
  const pad = sp.baseUnit * 2 + "px " + sp.baseUnit * 4 + "px";

  // Serialize all data as constants — no nested template literals
  const configJSON = JSON.stringify(config);
  const metaJSON = JSON.stringify(metadata);
  const docsJSON = JSON.stringify(docs);
  const bvJSON = JSON.stringify(bv);

  return `import { useState, useCallback } from 'react';

const config   = ${configJSON};
const metadata = ${metaJSON};
const docs     = ${docsJSON};
const bv       = ${bvJSON};

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  const style = {
    fontSize:11, padding:'3px 10px', borderRadius:4,
    border:'1px solid var(--color-border)',
    background: copied ? '#16a34a' : 'var(--color-surface)',
    color: copied ? '#fff' : 'var(--color-secondary)',
    cursor:'pointer', fontFamily:'inherit', fontWeight:500,
    transition:'all .15s', whiteSpace:'nowrap',
  };
  return <button onClick={copy} style={style}>{copied ? 'Copied!' : label}</button>;
}

function BlockTitle({ children, mt }) {
  return <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--color-secondary)', marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--color-border)', marginTop: mt || 0 }}>{children}</div>;
}

function TokenRow({ name, value, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 0', borderBottom:'1px solid var(--color-border)' }}>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--color-primary)', width:120, flexShrink:0 }}>{name}</span>
      {children}
      {value && <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--color-secondary)', marginLeft:'auto' }}>{value}</span>}
      <CopyButton text={value || name} />
    </div>
  );
}

function CodeBlock({ code }) {
  return (
    <div style={{ position:'relative', background:'var(--color-code-bg)', borderRadius:8, border:'1px solid var(--color-border)', padding:16, marginTop:8 }}>
      <div style={{ position:'absolute', top:10, right:10 }}><CopyButton text={code} /></div>
      <pre style={{ overflow:'auto' }}><code style={{ fontFamily:'var(--font-mono)', fontSize:12, lineHeight:1.7, whiteSpace:'pre' }}>{code}</code></pre>
    </div>
  );
}

function Tabs({ tabs, children }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div style={{ display:'flex', gap:2, borderBottom:'2px solid var(--color-border)', marginBottom:24 }}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActive(i)} style={{
            padding:'8px 16px', fontSize:13, fontWeight:500, fontFamily:'inherit',
            background:'none', border:'none', cursor:'pointer',
            color: active === i ? 'var(--color-primary)' : 'var(--color-secondary)',
            borderBottom: active === i ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom:-2, transition:'color .15s, border-color .15s',
          }}>{t}</button>
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
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:8 }}>
      {items.map(([label, val]) => (
        <div key={label} style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:8, padding:'12px 14px' }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--color-secondary)', marginBottom:6 }}>{label}</div>
          <code style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--color-primary)' }}>{val}</code>
        </div>
      ))}
    </div>
  );
}

function PropsTable({ props }) {
  const th = { textAlign:'left', padding:'8px 12px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--color-secondary)', borderBottom:'2px solid var(--color-border)' };
  const td = { padding:'10px 12px', borderBottom:'1px solid var(--color-border)', verticalAlign:'top', lineHeight:1.5 };
  const code = { fontFamily:'var(--font-mono)', fontSize:12, background:'var(--color-code-bg)', padding:'1px 5px', borderRadius:3 };
  return (
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
      <thead><tr>{['Prop','Type','Default','Description'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
      <tbody>
        {props.map(p => (
          <tr key={p.name}>
            <td style={td}><code style={code}>{p.name}</code></td>
            <td style={td}><code style={{ ...code, color:'var(--color-primary)' }}>{p.type}</code></td>
            <td style={td}><code style={code}>{p.default}</code></td>
            <td style={{ ...td, color:'var(--color-text)' }}>{p.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ComponentPreview({ meta }) {
  const c = config.color;
  const ty = config.typography;
  const r = config.radius;
  const s = config.spacing;
  const pad = (s.baseUnit * 2) + 'px ' + (s.baseUnit * 4) + 'px';
  const br = r.scale[1];
  const font = ty.fontFamily;

  if (meta.component === 'Button') return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:24 }}>
      {bv.map(v => {
        const bg = v === 'primary' ? c.primary : v === 'danger' ? c.danger : c.secondary;
        return (
          <div key={v} style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--color-secondary)', textTransform:'uppercase' }}>{v}</div>
            <button style={{ background:bg, color:'#fff', border:'none', padding:pad, borderRadius:br, fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:font + ',sans-serif' }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          </div>
        );
      })}
    </div>
  );

  if (meta.component === 'Input') return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:32 }}>
      {[
        { lbl:'Default', label:'Email', type:'email', ph:'you@example.com', hint:'We will never share your email.', err:null },
        { lbl:'Error', label:'Password', type:'password', ph:'••••••••', hint:null, err:'Password is required' },
      ].map(f => (
        <div key={f.lbl} style={{ minWidth:260 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--color-secondary)', textTransform:'uppercase', marginBottom:8 }}>{f.lbl}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ fontSize:13, fontWeight:500 }}>{f.label}</label>
            <input type={f.type} placeholder={f.ph} readOnly style={{ padding:pad, border:'1px solid ' + (f.err ? c.danger : c.secondary), borderRadius:br, fontSize:14, fontFamily:font + ',sans-serif', outline:'none', background:'var(--color-bg)', color:'var(--color-text)', width:'100%' }} />
            {f.hint && <span style={{ fontSize:12, color:c.secondary }}>{f.hint}</span>}
            {f.err  && <span style={{ fontSize:12, color:c.danger  }}>{f.err}</span>}
          </div>
        </div>
      ))}
    </div>
  );

  if (meta.component === 'Card') return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:24 }}>
      {[['none','none'],['small','0 1px 3px rgba(0,0,0,0.1)'],['medium','0 4px 12px rgba(0,0,0,0.12)']].map(([lbl, shadow]) => (
        <div key={lbl}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--color-secondary)', textTransform:'uppercase', marginBottom:8 }}>shadow="{lbl}"</div>
          <div style={{ background:'var(--color-bg)', borderRadius:r.scale[2], padding:s.baseUnit * 5, minWidth:200, boxShadow:shadow, border:'1px solid var(--color-border)' }}>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:6, fontFamily:font + ',sans-serif' }}>Card title</div>
            <div style={{ fontSize:13, color:c.secondary, fontFamily:font + ',sans-serif', lineHeight:1.5 }}>Supporting content goes here.</div>
          </div>
        </div>
      ))}
    </div>
  );

  if (meta.component === 'Typography') return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {[
        { lbl:'h1', size:ty.scale[5], w:600 }, { lbl:'h2', size:ty.scale[4], w:600 },
        { lbl:'h3', size:ty.scale[3], w:500 }, { lbl:'body', size:ty.scale[2], w:400 },
        { lbl:'small', size:ty.scale[1], w:400 }, { lbl:'caption', size:ty.scale[0], w:400 },
      ].map(v => (
        <div key={v.lbl}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--color-secondary)', textTransform:'uppercase', marginBottom:4 }}>{v.lbl}</div>
          <span style={{ fontSize:v.size, fontWeight:v.w, fontFamily:font + ',sans-serif' }}>The quick brown fox jumps</span>
        </div>
      ))}
    </div>
  );

  if (meta.component === 'Stack') return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:32 }}>
      {['column','row'].map(dir => (
        <div key={dir}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--color-secondary)', textTransform:'uppercase', marginBottom:8 }}>direction="{dir}"</div>
          <div style={{ display:'flex', flexDirection:dir, gap:s.baseUnit * 2 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background:c.primary, opacity:1 - i * 0.15, borderRadius:4, padding:'8px 16px', color:'#fff', fontSize:13, fontFamily:font + ',sans-serif' }}>Item {i}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return <div style={{ color:'var(--color-secondary)', fontSize:13 }}>No preview available</div>;
}

function ComponentPage({ meta }) {
  const doc = docs[meta.component];
  if (!doc) return null;
  const cn = meta.component;

  return (
    <div>
      <h1 style={{ fontSize:26, fontWeight:600, marginBottom:6 }}>{cn}</h1>
      <p style={{ fontSize:14, color:'var(--color-secondary)', marginBottom:28, lineHeight:1.6, maxWidth:600 }}>{doc.description}</p>

      <Tabs tabs={['Overview','Preview','Props','Code','Accessibility']}>
        <div>
          <MetaGrid meta={meta} />
          <BlockTitle mt={24}>Usage guidelines</BlockTitle>
          <ul style={{ paddingLeft:20, display:'flex', flexDirection:'column', gap:8 }}>
            {doc.usage.map((u, i) => <li key={i} style={{ fontSize:14, lineHeight:1.6 }}>{u}</li>)}
          </ul>
          <BlockTitle mt={24}>Design tokens</BlockTitle>
          {Object.entries(meta.tokens).map(([k, v]) => (
            <TokenRow key={k} name={k} value={v}>
              {v.startsWith('#') && <div style={{ width:20, height:20, borderRadius:4, background:v, border:'1px solid var(--color-border)', flexShrink:0 }} />}
            </TokenRow>
          ))}
        </div>

        <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:10, padding:32 }}>
          <ComponentPreview meta={meta} />
        </div>

        <PropsTable props={doc.props} />

        <div>
          <BlockTitle>Import</BlockTitle>
          <CodeBlock code={"import { " + cn + " } from './generated/components';"} />
          <BlockTitle mt={24}>Examples</BlockTitle>
          {doc.snippets.map((s, i) => (
            <div key={i} style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--color-secondary)', marginBottom:4 }}>{s.label}</div>
              <CodeBlock code={s.code} />
            </div>
          ))}
        </div>

        <div>
          <BlockTitle>Accessibility contract</BlockTitle>
          <ul style={{ paddingLeft:20, display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
            {[
              meta.accessibilityContract.keyboard ? 'Keyboard navigable' : 'Not keyboard navigable',
              meta.accessibilityContract.focusRing !== 'none' ? 'Focus ring: ' + meta.accessibilityContract.focusRing : 'No focus ring',
              meta.accessibilityContract.ariaLabel ? 'aria-label: ' + meta.accessibilityContract.ariaLabel : null,
            ].filter(Boolean).map((item, i) => <li key={i} style={{ fontSize:14, lineHeight:1.6 }}>{item}</li>)}
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
      <h1 style={{ fontSize:26, fontWeight:600, marginBottom:6 }}>Colors</h1>
      <p style={{ fontSize:14, color:'var(--color-secondary)', marginBottom:28 }}>Core color palette. Click any swatch to copy its hex value.</p>
      <BlockTitle>Color tokens</BlockTitle>
      <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
        {Object.entries(config.color).map(([name, value]) => (
          <div key={name} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, cursor:'pointer' }} onClick={() => navigator.clipboard.writeText(value)}>
            <div style={{ width:64, height:64, borderRadius:12, background:value, border:'1px solid var(--color-border)', transition:'transform .15s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
            <span style={{ fontSize:12, fontWeight:600 }}>{name}</span>
            <span style={{ fontSize:11, color:'var(--color-secondary)', fontFamily:'var(--font-mono)' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypographySection() {
  return (
    <div>
      <h1 style={{ fontSize:26, fontWeight:600, marginBottom:6 }}>Typography</h1>
      <p style={{ fontSize:14, color:'var(--color-secondary)', marginBottom:28 }}>Font: <strong>{config.typography.fontFamily}</strong></p>
      <BlockTitle>Type scale</BlockTitle>
      {config.typography.scale.map((size, i) => (
        <TokenRow key={i} name={"size" + (i+1)} value={size + "px"}>
          <span style={{ fontSize:size, fontFamily:config.typography.fontFamily + ',sans-serif', flex:1 }}>The quick brown fox</span>
        </TokenRow>
      ))}
    </div>
  );
}

function SpacingSection() {
  return (
    <div>
      <h1 style={{ fontSize:26, fontWeight:600, marginBottom:6 }}>Spacing</h1>
      <p style={{ fontSize:14, color:'var(--color-secondary)', marginBottom:28 }}>Base unit: <strong>{config.spacing.baseUnit}px</strong></p>
      <BlockTitle>Spacing scale</BlockTitle>
      {[1,2,3,4,5,6,8,10,12,16].map(m => {
        const val = m * config.spacing.baseUnit;
        return (
          <TokenRow key={m} name={"space" + m} value={val + "px"}>
            <div style={{ width:Math.min(val * 2, 240), height:16, background:'var(--color-primary)', borderRadius:2, flexShrink:0 }} />
          </TokenRow>
        );
      })}
    </div>
  );
}

function RadiusSection() {
  return (
    <div>
      <h1 style={{ fontSize:26, fontWeight:600, marginBottom:6 }}>Border Radius</h1>
      <p style={{ fontSize:14, color:'var(--color-secondary)', marginBottom:28 }}>Available border radius tokens.</p>
      <BlockTitle>Radius scale</BlockTitle>
      {config.radius.scale.map((r, i) => (
        <TokenRow key={i} name={"radius" + (i+1)} value={r + "px"}>
          <div style={{ width:40, height:40, background:'var(--color-primary)', borderRadius:r, opacity:.85, flexShrink:0 }} />
        </TokenRow>
      ))}
    </div>
  );
}

const NAV = [
  { group: 'Foundations' },
  { id: 'colors',     label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'spacing',    label: 'Spacing' },
  { id: 'radius',     label: 'Border Radius' },
  { group: 'Components' },
  ...metadata.map(m => ({ id: m.component.toLowerCase(), label: m.component })),
];

const SECTIONS = {
  colors:     <ColorsSection />,
  typography: <TypographySection />,
  spacing:    <SpacingSection />,
  radius:     <RadiusSection />,
  ...Object.fromEntries(metadata.map(m => [m.component.toLowerCase(), <ComponentPage key={m.component} meta={m} />])),
};

export function App() {
  const [active, setActive] = useState('colors');
  const [dark, setDark] = useState(false);

  return (
    <div className={dark ? 'dark' : ''} style={{ display:'flex', minHeight:'100vh', background:'var(--color-bg)', color:'var(--color-text)', fontFamily:'var(--font)' }}>
      <nav style={{ width:'var(--sidebar-width)', background:'var(--color-surface)', borderRight:'1px solid var(--color-border)', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, overflowY:'auto' }}>
        <div style={{ padding:'18px 16px', borderBottom:'1px solid var(--color-border)' }}>
          <div style={{ fontSize:16, fontWeight:600, color:'var(--color-primary)' }}>Design System</div>
          <div style={{ fontSize:11, color:'var(--color-secondary)', marginTop:2 }}>Generated by dsgen</div>
        </div>
        {NAV.map((item, i) =>
          item.group ? (
            <div key={i} style={{ padding:'16px 8px 4px', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--color-secondary)' }}>{item.group}</div>
          ) : (
            <button key={item.id} onClick={() => setActive(item.id)} style={{
              display:'block', width:'100%', padding:'7px 10px', margin:'1px 0',
              borderRadius:6, fontSize:13, fontWeight:500, textAlign:'left', border:'none',
              cursor:'pointer', fontFamily:'inherit', transition:'background .12s',
              background: active === item.id ? 'var(--color-primary)' : 'transparent',
              color: active === item.id ? '#fff' : 'var(--color-text)',
            }}>{item.label}</button>
          )
        )}
      </nav>

      <div style={{ position:'fixed', top:0, left:'var(--sidebar-width)', right:0, height:'var(--topbar-height)', background:'var(--color-bg)', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'0 32px', zIndex:10 }}>
        <button onClick={() => setDark(d => !d)} style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', color:'var(--color-text)', padding:'5px 14px', borderRadius:20, fontSize:12, fontFamily:'inherit', fontWeight:500, cursor:'pointer' }}>
          {dark ? 'Light' : 'Dark'}
        </button>
      </div>

      <main style={{ marginLeft:'var(--sidebar-width)', flex:1, padding:'calc(var(--topbar-height) + 40px) 48px 64px', maxWidth:900 }}>
        {SECTIONS[active]}
      </main>
    </div>
  );
}
`;
}
