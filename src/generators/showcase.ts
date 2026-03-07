import * as path from "path";
import * as fs from "fs-extra";
import {
  DesignSystemConfig,
  GovernanceRules,
  ComponentMetadata,
  ResolvedTokens,
} from "../types";
import { resolveTokens } from "../utils/resolve-tokens";

export async function generateShowcase(
  config: DesignSystemConfig,
  rules: GovernanceRules,
  metadata: ComponentMetadata[],
  outputDir: string,
): Promise<string> {
  const showcaseDir = path.join(outputDir, "showcase");
  await fs.ensureDir(showcaseDir);
  return generateHTML(config, rules, metadata, showcaseDir);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropRow {
  name: string;
  type: string;
  default: string;
  description: string;
  required?: boolean;
  wcag?: string; // WCAG success criterion or note
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
  a11y: A11yItem[]; // structured WCAG checklist
}
interface A11yItem {
  criterion: string; // e.g. "1.3.1 Info and Relationships"
  level: "A" | "AA" | "AAA";
  description: string;
  status: "pass" | "note";
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

// Converts a camelCase token key to its CSS custom property name.
// e.g. colorPrimary → --color-primary, borderRadius → --border-radius
function tokenToCssVar(key: string): string {
  const kebab = key.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
  return `--${kebab}`;
}

// ─── Shared CSS ───────────────────────────────────────────────────────────────
// Single definition — used verbatim by HTML (<style>) and Vite (styles.css).
// Both formats load exactly the same stylesheet.

function buildCSS(t: ResolvedTokens): string {
  return [
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
    `[data-theme='dark'], .dark {`,
    `  --color-bg:      ${t.darkBackground};`,
    `  --color-text:    ${t.darkText};`,
    `  --color-surface: ${t.darkSurface};`,
    `  --color-border:  ${t.darkBorder};`,
    `  --color-code-bg: ${t.darkCodeBg};`,
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
    `.token-name { font-family: var(--font-mono); font-size: var(--font-size-ui-sm); color: var(--color-primary); width: 220px; flex-shrink: 0; }`,
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
    `.prop-required { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--color-danger); background: color-mix(in srgb, var(--color-danger) 10%, transparent); border: 1px solid color-mix(in srgb, var(--color-danger) 25%, transparent); border-radius: var(--radius-sm); padding: 1px 5px; margin-left: var(--space-xs); vertical-align: middle; line-height: 1.6; }`,
    `.snippet-panel { position: relative; background: var(--color-code-bg); border-radius: var(--radius-lg); border: 1px solid var(--color-border); padding: var(--space-lg); margin-top: var(--space-sm); }`,
    `.snippet-panel pre { overflow-x: auto; }`,
    `.snippet-panel code { font-family: var(--font-mono); font-size: var(--font-size-ui-sm); line-height: 1.7; white-space: pre; }`,
    `.snippet-label { font-size: var(--font-size-ui-sm); font-weight: var(--font-weight-bold); color: var(--color-secondary); margin-bottom: var(--space-xs); }`,
    `.snippet-copy { position: absolute; top: var(--space-sm); right: var(--space-sm); }`,
    `.preview-area { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg) var(--radius-lg) 0 0; padding: var(--space-2xl); display: flex; flex-wrap: wrap; gap: var(--space-xl); align-items: flex-start; border-bottom: none; }`,
    `.preview-item { display: flex; flex-direction: column; gap: var(--space-sm); align-items: flex-start; }`,
    `.preview-label { font-size: var(--font-size-ui-xs); font-weight: var(--font-weight-bold); color: var(--color-secondary); text-transform: uppercase; letter-spacing: .06em; }`,
    `.preview-code-block { border-radius: 0 0 var(--radius-lg) var(--radius-lg); border: 1px solid var(--color-border); border-top: none; margin-bottom: var(--space-xl); }`,
    `.preview-code-block .snippet-panel { border-radius: 0 0 var(--radius-lg) var(--radius-lg); border: none; margin-top: 0; }`,
    `.example-block { margin-bottom: var(--space-xl); }`,
    `.example-block:last-child { margin-bottom: 0; }`,
    `.a11y-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-ui-md); margin-bottom: var(--space-xl); }`,
    `.a11y-table th { text-align: left; padding: var(--space-sm) var(--space-md); font-size: var(--font-size-ui-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: .06em; color: var(--color-secondary); border-bottom: 2px solid var(--color-border); }`,
    `.a11y-table td { padding: var(--space-sm) var(--space-md); border-bottom: 1px solid var(--color-border); vertical-align: top; line-height: 1.5; }`,
    `.a11y-level { display: inline-block; font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: var(--radius-sm); font-family: var(--font-mono); }`,
    `.a11y-level.A { background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary); }`,
    `.a11y-level.AA { background: color-mix(in srgb, var(--color-success) 12%, transparent); color: var(--color-success); }`,
    `.a11y-level.AAA { background: color-mix(in srgb, var(--color-secondary) 12%, transparent); color: var(--color-secondary); }`,
    `.a11y-pass::before { content: '✓ '; color: var(--color-success); font-weight: 700; }`,
    `.a11y-note::before { content: '◎ '; color: var(--color-secondary); font-weight: 700; }`,
    `.a11y-list { padding-left: var(--space-xl); display: flex; flex-direction: column; gap: var(--space-sm); }`,
    `.a11y-list li { font-size: var(--font-size-sm); line-height: 1.6; }`,
    `.copy-btn { font-size: var(--font-size-ui-xs); font-family: var(--font); font-weight: var(--font-weight-md); padding: var(--space-xs) var(--space-md); border-radius: var(--radius-sm); border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-secondary); cursor: pointer; transition: all var(--duration-fast) var(--easing); white-space: nowrap; }`,
    `.copy-btn:hover { background: var(--color-primary); color: var(--color-on-primary); border-color: var(--color-primary); }`,
    `.copy-btn.copied { background: var(--color-success); color: var(--color-on-primary); border-color: var(--color-success); }`,
    `.toast { position: fixed; bottom: var(--space-xl); right: var(--space-xl); background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); box-shadow: var(--shadow-md); padding: var(--space-sm) var(--space-lg); border-radius: var(--radius-lg); font-size: var(--font-size-ui-md); font-weight: var(--font-weight-md); opacity: 0; transform: translateY(var(--space-xs)); transition: opacity var(--duration) var(--easing), transform var(--duration) var(--easing); pointer-events: none; z-index: 100; }`,
    `.toast.show { opacity: 1; transform: none; }`,
  ].join("\n");
}

// ─── Docs ─────────────────────────────────────────────────────────────────────

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
          description: "Visual style and semantic weight of the button",
          required: false,
        },
        {
          name: "children",
          type: "ReactNode",
          default: "—",
          description: "Button label or content",
          required: true,
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Prevents interaction and dims the button",
          required: false,
          wcag: "WCAG 1.4.3 — disabled buttons are exempt from contrast requirements",
        },
        {
          name: "aria-label",
          type: "string",
          default: "—",
          description:
            "Required for icon-only buttons. Overrides visible text for screen readers.",
          required: false,
          wcag: "WCAG 4.1.2 — required when button has no visible text label",
        },
        {
          name: "onClick",
          type: "(e: MouseEvent) => void",
          default: "—",
          description: "Click handler",
          required: false,
        },
        {
          name: "type",
          type: '"button" | "submit" | "reset"',
          default: '"button"',
          description:
            "Always set explicitly inside a <form> to prevent accidental submission",
          required: false,
          wcag: "WCAG 3.2.2 — predictable behavior on interaction",
        },
      ],
      snippets: [
        {
          label: "Variants",
          code: `<Stack direction="row" gap={2}>\n  <Button variant="primary">Save changes</Button>\n  <Button variant="secondary">Cancel</Button>\n  <Button variant="danger">Delete</Button>\n</Stack>`,
        },
        {
          label: "Disabled state",
          code: `<Stack direction="row" gap={2}>\n  <Button variant="primary" disabled>Processing…</Button>\n  <Button variant="secondary" disabled>Unavailable</Button>\n</Stack>`,
        },
        {
          label: "Icon-only (accessible)",
          code: `<Button variant="secondary" aria-label="Close dialog">✕</Button>`,
        },
        {
          label: "Form submit",
          code: `<Stack direction="row" gap={2} justify="flex-end">\n  <Button type="button" variant="secondary">Cancel</Button>\n  <Button type="submit" variant="primary">Create account</Button>\n</Stack>`,
        },
        {
          label: "Danger confirmation",
          code: `<Stack direction="row" gap={2}>\n  <Button variant="secondary">Keep account</Button>\n  <Button variant="danger" aria-label="Permanently delete account">Delete account</Button>\n</Stack>`,
        },
      ],
      a11y: [
        {
          criterion: "1.3.1 Info and Relationships",
          level: "A",
          description:
            "Uses a native <button> element — role=button and keyboard interaction are automatic.",
          status: "pass",
        },
        {
          criterion: "1.4.3 Contrast (Minimum)",
          level: "AA",
          description:
            "All variant colours are chosen to meet 4.5:1 contrast ratio against their background. Disabled buttons are exempt.",
          status: "pass",
        },
        {
          criterion: "2.1.1 Keyboard",
          level: "A",
          description:
            "Activatable with Enter and Space. Focus is managed by the browser natively via <button>.",
          status: "pass",
        },
        {
          criterion: "2.4.7 Focus Visible",
          level: "AA",
          description:
            "A 3px focus ring is applied on :focus. Never suppress outline:none without a custom focus style.",
          status: "pass",
        },
        {
          criterion: "4.1.2 Name, Role, Value",
          level: "A",
          description:
            "For icon-only buttons, pass aria-label to provide an accessible name. Without it screen readers announce the icon character.",
          status: "note",
        },
      ],
    },
    Input: {
      description:
        "A labelled text input with support for hint text, validation error states, and required field marking. The label is always visible — placeholder alone is not sufficient for accessibility.",
      usage: [
        "Always provide a `label` prop — it renders a visible `<label>` element linked via `htmlFor`/`id`.",
        "Use `required` to mark mandatory fields — adds a visual indicator and sets `aria-required` on the input.",
        "Use `hint` for helper text shown below the field before the user interacts.",
        "Use `error` to show validation feedback — it replaces the hint and sets `aria-invalid`.",
        "Avoid disabling inputs unless necessary — prefer read-only or explanatory text instead.",
      ],
      props: [
        {
          name: "label",
          type: "string",
          default: "—",
          description: "Visible label text. Also used to derive the input id.",
          required: true,
          wcag: "WCAG 1.3.1, 3.3.2 — visible label is mandatory",
        },
        {
          name: "type",
          type: "string",
          default: '"text"',
          description:
            "HTML input type. Use the most specific type for the data (email, password, tel, number, url).",
          required: false,
          wcag: "WCAG 1.3.5 — correct type enables autofill and mobile keyboard",
        },
        {
          name: "required",
          type: "boolean",
          default: "false",
          description:
            "Marks the field as required. Adds a visual marker and sets aria-required on the input.",
          required: false,
          wcag: "WCAG 3.3.1, 3.3.2 — required fields must be identified before submission",
        },
        {
          name: "placeholder",
          type: "string",
          default: "—",
          description:
            "Supplementary placeholder — never a replacement for label. Disappears on input.",
          required: false,
          wcag: "WCAG 1.4.3 — placeholder colour must meet 4.5:1 contrast; never use as only label",
        },
        {
          name: "hint",
          type: "string",
          default: "—",
          description:
            "Helper text shown below the field. Linked via aria-describedby.",
          required: false,
        },
        {
          name: "error",
          type: "string",
          default: "—",
          description:
            "Validation error message. Sets aria-invalid and aria-describedby. Replaces hint when present.",
          required: false,
          wcag: "WCAG 3.3.1 — errors must be identified and described in text",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Disables the input",
          required: false,
        },
      ],
      snippets: [
        {
          label: "Basic",
          code: `<Input label="Full name" placeholder="Jane Smith" />`,
        },
        {
          label: "Required field",
          code: `<Input label="Email address" type="email" required placeholder="you@example.com" hint="We'll send a confirmation link here." />`,
        },
        {
          label: "Validation error",
          code: `<Input label="Password" type="password" required error="Password must be at least 8 characters." />`,
        },
        {
          label: "Full form row",
          code: `<Stack gap={3}>\n  <Input label="First name" required placeholder="Jane" />\n  <Input label="Last name" required placeholder="Smith" />\n  <Input label="Email" type="email" required hint="Used for login only." />\n  <Input label="Phone" type="tel" hint="Optional — for two-factor auth." />\n</Stack>`,
        },
        {
          label: "Disabled",
          code: `<Input label="Username" value="j.smith" disabled hint="Username cannot be changed." />`,
        },
      ],
      a11y: [
        {
          criterion: "1.3.1 Info and Relationships",
          level: "A",
          description:
            "Label element is linked to the input via htmlFor/id. Hint and error are linked via aria-describedby.",
          status: "pass",
        },
        {
          criterion: "1.3.5 Identify Input Purpose",
          level: "AA",
          description:
            "Use the correct type prop (email, tel, password, etc.) so browsers and autofill tools understand the field's purpose.",
          status: "note",
        },
        {
          criterion: "2.1.1 Keyboard",
          level: "A",
          description:
            "Inputs are natively focusable and operable. Tab moves focus in; the field is editable without a mouse.",
          status: "pass",
        },
        {
          criterion: "2.4.7 Focus Visible",
          level: "AA",
          description:
            "A 3px focus ring is applied on focus. Do not override with outline:none.",
          status: "pass",
        },
        {
          criterion: "3.3.1 Error Identification",
          level: "A",
          description:
            "Validation errors are conveyed in text via the error prop. aria-invalid is set to true. The error message is linked via aria-describedby and wrapped in role=alert.",
          status: "pass",
        },
        {
          criterion: "3.3.2 Labels or Instructions",
          level: "A",
          description:
            "Always pass a label. Required fields are marked visually and via aria-required. Pass hint for format instructions before submission.",
          status: "note",
        },
        {
          criterion: "4.1.2 Name, Role, Value",
          level: "A",
          description:
            "Input has a programmatic name via the linked label element. aria-invalid and aria-required reflect current state.",
          status: "pass",
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
          name: "children",
          type: "ReactNode",
          default: "—",
          description: "Card content",
          required: true,
        },
        {
          name: "shadow",
          type: '"none" | "small" | "medium"',
          default: '"small"',
          description: "Elevation shadow level",
          required: false,
        },
        {
          name: "as",
          type: "ElementType",
          default: '"div"',
          description:
            'Override the rendered HTML element. Use "article", "section", or "li" for semantic content.',
          required: false,
          wcag: "WCAG 1.3.1 — choose a semantic element when the card represents a meaningful document region",
        },
        {
          name: "style",
          type: "CSSProperties",
          default: "—",
          description:
            "Additional inline styles merged with token-based defaults",
          required: false,
        },
      ],
      snippets: [
        {
          label: "Basic",
          code: `<Card>\n  <Typography variant="h3">Card title</Typography>\n  <Typography variant="body">Supporting content goes here.</Typography>\n</Card>`,
        },
        {
          label: "Shadow levels",
          code: `<Stack direction="row" gap={4} wrap>\n  <Card shadow="none"><Typography variant="small">No shadow</Typography></Card>\n  <Card shadow="small"><Typography variant="small">Small shadow</Typography></Card>\n  <Card shadow="medium"><Typography variant="small">Medium shadow</Typography></Card>\n</Stack>`,
        },
        {
          label: "Article card",
          code: `<Card as="article" shadow="small">\n  <Typography variant="h2">Post title</Typography>\n  <Typography variant="small" style={{ color: 'var(--color-secondary)' }}>March 7, 2026</Typography>\n  <Typography variant="body">Article summary goes here…</Typography>\n</Card>`,
        },
        {
          label: "Action card",
          code: `<Card shadow="medium">\n  <Typography variant="h3">Upgrade your plan</Typography>\n  <Typography variant="body">Get unlimited projects and priority support.</Typography>\n  <Stack direction="row" gap={2} style={{ marginTop: '16px' }}>\n    <Button variant="primary">Upgrade now</Button>\n    <Button variant="secondary">Learn more</Button>\n  </Stack>\n</Card>`,
        },
        {
          label: "List of cards",
          code: `<Stack gap={3} as="ul" style={{ listStyle: 'none', padding: 0 }}>\n  <Card as="li"><Typography variant="body">Item one</Typography></Card>\n  <Card as="li"><Typography variant="body">Item two</Typography></Card>\n</Stack>`,
        },
      ],
      a11y: [
        {
          criterion: "1.3.1 Info and Relationships",
          level: "A",
          description:
            "By default renders as <div> with no implicit role. Use the as prop to choose a semantic element when the card represents a document section, article, or list item.",
          status: "note",
        },
        {
          criterion: "1.4.3 Contrast (Minimum)",
          level: "AA",
          description:
            "Background and border colours are derived from design tokens. Ensure text placed inside the card meets 4.5:1 contrast against the card background.",
          status: "note",
        },
        {
          criterion: "2.1.1 Keyboard",
          level: "A",
          description:
            "The Card container itself is not interactive. Any interactive children (buttons, links) are keyboard-operable.",
          status: "pass",
        },
        {
          criterion: "2.4.6 Headings and Labels",
          level: "AA",
          description:
            "Include a heading inside the card when it represents a distinct content region. This helps screen reader users navigate the page by landmark.",
          status: "note",
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
          name: "children",
          type: "ReactNode",
          default: "—",
          description: "Text content",
          required: true,
        },
        {
          name: "variant",
          type: '"h1" | "h2" | "h3" | "h4" | "body" | "small" | "caption"',
          default: '"body"',
          description: "Text style and default HTML element",
          required: false,
        },
        {
          name: "as",
          type: "ElementType",
          default: "—",
          description:
            "Override the rendered HTML element while keeping the variant's visual style",
          required: false,
          wcag: "WCAG 1.3.1 — use to fix heading hierarchy without changing visual size",
        },
        {
          name: "color",
          type: "string",
          default: "token: text",
          description:
            "Text color — accepts any CSS color value. Ensure contrast meets WCAG 1.4.3.",
          required: false,
          wcag: "WCAG 1.4.3 — min 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold)",
        },
      ],
      snippets: [
        {
          label: "Heading scale",
          code: `<Stack gap={3}>\n  <Typography variant="h1">H1 — Page title</Typography>\n  <Typography variant="h2">H2 — Section heading</Typography>\n  <Typography variant="h3">H3 — Subsection</Typography>\n  <Typography variant="h4">H4 — Group label</Typography>\n</Stack>`,
        },
        {
          label: "Body and captions",
          code: `<Stack gap={2}>\n  <Typography variant="body">Body text for paragraphs and descriptions.</Typography>\n  <Typography variant="small">Small — timestamps, metadata, secondary info.</Typography>\n  <Typography variant="caption">Caption — labels under images or inputs.</Typography>\n</Stack>`,
        },
        {
          label: "Colour overrides",
          code: `<Stack gap={2}>\n  <Typography variant="body" color="var(--color-primary)">Primary colour text</Typography>\n  <Typography variant="body" color="var(--color-secondary)">Secondary / muted text</Typography>\n  <Typography variant="body" color="var(--color-danger)">Danger / error text</Typography>\n</Stack>`,
        },
        {
          label: "Correct heading hierarchy",
          code: `{/* Page has one h1. Use as= to keep visual scale while fixing semantics. */}\n<Typography variant="h2" as="h3">Visual h2, semantic h3</Typography>`,
        },
      ],
      a11y: [
        {
          criterion: "1.3.1 Info and Relationships",
          level: "A",
          description:
            "Heading variants (h1–h4) render as native heading elements. Use the as prop to keep visual style while correcting semantic hierarchy.",
          status: "pass",
        },
        {
          criterion: "1.4.3 Contrast (Minimum)",
          level: "AA",
          description:
            "Default text colour (colorText) is chosen to meet 4.5:1 against colorBackground. Overriding the color prop is your responsibility.",
          status: "note",
        },
        {
          criterion: "1.4.4 Resize Text",
          level: "AA",
          description:
            "Font sizes use px units derived from the config scale. Users can override with browser zoom.",
          status: "pass",
        },
        {
          criterion: "2.4.6 Headings and Labels",
          level: "AA",
          description:
            "Use one h1 per page. Don't skip heading levels — h1 → h2 → h3. Use the as prop to fix hierarchy without changing visual size.",
          status: "note",
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
          name: "children",
          type: "ReactNode",
          default: "—",
          description: "Items to lay out",
          required: true,
        },
        {
          name: "direction",
          type: '"row" | "column"',
          default: '"column"',
          description: "Main axis direction",
          required: false,
        },
        {
          name: "gap",
          type: "number",
          default: "2",
          description: `Spacing multiplier — 1 unit = ${t.spaceXs}`,
          required: false,
        },
        {
          name: "align",
          type: 'CSSProperties["alignItems"]',
          default: '"stretch"',
          description: "Cross-axis alignment",
          required: false,
        },
        {
          name: "justify",
          type: 'CSSProperties["justifyContent"]',
          default: '"flex-start"',
          description: "Main-axis alignment",
          required: false,
        },
        {
          name: "wrap",
          type: "boolean",
          default: "false",
          description: "Allow children to wrap to a new line",
          required: false,
        },
        {
          name: "as",
          type: "ElementType",
          default: '"div"',
          description:
            'HTML element to render as. Use "ul"/"ol" for lists, "nav" for navigation.',
          required: false,
          wcag: "WCAG 1.3.1 — choose a semantic element when the group has meaning",
        },
      ],
      snippets: [
        {
          label: "Vertical form",
          code: `<Stack gap={3}>\n  <Input label="First name" required />\n  <Input label="Last name" required />\n  <Input label="Email" type="email" required />\n  <Button type="submit" variant="primary">Create account</Button>\n</Stack>`,
        },
        {
          label: "Horizontal button group",
          code: `<Stack direction="row" gap={2} align="center" justify="flex-end">\n  <Button variant="secondary">Cancel</Button>\n  <Button variant="primary">Save changes</Button>\n</Stack>`,
        },
        {
          label: "Centred hero",
          code: `<Stack gap={3} align="center" style={{ textAlign: 'center', padding: '64px 0' }}>\n  <Typography variant="h1">Welcome</Typography>\n  <Typography variant="body" color="var(--color-secondary)">Get started in seconds.</Typography>\n  <Button variant="primary">Sign up free</Button>\n</Stack>`,
        },
        {
          label: "Wrapping card grid",
          code: `<Stack direction="row" gap={4} wrap>\n  <Card shadow="small"><Typography variant="h3">Card A</Typography></Card>\n  <Card shadow="small"><Typography variant="h3">Card B</Typography></Card>\n  <Card shadow="small"><Typography variant="h3">Card C</Typography></Card>\n</Stack>`,
        },
      ],
      a11y: [
        {
          criterion: "1.3.1 Info and Relationships",
          level: "A",
          description:
            "Stack renders as a plain <div> by default. Use the as prop when the group has semantic meaning — e.g. as='ul' for a list, as='nav' for navigation.",
          status: "note",
        },
        {
          criterion: "1.3.4 Orientation",
          level: "AA",
          description:
            "Supports both row and column layouts. Do not lock orientation unless essential — wrap=true allows reflow on narrow viewports.",
          status: "pass",
        },
        {
          criterion: "2.1.1 Keyboard",
          level: "A",
          description:
            "Stack itself is not interactive. All interactive children remain keyboard-operable regardless of layout direction.",
          status: "pass",
        },
        {
          criterion: "2.4.3 Focus Order",
          level: "A",
          description:
            "Focus order follows DOM order, which matches visual order when using direction='column'. For direction='row', ensure DOM order matches the visual sequence.",
          status: "note",
        },
      ],
    },
  };
}

// ─── Per-snippet preview builder ─────────────────────────────────────────────
// Returns an HTML string for a single snippet's live preview, or null if no
// visual preview is meaningful for that snippet (e.g. comment-only code).

function buildSnippetPreview(
  meta: ComponentMetadata,
  snippet: Snippet,
  t: ResolvedTokens,
  bv: string[],
): string | null {
  const cn = meta.component;

  if (cn === "Button") {
    if (snippet.label === "Variants") {
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
            `padding:${t.spaceSm} ${t.spaceLg};border-radius:${t.radiusMd};font-size:${t.fontSizeMd};` +
            `font-weight:${t.fontWeightMedium};cursor:pointer;font-family:${t.fontFamily},sans-serif">` +
            `${v.charAt(0).toUpperCase() + v.slice(1)}</button>` +
            `</div>`
          );
        })
        .join("");
    }
    if (snippet.label === "Disabled state") {
      return bv
        .slice(0, 2)
        .map((v) => {
          const bg = v === "primary" ? t.colorPrimary : t.colorSecondary;
          return (
            `<div class="preview-item">` +
            `<div class="preview-label">${v} disabled</div>` +
            `<button disabled style="background:${bg};color:${t.colorOnPrimary};opacity:0.45;` +
            `border:${t.borderWidth} solid transparent;padding:${t.spaceSm} ${t.spaceLg};` +
            `border-radius:${t.radiusMd};font-size:${t.fontSizeMd};font-weight:${t.fontWeightMedium};` +
            `cursor:not-allowed;font-family:${t.fontFamily},sans-serif">` +
            `${v === "primary" ? "Processing…" : "Unavailable"}` +
            `</button>` +
            `</div>`
          );
        })
        .join("");
    }
    if (snippet.label === "Icon-only (accessible)") {
      return (
        `<div class="preview-item">` +
        `<div class="preview-label">icon-only</div>` +
        `<button aria-label="Close dialog" style="background:${t.colorSecondary};color:${t.colorOnPrimary};` +
        `border:${t.borderWidth} solid transparent;padding:${t.spaceSm} ${t.spaceLg};` +
        `border-radius:${t.radiusMd};font-size:${t.fontSizeMd};cursor:pointer;font-family:${t.fontFamily},sans-serif">✕</button>` +
        `</div>`
      );
    }
    if (snippet.label === "Form submit") {
      return (
        `<div class="preview-item">` +
        `<div class="preview-label">button row</div>` +
        `<div style="display:flex;gap:${t.spaceSm}">` +
        `<button style="background:${t.colorSecondary};color:${t.colorOnPrimary};border:${t.borderWidth} solid transparent;` +
        `padding:${t.spaceSm} ${t.spaceLg};border-radius:${t.radiusMd};font-size:${t.fontSizeMd};` +
        `font-weight:${t.fontWeightMedium};cursor:pointer;font-family:${t.fontFamily},sans-serif">Cancel</button>` +
        `<button style="background:${t.colorPrimary};color:${t.colorOnPrimary};border:${t.borderWidth} solid transparent;` +
        `padding:${t.spaceSm} ${t.spaceLg};border-radius:${t.radiusMd};font-size:${t.fontSizeMd};` +
        `font-weight:${t.fontWeightMedium};cursor:pointer;font-family:${t.fontFamily},sans-serif">Create account</button>` +
        `</div></div>`
      );
    }
    if (snippet.label === "Danger confirmation") {
      return (
        `<div class="preview-item">` +
        `<div class="preview-label">destructive confirm</div>` +
        `<div style="display:flex;gap:${t.spaceSm}">` +
        `<button style="background:${t.colorSecondary};color:${t.colorOnPrimary};border:${t.borderWidth} solid transparent;` +
        `padding:${t.spaceSm} ${t.spaceLg};border-radius:${t.radiusMd};font-size:${t.fontSizeMd};` +
        `font-weight:${t.fontWeightMedium};cursor:pointer;font-family:${t.fontFamily},sans-serif">Keep account</button>` +
        `<button style="background:${t.colorDanger};color:${t.colorOnPrimary};border:${t.borderWidth} solid transparent;` +
        `padding:${t.spaceSm} ${t.spaceLg};border-radius:${t.radiusMd};font-size:${t.fontSizeMd};` +
        `font-weight:${t.fontWeightMedium};cursor:pointer;font-family:${t.fontFamily},sans-serif">Delete account</button>` +
        `</div></div>`
      );
    }
  }

  if (cn === "Input") {
    const inputStyle =
      `padding:${t.spaceSm} ${t.spaceMd};border:${t.borderWidth} solid ${t.colorSecondary};` +
      `border-radius:${t.radiusMd};font-size:${t.fontSizeMd};font-family:${t.fontFamily},sans-serif;` +
      `width:100%;outline:none;background:var(--color-bg);color:var(--color-text)`;
    const labelStyle = `font-size:${t.fontSizeMd};font-weight:${t.fontWeightMedium};font-family:${t.fontFamily},sans-serif;color:${t.colorText}`;
    const hintStyle = `font-size:${t.fontSizeSm};color:${t.colorSecondary};font-family:${t.fontFamily},sans-serif`;
    const errorStyle = `font-size:${t.fontSizeSm};color:${t.colorDanger};font-family:${t.fontFamily},sans-serif`;
    const reqMark = `<span style="color:${t.colorDanger};margin-left:3px;font-weight:700" aria-hidden="true">*</span>`;

    if (snippet.label === "Basic") {
      return (
        `<div class="preview-item" style="min-width:260px"><div class="preview-label">basic</div>` +
        `<div style="display:flex;flex-direction:column;gap:${t.spaceXs};width:100%">` +
        `<label style="${labelStyle}">Full name</label>` +
        `<input type="text" placeholder="Jane Smith" style="${inputStyle}" />` +
        `</div></div>`
      );
    }
    if (snippet.label === "Required field") {
      return (
        `<div class="preview-item" style="min-width:260px"><div class="preview-label">required</div>` +
        `<div style="display:flex;flex-direction:column;gap:${t.spaceXs};width:100%">` +
        `<label style="${labelStyle}">Email address${reqMark}</label>` +
        `<input type="email" placeholder="you@example.com" aria-required="true" style="${inputStyle}" />` +
        `<span style="${hintStyle}">We'll send a confirmation link here.</span>` +
        `</div></div>`
      );
    }
    if (snippet.label === "Validation error") {
      return (
        `<div class="preview-item" style="min-width:260px"><div class="preview-label">error state</div>` +
        `<div style="display:flex;flex-direction:column;gap:${t.spaceXs};width:100%">` +
        `<label style="${labelStyle}">Password${reqMark}</label>` +
        `<input type="password" aria-invalid="true" aria-required="true" style="${inputStyle.replace(t.colorSecondary, t.colorDanger)}" />` +
        `<span role="alert" style="${errorStyle}">Password must be at least 8 characters.</span>` +
        `</div></div>`
      );
    }
    if (snippet.label === "Disabled") {
      return (
        `<div class="preview-item" style="min-width:260px"><div class="preview-label">disabled</div>` +
        `<div style="display:flex;flex-direction:column;gap:${t.spaceXs};width:100%">` +
        `<label style="${labelStyle};opacity:0.5">Username</label>` +
        `<input type="text" value="j.smith" disabled style="${inputStyle};opacity:0.5;cursor:not-allowed" />` +
        `<span style="${hintStyle}">Username cannot be changed.</span>` +
        `</div></div>`
      );
    }
    // "Full form row" — too complex to render inline, skip preview
    return null;
  }

  if (cn === "Card") {
    if (snippet.label === "Basic") {
      return (
        `<div class="preview-item">` +
        `<div class="preview-label">basic card</div>` +
        `<div style="background:var(--color-bg);border-radius:${t.radiusLg};padding:${t.spaceXl};` +
        `min-width:200px;box-shadow:${t.shadowSmall};border:${t.borderWidth} solid var(--color-border)">` +
        `<div style="font-size:${t.fontSizeLg};font-weight:${t.fontWeightSemibold};margin-bottom:${t.spaceXs};font-family:${t.fontFamily},sans-serif">Card title</div>` +
        `<div style="font-size:${t.fontSizeSm};color:${t.colorSecondary};font-family:${t.fontFamily},sans-serif;line-height:${t.lineHeightNormal}">Supporting content goes here.</div>` +
        `</div></div>`
      );
    }
    if (snippet.label === "Shadow levels") {
      return (["none", "small", "medium"] as const)
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
            `min-width:160px;box-shadow:${shadow};border:${t.borderWidth} solid var(--color-border)">` +
            `<div style="font-size:${t.fontSizeSm};color:${t.colorSecondary};font-family:${t.fontFamily},sans-serif">${s} shadow</div>` +
            `</div></div>`
          );
        })
        .join("");
    }
    if (snippet.label === "Action card") {
      return (
        `<div class="preview-item">` +
        `<div class="preview-label">action card</div>` +
        `<div style="background:var(--color-bg);border-radius:${t.radiusLg};padding:${t.spaceXl};` +
        `min-width:240px;box-shadow:${t.shadowMedium};border:${t.borderWidth} solid var(--color-border)">` +
        `<div style="font-size:${t.fontSizeLg};font-weight:${t.fontWeightSemibold};margin-bottom:${t.spaceXs};font-family:${t.fontFamily},sans-serif">Upgrade your plan</div>` +
        `<div style="font-size:${t.fontSizeSm};color:${t.colorSecondary};margin-bottom:${t.spaceLg};font-family:${t.fontFamily},sans-serif;line-height:${t.lineHeightNormal}">Get unlimited projects.</div>` +
        `<div style="display:flex;gap:${t.spaceSm}">` +
        `<button style="background:${t.colorPrimary};color:${t.colorOnPrimary};border:none;padding:${t.spaceSm} ${t.spaceLg};border-radius:${t.radiusMd};font-size:${t.fontSizeSm};cursor:pointer;font-family:${t.fontFamily},sans-serif">Upgrade now</button>` +
        `<button style="background:${t.colorSecondary};color:${t.colorOnPrimary};border:none;padding:${t.spaceSm} ${t.spaceLg};border-radius:${t.radiusMd};font-size:${t.fontSizeSm};cursor:pointer;font-family:${t.fontFamily},sans-serif">Learn more</button>` +
        `</div></div></div>`
      );
    }
    // article and list cards: structural only, skip inline preview
    return null;
  }

  if (cn === "Typography") {
    if (snippet.label === "Heading scale") {
      return (
        `<div style="display:flex;flex-direction:column;gap:${t.spaceMd};width:100%">` +
        [
          {
            v: "h1",
            size: t.fontSize2xl,
            weight: t.fontWeightSemibold,
            lh: t.lineHeightTight,
            text: "H1 — Page title",
          },
          {
            v: "h2",
            size: t.fontSizeXl,
            weight: t.fontWeightSemibold,
            lh: t.lineHeightTight,
            text: "H2 — Section heading",
          },
          {
            v: "h3",
            size: t.fontSizeLg,
            weight: t.fontWeightMedium,
            lh: t.lineHeightSnug,
            text: "H3 — Subsection",
          },
          {
            v: "h4",
            size: t.fontSizeMd,
            weight: t.fontWeightMedium,
            lh: t.lineHeightSnug,
            text: "H4 — Group label",
          },
        ]
          .map(
            (r) =>
              `<div class="preview-item">` +
              `<div class="preview-label">${r.v}</div>` +
              `<span style="font-size:${r.size};font-weight:${r.weight};line-height:${r.lh};font-family:${t.fontFamily},sans-serif">${r.text}</span>` +
              `</div>`,
          )
          .join("") +
        `</div>`
      );
    }
    if (snippet.label === "Body and captions") {
      return (
        `<div style="display:flex;flex-direction:column;gap:${t.spaceMd};width:100%">` +
        [
          {
            v: "body",
            size: t.fontSizeMd,
            weight: t.fontWeightRegular,
            lh: t.lineHeightNormal,
            text: "Body text for paragraphs and descriptions.",
          },
          {
            v: "small",
            size: t.fontSizeSm,
            weight: t.fontWeightRegular,
            lh: t.lineHeightLoose,
            text: "Small — timestamps, metadata, secondary info.",
          },
          {
            v: "caption",
            size: t.fontSizeXs,
            weight: t.fontWeightRegular,
            lh: t.lineHeightLoose,
            text: "Caption — labels under images or inputs.",
          },
        ]
          .map(
            (r) =>
              `<div class="preview-item">` +
              `<div class="preview-label">${r.v}</div>` +
              `<span style="font-size:${r.size};font-weight:${r.weight};line-height:${r.lh};font-family:${t.fontFamily},sans-serif">${r.text}</span>` +
              `</div>`,
          )
          .join("") +
        `</div>`
      );
    }
    if (snippet.label === "Colour overrides") {
      return (
        `<div style="display:flex;flex-direction:column;gap:${t.spaceMd}">` +
        [
          {
            color: t.colorPrimary,
            label: "primary",
            text: "Primary colour text",
          },
          {
            color: t.colorSecondary,
            label: "secondary",
            text: "Secondary / muted text",
          },
          {
            color: t.colorDanger,
            label: "danger",
            text: "Danger / error text",
          },
        ]
          .map(
            (r) =>
              `<div class="preview-item">` +
              `<div class="preview-label">${r.label}</div>` +
              `<span style="font-size:${t.fontSizeMd};font-weight:${t.fontWeightRegular};font-family:${t.fontFamily},sans-serif;color:${r.color}">${r.text}</span>` +
              `</div>`,
          )
          .join("") +
        `</div>`
      );
    }
    return null;
  }

  if (cn === "Stack") {
    if (snippet.label === "Horizontal button group") {
      return (
        `<div class="preview-item">` +
        `<div class="preview-label">row · justify-end</div>` +
        `<div style="display:flex;gap:${t.spaceSm};justify-content:flex-end;width:300px">` +
        `<button style="background:${t.colorSecondary};color:${t.colorOnPrimary};border:none;padding:${t.spaceSm} ${t.spaceLg};border-radius:${t.radiusMd};font-size:${t.fontSizeSm};cursor:pointer;font-family:${t.fontFamily},sans-serif">Cancel</button>` +
        `<button style="background:${t.colorPrimary};color:${t.colorOnPrimary};border:none;padding:${t.spaceSm} ${t.spaceLg};border-radius:${t.radiusMd};font-size:${t.fontSizeSm};cursor:pointer;font-family:${t.fontFamily},sans-serif">Save changes</button>` +
        `</div></div>`
      );
    }
    if (snippet.label === "Centred hero") {
      return (
        `<div class="preview-item" style="width:100%">` +
        `<div class="preview-label">centred column</div>` +
        `<div style="display:flex;flex-direction:column;align-items:center;gap:${t.spaceMd};padding:${t.spaceXl};background:var(--color-surface);border-radius:${t.radiusLg};width:100%;text-align:center">` +
        `<span style="font-size:${t.fontSize2xl};font-weight:${t.fontWeightSemibold};font-family:${t.fontFamily},sans-serif">Welcome</span>` +
        `<span style="font-size:${t.fontSizeMd};color:${t.colorSecondary};font-family:${t.fontFamily},sans-serif">Get started in seconds.</span>` +
        `<button style="background:${t.colorPrimary};color:${t.colorOnPrimary};border:none;padding:${t.spaceSm} ${t.spaceLg};border-radius:${t.radiusMd};font-size:${t.fontSizeSm};cursor:pointer;font-family:${t.fontFamily},sans-serif">Sign up free</button>` +
        `</div></div>`
      );
    }
    if (snippet.label === "Wrapping card grid") {
      return (
        `<div class="preview-item" style="width:100%">` +
        `<div class="preview-label">row · wrap</div>` +
        `<div style="display:flex;flex-wrap:wrap;gap:${t.spaceLg}">` +
        ["Card A", "Card B", "Card C"]
          .map(
            (label) =>
              `<div style="background:var(--color-bg);border-radius:${t.radiusLg};padding:${t.spaceLg} ${t.spaceXl};` +
              `box-shadow:${t.shadowSmall};border:${t.borderWidth} solid var(--color-border);` +
              `font-size:${t.fontSizeMd};font-weight:${t.fontWeightMedium};font-family:${t.fontFamily},sans-serif">${label}</div>`,
          )
          .join("") +
        `</div></div>`
      );
    }
    // Vertical form — skip, too tall for inline
    return null;
  }

  return null;
}

// ─── Shared full-component preview builder ────────────────────────────────────
// Returns all states at once — used for the Overview tab's token section.

function buildPreview(
  meta: ComponentMetadata,
  t: ResolvedTokens,
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
          `<button style="background:${bg};color:${t.colorOnPrimary};` +
          `border:${t.borderWidth} solid transparent;padding:${t.spaceSm} ${t.spaceLg};` +
          `border-radius:${t.radiusMd};font-size:${t.fontSizeMd};font-weight:${t.fontWeightMedium};` +
          `cursor:pointer;font-family:${t.fontFamily},sans-serif;line-height:${t.lineHeightTight};` +
          `transition:opacity ${t.duration} ${t.easing}">` +
          `${v.charAt(0).toUpperCase() + v.slice(1)}</button>` +
          `</div>`
        );
      })
      .join("");
  }

  if (meta.component === "Input") {
    const field = (
      label: string,
      type: string,
      ph: string,
      borderColor: string,
      msg: string,
      msgColor: string,
      required: boolean,
    ) => {
      const reqMark = required
        ? `<span style="color:${t.colorDanger};margin-left:3px;font-weight:700" aria-hidden="true">*</span>`
        : "";
      const reqAttr = required ? ' aria-required="true"' : "";
      return (
        `<div class="preview-item" style="min-width:240px">` +
        `<div class="preview-label">${label}</div>` +
        `<div style="display:flex;flex-direction:column;gap:${t.spaceXs};width:100%">` +
        `<label style="font-size:${t.fontSizeMd};font-weight:${t.fontWeightMedium};font-family:${t.fontFamily},sans-serif;color:${t.colorText}">` +
        (label === "Default"
          ? "Email address"
          : label === "Required"
            ? `Full name${reqMark}`
            : "Password") +
        `</label>` +
        `<input type="${type}" placeholder="${ph}"${reqAttr} style="padding:${t.spaceSm} ${t.spaceMd};` +
        `border:${t.borderWidth} solid ${borderColor};border-radius:${t.radiusMd};` +
        `font-size:${t.fontSizeMd};font-family:${t.fontFamily},sans-serif;` +
        `width:100%;outline:none;background:var(--color-bg);color:var(--color-text)" />` +
        `<span style="font-size:${t.fontSizeSm};color:${msgColor};font-family:${t.fontFamily},sans-serif">${msg}</span>` +
        `</div></div>`
      );
    };
    return (
      field(
        "Default",
        "email",
        "you@example.com",
        t.colorSecondary,
        "We will never share your email.",
        t.colorSecondary,
        false,
      ) +
      field(
        "Required",
        "text",
        "Jane Smith",
        t.colorSecondary,
        "Required field — marked with *",
        t.colorSecondary,
        true,
      ) +
      field(
        "Error",
        "password",
        "••••••••",
        t.colorDanger,
        "Password is required",
        t.colorDanger,
        false,
      )
    );
  }

  if (meta.component === "Card") {
    return (["none", "small", "medium"] as const)
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
          `<div style="font-size:${t.fontSizeLg};font-weight:${t.fontWeightSemibold};` +
          `margin-bottom:${t.spaceXs};font-family:${t.fontFamily},sans-serif">Card title</div>` +
          `<div style="font-size:${t.fontSizeSm};color:${t.colorSecondary};` +
          `font-family:${t.fontFamily},sans-serif;line-height:${t.lineHeightNormal}">Supporting content goes here.</div>` +
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
            `<span style="font-size:${v.size};font-weight:${v.weight};line-height:${v.lh};` +
            `font-family:${t.fontFamily},sans-serif">The quick brown fox jumps</span>` +
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
  const css = buildCSS(t);
  const wghts = config.typography.fontWeights.join(";");
  const gFont = `https://fonts.googleapis.com/css2?family=${t.fontFamily.replace(/ /g, "+")}:wght@${wghts}&display=swap`;

  // ── Foundation rows ────────────────────────────────────────────────────────
  const colorSwatches = Object.entries(config.color)
    .map(
      ([name, value]) =>
        `<div class="swatch-wrap" onclick="copyText('${value}',this)">` +
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
        `<button class="copy-btn" onclick="copyText('${size}px',this)">Copy</button>` +
        `</div>`,
    )
    .join("");

  const spacingRows = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16]
    .map((m) => {
      const val = m * config.spacing.baseUnit;
      return (
        `<div class="token-row">` +
        `<span class="token-name">space${m}</span>` +
        `<div style="width:${Math.min(val * 2, 240)}px;height:${t.spaceXl};background:var(--color-primary);border-radius:${t.radiusSm};flex-shrink:0"></div>` +
        `<span class="token-value">${val}px</span>` +
        `<button class="copy-btn" onclick="copyText('${val}px',this)">Copy</button>` +
        `</div>`
      );
    })
    .join("");

  const radiusRows = config.radius.scale
    .map(
      (r, i) =>
        `<div class="token-row">` +
        `<span class="token-name">radius${i + 1}</span>` +
        `<div style="width:${t.space2xl};height:${t.space2xl};background:var(--color-primary);border-radius:${r}px;flex-shrink:0"></div>` +
        `<span class="token-value">${r}px</span>` +
        `<button class="copy-btn" onclick="copyText('${r}px',this)">Copy</button>` +
        `</div>`,
    )
    .join("");

  // ── Component sections ─────────────────────────────────────────────────────
  function propsTable(props: PropRow[]): string {
    return (
      `<table class="props-table">` +
      `<thead><tr><th>Prop</th><th>Required</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>` +
      `<tbody>` +
      props
        .map(
          (p) =>
            `<tr>` +
            `<td><code>${esc(p.name)}</code></td>` +
            `<td>${p.required ? `<span class="prop-required">yes</span>` : `<span style="color:var(--color-secondary);font-size:var(--font-size-ui-sm)">—</span>`}</td>` +
            `<td><code class="type">${esc(p.type)}</code></td>` +
            `<td><code>${esc(p.default)}</code></td>` +
            `<td>${esc(p.description)}${p.wcag ? `<div style="margin-top:3px;font-size:var(--font-size-ui-xs);color:var(--color-secondary);font-style:italic">${esc(p.wcag)}</div>` : ""}</td>` +
            `</tr>`,
        )
        .join("") +
      `</tbody></table>`
    );
  }

  function a11yTable(items: A11yItem[]): string {
    return (
      `<table class="a11y-table">` +
      `<thead><tr><th>Criterion</th><th>Level</th><th>Implementation</th></tr></thead>` +
      `<tbody>` +
      items
        .map(
          (item) =>
            `<tr>` +
            `<td style="white-space:nowrap"><code style="font-size:var(--font-size-ui-xs)">${esc(item.criterion)}</code></td>` +
            `<td><span class="a11y-level ${item.level}">${item.level}</span></td>` +
            `<td class="${item.status === "pass" ? "a11y-pass" : "a11y-note"}">${esc(item.description)}</td>` +
            `</tr>`,
        )
        .join("") +
      `</tbody></table>`
    );
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

    // Tab 1: Overview
    const overviewPanel =
      `<div class="meta-grid">` +
      metaItems
        .map(
          ([label, value]) =>
            `<div class="meta-item"><span class="meta-label">${label}</span><code>${value}</code></div>`,
        )
        .join("") +
      `</div>` +
      `<div class="block-title" style="margin-top:${t.spaceXl}">Usage guidelines</div>` +
      `<ul class="usage-list">${doc.usage.map((u) => `<li>${esc(u)}</li>`).join("")}</ul>` +
      `<div class="block-title" style="margin-top:${t.spaceXl}">Design tokens</div>` +
      Object.entries(meta.tokens)
        .map(([k, v]) => {
          const cssVar = tokenToCssVar(k);
          return (
            `<div class="token-row">` +
            `<span class="token-name">${cssVar}</span>` +
            (v.startsWith("#")
              ? `<div style="width:${t.spaceLg};height:${t.spaceLg};border-radius:${t.radiusSm};background:${v};border:${t.borderWidth} solid var(--color-border);flex-shrink:0"></div>`
              : "") +
            `<span class="token-value">${v}</span>` +
            `<button class="copy-btn" onclick="copyText('${cssVar}',this)">Copy</button>` +
            `</div>`
          );
        })
        .join("");

    // Tab 2: Preview & Code — each example has preview above its code block
    const previewAndCodePanel =
      `<div class="block-title">Import</div>` +
      `<div class="snippet-panel" style="margin-bottom:${t.spaceXl}">` +
      `<button class="copy-btn snippet-copy" onclick="copySnippet('${cn}',-1,this)">Copy</button>` +
      `<pre><code>${esc(`import { ${cn} } from './generated/components';`)}</code></pre>` +
      `</div>` +
      doc.snippets
        .map((s, si) => {
          const preview = buildSnippetPreview(meta, s, t, bv);
          return (
            `<div class="example-block">` +
            `<div class="snippet-label">${s.label}</div>` +
            (preview
              ? `<div class="preview-area" style="margin-bottom:0">${preview}</div>` +
                `<div class="preview-code-block">` +
                `<div class="snippet-panel">` +
                `<button class="copy-btn snippet-copy" onclick="copySnippet('${cn}',${si},this)">Copy</button>` +
                `<pre><code>${esc(s.code)}</code></pre>` +
                `</div></div>`
              : `<div class="snippet-panel">` +
                `<button class="copy-btn snippet-copy" onclick="copySnippet('${cn}',${si},this)">Copy</button>` +
                `<pre><code>${esc(s.code)}</code></pre>` +
                `</div>`) +
            `</div>`
          );
        })
        .join("");

    // Tab 3: Props
    const propsPanel =
      `<div class="block-title">Props</div>` + propsTable(doc.props);

    // Tab 4: Accessibility
    const a11yPanel =
      `<div class="block-title">WCAG Accessibility Checklist</div>` +
      a11yTable(doc.a11y) +
      `<p style="font-size:var(--font-size-ui-xs);color:var(--color-secondary);margin-top:${t.spaceMd}">` +
      `✓ Pass — implemented by the component&nbsp;&nbsp;◎ Note — requires care from the consumer</p>`;

    // Tab 5: AI Metadata
    const metadataPanel =
      `<div class="block-title">AI-consumable metadata</div>` +
      `<p style="font-size:var(--font-size-sm);color:var(--color-secondary);margin-bottom:${t.spaceLg};line-height:1.6">` +
      `This JSON is written to <code style="font-family:var(--font-mono);font-size:var(--font-size-ui-sm);background:var(--color-code-bg);padding:1px 4px;border-radius:var(--radius-sm)">generated/metadata/${cn}.json</code> ` +
      `and is intended for AI agents to consume before generating UI. It describes the component's role, interaction model, and accessibility contract.</p>` +
      `<div class="snippet-panel">` +
      `<button class="copy-btn snippet-copy" onclick="copySnippet('${cn}','meta',this)">Copy</button>` +
      `<pre><code>${esc(JSON.stringify(meta, null, 2))}</code></pre>` +
      `</div>`;

    return (
      `<div class="section" id="section-${cid}">` +
      `<div class="page-title">${cn}</div>` +
      `<div class="page-desc">${esc(doc.description)}</div>` +
      `<div class="tabs">` +
      `<button class="tab active" onclick="switchTab(this)">Overview</button>` +
      `<button class="tab" onclick="switchTab(this)">Preview &amp; Code</button>` +
      `<button class="tab" onclick="switchTab(this)">Props</button>` +
      `<button class="tab" onclick="switchTab(this)">Accessibility</button>` +
      `<button class="tab" onclick="switchTab(this)">AI Metadata</button>` +
      `</div>` +
      `<div class="tab-panel active">${overviewPanel}</div>` +
      `<div class="tab-panel">${previewAndCodePanel}</div>` +
      `<div class="tab-panel">${propsPanel}</div>` +
      `<div class="tab-panel">${a11yPanel}</div>` +
      `<div class="tab-panel">${metadataPanel}</div>` +
      `</div>`
    );
  }

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

  const navItems = metadata
    .map(
      (m) =>
        `<button class="nav-item" onclick="show('${m.component.toLowerCase()}',this)">${m.component}</button>`,
    )
    .join("");

  const html = [
    `<!DOCTYPE html><html lang="en">`,
    `<head>`,
    `  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
    `  <title>Design System</title>`,
    `  <link rel="icon" type="image/x-icon" href="../../assets/favicon.svg">`,
    `  <link rel="preconnect" href="https://fonts.googleapis.com">`,
    `  <link href="${gFont}" rel="stylesheet">`,
    `  <style>${css}</style>`,
    `</head><body>`,
    `<nav class="sidebar">`,
    `  <div class="sidebar-logo">`,
    `    <div class="sidebar-logo-title">Design System</div>`,
    `    <div class="sidebar-logo-sub">Generated by dsforge</div>`,
    `  </div>`,
    `  <div class="nav-group">Foundations</div>`,
    `  <button class="nav-item active" onclick="show('colors',this)">Colors</button>`,
    `  <button class="nav-item" onclick="show('typography',this)">Typography</button>`,
    `  <button class="nav-item" onclick="show('spacing',this)">Spacing</button>`,
    `  <button class="nav-item" onclick="show('radius',this)">Border Radius</button>`,
    `  <div class="nav-group">Components</div>`,
    `  ${navItems}`,
    `</nav>`,
    `<div class="topbar"><button class="dark-btn" onclick="toggleDark(this)">Dark</button></div>`,
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
    `    <div class="block-title">Type scale</div>${typoRows}`,
    `  </div>`,
    `  <div class="section" id="section-spacing">`,
    `    <div class="page-title">Spacing</div>`,
    `    <div class="page-desc">Base unit: <strong>${config.spacing.baseUnit}px</strong>. All spacing values are multiples of the base unit.</div>`,
    `    <div class="block-title">Spacing scale</div>${spacingRows}`,
    `  </div>`,
    `  <div class="section" id="section-radius">`,
    `    <div class="page-title">Border Radius</div>`,
    `    <div class="page-desc">Available border radius tokens from your config.</div>`,
    `    <div class="block-title">Radius scale</div>${radiusRows}`,
    `  </div>`,
    metadata.map(componentSection).join(""),
    `</main>`,
    `<div class="toast" id="toast">Copied!</div>`,
    `<script>`,
    `  function resetTabs(section){const bar=section.querySelector('.tabs');if(!bar)return;bar.querySelectorAll('.tab').forEach((t,i)=>{t.classList.toggle('active',i===0);});const panels=Array.from(section.children).filter(el=>el.classList.contains('tab-panel'));panels.forEach((p,i)=>{p.classList.toggle('active',i===0);});}`,
    `  function show(id,btn){document.querySelectorAll('.section').forEach(s=>{s.classList.remove('active');});document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));const sec=document.getElementById('section-'+id);sec.classList.add('active');resetTabs(sec);if(btn)btn.classList.add('active');}`,
    `  function toggleDark(btn){const d=document.documentElement.getAttribute('data-theme')==='dark';document.documentElement.setAttribute('data-theme',d?'':'dark');btn.textContent=d?'Dark':'Light';}`,
    `  function switchTab(btn){const w=btn.closest('.section');const bar=w.querySelector('.tabs');bar.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));btn.classList.add('active');const idx=Array.from(bar.querySelectorAll('.tab')).indexOf(btn);const panels=Array.from(w.children).filter(el=>el.classList.contains('tab-panel'));panels.forEach(p=>p.classList.remove('active'));if(panels[idx])panels[idx].classList.add('active');}`,
    `  const SNIPPETS=${safeJSON(snippetData)};`,
    `  function copySnippet(c,idx,btn){const e=SNIPPETS[c];if(!e)return;const text=idx===-1?e.import:idx==='meta'?e.meta:e.snippets[idx];if(text!=null)copyText(text,btn);}`,
    `  function copyText(text,btn){navigator.clipboard.writeText(text).then(()=>{if(btn){const o=btn.textContent;btn.textContent='Copied!';btn.classList.add('copied');setTimeout(()=>{btn.textContent=o;btn.classList.remove('copied');},2000);}const t=document.getElementById('toast');t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000);});}`,
    `</script>`,
    `</body></html>`,
  ].join("\n");

  const outPath = path.join(showcaseDir, "index.html");
  await fs.writeFile(outPath, html);
  return outPath;
}
