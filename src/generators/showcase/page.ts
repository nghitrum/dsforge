import type {
  ComponentJson,
  ComponentMetadataJson,
  PropMeta,
  AccessibilityContract,
} from "../../adapters/react/componentSchemas";
import type { A11yItem, ExampleDef } from "./types";
import { esc } from "./types";

// ─── Locked panel ─────────────────────────────────────────────────────────────

const lockedPanel = (label: string) => `
  <div class="locked-panel">
    <div class="locked-icon">⊘</div>
    <div class="locked-title">${label} — dsforge Pro</div>
    <p class="locked-desc">This tab is available with a dsforge Pro license.</p>
    <p class="locked-hint">Set the <code>DSFORGE_KEY</code> environment variable to unlock.</p>
  </div>`;

// ─── Props table ──────────────────────────────────────────────────────────────

function buildPropsTable(props: PropMeta[]): string {
  const sorted = [...props].sort((a, b) => (b.required ? 1 : 0) - (a.required ? 1 : 0));
  return `
    <table class="props-table">
      <thead>
        <tr>
          <th>Prop</th>
          <th>Required</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${sorted
          .map(
            (p) => `
          <tr>
            <td><code class="prop-name">${esc(p.name)}</code></td>
            <td class="prop-required-cell">
              ${p.required ? '<span class="prop-required">Yes</span>' : '<span class="prop-optional">—</span>'}
            </td>
            <td><code class="prop-type">${esc(p.type)}</code></td>
            <td><code class="prop-default">${esc(p.default)}</code></td>
            <td class="prop-desc">${esc(p.description)}</td>
          </tr>`,
          )
          .join("")}
      </tbody>
    </table>`;
}

// ─── Examples ─────────────────────────────────────────────────────────────────

function buildExamplesHtml(id: string, examples: ExampleDef[]): string {
  return examples
    .map(
      (ex, i) => `
    <div class="example-block">
      <div class="example-header">
        <div class="example-label">${esc(ex.label)}</div>
        ${ex.description ? `<div class="example-desc">${esc(ex.description)}</div>` : ""}
      </div>
      ${ex.previewHtml ? `<div class="example-preview">${ex.previewHtml}</div>` : ""}
      <div class="example-code-wrap">
        <div class="example-code-bar">
          <span>TSX</span>
          <button class="copy-btn" onclick="copyCode('${id}-ex-${i}', this)">Copy</button>
        </div>
        <pre class="example-code" id="${id}-ex-${i}">${esc(ex.code)}</pre>
      </div>
    </div>`,
    )
    .join("");
}

// ─── Accessibility ────────────────────────────────────────────────────────────

function requirementBadge(val: string | boolean): string {
  if (typeof val === "boolean") {
    return val
      ? '<span class="a11y-badge a11y-badge-aa">Yes</span>'
      : '<span class="a11y-badge" style="background:var(--color-bg-overlay,#f1f5f9);color:var(--color-text-secondary,#64748b);border:1px solid var(--color-border-default,#e2e8f0)">No</span>';
  }
  return `<span class="a11y-badge a11y-badge-aa">${esc(val)}</span>`;
}

function buildA11yHtml(
  contract: AccessibilityContract,
  wcagItems: A11yItem[],
): string {
  // ── Section 1: Requirements ──────────────────────────────────────────────
  const requirements = [
    {
      label: "Keyboard operable",
      value: contract.keyboard,
      desc: "Component can be fully operated with keyboard alone. No mouse required.",
    },
    {
      label: "Focus ring",
      value: contract.focusRing,
      desc: "Visible focus indicator requirement when the element receives keyboard focus.",
    },
    {
      label: "aria-label",
      value: contract.ariaLabel,
      desc: "When a programmatic accessible label must be provided by the consumer.",
    },
  ];

  const requirementsHtml = `
    <div class="a11y-requirements">
      ${requirements
        .map(
          (r) => `
      <div class="a11y-req-row">
        <div class="a11y-req-meta">
          <span class="a11y-req-label">${esc(r.label)}</span>
          ${requirementBadge(r.value)}
        </div>
        <p class="a11y-req-desc">${esc(r.desc)}</p>
      </div>`,
        )
        .join("")}
      ${
        contract.roles.length > 0
          ? `<div class="a11y-req-row">
        <div class="a11y-req-meta">
          <span class="a11y-req-label">ARIA roles</span>
          <span style="display:flex;gap:4px;flex-wrap:wrap">
            ${contract.roles.map((r) => `<code class="a11y-role-chip">${esc(r)}</code>`).join("")}
          </span>
        </div>
        <p class="a11y-req-desc">The semantic roles this component exposes to assistive technology.</p>
      </div>`
          : ""
      }
      ${contract.notes
        .map(
          (note) => `
      <div class="a11y-note">
        <span class="a11y-note-icon">↳</span>
        <p class="a11y-note-text">${esc(note)}</p>
      </div>`,
        )
        .join("")}
    </div>`;

  // ── Section 2: WCAG Criteria ─────────────────────────────────────────────
  const wcagHtml =
    wcagItems.length > 0
      ? `
    <div class="group-title" style="margin-top:32px">WCAG Criteria</div>
    <div class="a11y-list">
      ${wcagItems
        .map(
          (item) => `
        <div class="a11y-item">
          <div class="a11y-header">
            <span class="a11y-criterion">${esc(item.criterion)}</span>
            <span class="a11y-badge a11y-badge-${item.level.toLowerCase()}">WCAG ${item.level}</span>
          </div>
          <p class="a11y-desc">${esc(item.description)}</p>
        </div>`,
        )
        .join("")}
    </div>`
      : "";

  return `
    <div class="group-title">Requirements</div>
    ${requirementsHtml}
    ${wcagHtml}`;
}

// ─── AI Metadata ──────────────────────────────────────────────────────────────

function buildAiMetaHtml(id: string, meta: ComponentMetadataJson): string {
  const metaJson = JSON.stringify(meta, null, 2);
  return `
    <div class="ai-meta-intro">
      <p>This JSON contract is emitted to <code>components/${esc(meta.name)}/${esc(meta.name)}.metadata.json</code>.
      AI coding assistants use it to understand when and how to use this component correctly.</p>
    </div>
    <div class="example-code-wrap" style="margin-top:16px">
      <div class="example-code-bar">
        <span>JSON</span>
        <button class="copy-btn" onclick="copyCode('${id}-ai-meta', this)">Copy</button>
      </div>
      <pre class="example-code" id="${id}-ai-meta">${esc(metaJson)}</pre>
    </div>
    <div class="ai-guidance">
      <div class="group-title" style="margin-top:24px">AI usage guidance</div>
      <ul class="ai-guidance-list">
        ${meta.aiGuidance.map((g) => `<li>${esc(g)}</li>`).join("")}
      </ul>
    </div>`;
}

// ─── Page builder ─────────────────────────────────────────────────────────────

export interface ShowcasePageInput {
  id: string;
  label: string;
  description: string;
  overviewHtml: string;
  json: ComponentJson;
  /** Examples from the showcase component def — include previewHtml for live renders */
  showcaseExamples: ExampleDef[];
  /**
   * Accessibility contract — always provided (free tier).
   * Null only when no definition exists for this component.
   */
  a11yContract: AccessibilityContract | null;
  /** WCAG criterion items from the showcase component definition */
  a11yItems: A11yItem[];
  /** Full Pro metadata — null on free tier. Used only for AI Metadata tab. */
  metadata: ComponentMetadataJson | null;
  isPro: boolean;
}

export function buildComponentPage(input: ShowcasePageInput): string {
  const { id, description, overviewHtml, json, showcaseExamples, a11yContract, a11yItems, metadata, isPro } = input;

  const tabId = (tab: string) => `${id}-tab-${tab}`;
  const panelId = (tab: string) => `${id}-panel-${tab}`;

  // ── Overview ──────────────────────────────────────────────────────────────
  const overviewContent = `
    <div class="comp-overview">${overviewHtml}</div>
    <p class="component-description">${esc(description)}</p>`;

  // ── Props ─────────────────────────────────────────────────────────────────
  const propsContent = buildPropsTable(json.props);

  // ── Examples ──────────────────────────────────────────────────────────────
  const examplesContent = buildExamplesHtml(id, showcaseExamples);

  // ── Accessibility — always free ───────────────────────────────────────────
  const a11yContent = a11yContract
    ? buildA11yHtml(a11yContract, a11yItems)
    : `<div class="a11y-list">${a11yItems.map((item) => `
      <div class="a11y-item">
        <div class="a11y-header">
          <span class="a11y-criterion">${esc(item.criterion)}</span>
          <span class="a11y-badge a11y-badge-${item.level.toLowerCase()}">WCAG ${item.level}</span>
        </div>
        <p class="a11y-desc">${esc(item.description)}</p>
      </div>`).join("")}</div>`;

  // ── AI Metadata — Pro only ────────────────────────────────────────────────
  const aiContent =
    isPro && metadata ? buildAiMetaHtml(id, metadata) : lockedPanel("AI Metadata");

  // ── Assemble tabs ─────────────────────────────────────────────────────────
  const tabs = [
    { id: "overview",       label: "Overview",      content: overviewContent, locked: false },
    { id: "props",          label: "Props",         content: propsContent,    locked: false },
    { id: "examples",       label: "Examples",      content: examplesContent, locked: false },
    { id: "accessibility",  label: "Accessibility", content: a11yContent,     locked: false },
    { id: "ai-metadata",    label: "AI Metadata",   content: aiContent,       locked: !isPro },
  ];

  return `
    <div class="comp-tabs" id="${id}-tabs">
      <div class="comp-tab-bar" role="tablist">
        ${tabs
          .map(
            (t, i) => `
          <button
            class="comp-tab${i === 0 ? " active" : ""}${t.locked ? " locked" : ""}"
            id="${tabId(t.id)}"
            role="tab"
            aria-selected="${i === 0}"
            aria-controls="${panelId(t.id)}"
            onclick="${t.locked ? "return false" : `switchTab('${id}', '${t.id}', this)`}"
            ${t.locked ? 'title="Unlock with dsforge Pro"' : ""}
          >${esc(t.label)}${t.locked ? " &#x1F512;" : ""}</button>`,
          )
          .join("")}
      </div>
      ${tabs
        .map(
          (t, i) => `
        <div
          class="comp-tab-panel${i === 0 ? " active" : ""}"
          id="${panelId(t.id)}"
          role="tabpanel"
          aria-labelledby="${tabId(t.id)}"
        >${t.content}</div>`,
        )
        .join("")}
    </div>`;
}
