import type { ComponentDef } from "./types";
import { esc } from "./types";

const lockedPanel = (label: string) => `
  <div class="locked-panel">
    <div class="locked-icon">⊘</div>
    <div class="locked-title">${label} — dsforge Pro</div>
    <p class="locked-desc">This tab is available with a dsforge Pro license.</p>
    <p class="locked-hint">Set the <code>DSFORGE_KEY</code> environment variable to unlock.</p>
  </div>`;

export function buildComponentPage(def: ComponentDef, isPro: boolean): string {
  const tabId = (tab: string) => `${def.id}-tab-${tab}`;
  const panelId = (tab: string) => `${def.id}-panel-${tab}`;

  // ── Overview ──────────────────────────────────────────────────────────────
  const overviewHtml = `<div class="comp-overview">${def.overviewHtml}</div>`;

  // ── Props table ───────────────────────────────────────────────────────────
  const propsTable = `
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
        ${def.props
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

  // ── Examples ──────────────────────────────────────────────────────────────
  const examplesHtml = def.examples
    .map(
      (ex, i) => `
    <div class="example-block">
      <div class="example-header">
        <div class="example-label">${esc(ex.label)}</div>
        <div class="example-desc">${esc(ex.description)}</div>
      </div>
      <div class="example-preview">${ex.previewHtml}</div>
      <div class="example-code-wrap">
        <div class="example-code-bar">
          <span>TSX</span>
          <button class="copy-btn" onclick="copyCode('${def.id}-ex-${i}', this)">Copy</button>
        </div>
        <pre class="example-code" id="${def.id}-ex-${i}">${esc(ex.code)}</pre>
      </div>
    </div>`,
    )
    .join("");

  // ── Accessibility ─────────────────────────────────────────────────────────
  const a11yHtml = `
    <div class="a11y-list">
      ${def.a11y
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
    </div>`;

  // ── AI Metadata ───────────────────────────────────────────────────────────
  const aiJson = JSON.stringify(def.aiMeta, null, 2);
  const aiHtml = `
    <div class="ai-meta-intro">
      <p>This JSON contract is emitted to <code>dist-ds/metadata/${def.id}.json</code>.
      AI coding assistants use it to understand when and how to use this component correctly.</p>
    </div>
    <div class="example-code-wrap" style="margin-top:16px">
      <div class="example-code-bar">
        <span>JSON</span>
        <button class="copy-btn" onclick="copyCode('${def.id}-ai-meta', this)">Copy</button>
      </div>
      <pre class="example-code" id="${def.id}-ai-meta">${esc(aiJson)}</pre>
    </div>
    <div class="ai-guidance">
      <div class="group-title" style="margin-top:24px">AI usage guidance</div>
      <ul class="ai-guidance-list">
        ${def.aiMeta.aiGuidance.map((g) => `<li>${esc(g)}</li>`).join("")}
      </ul>
    </div>`;

  // ── Assemble tabs ─────────────────────────────────────────────────────────
  const tabs = [
    { id: "overview", label: "Overview", content: overviewHtml, locked: false },
    { id: "props", label: "Props", content: propsTable, locked: false },
    { id: "examples", label: "Examples", content: examplesHtml, locked: false },
    {
      id: "accessibility",
      label: "Accessibility",
      content: isPro ? a11yHtml : lockedPanel("Accessibility"),
      locked: !isPro,
    },
    {
      id: "ai-metadata",
      label: "AI Metadata",
      content: isPro ? aiHtml : lockedPanel("AI Metadata"),
      locked: !isPro,
    },
  ];

  return `
    <div class="comp-tabs" id="${def.id}-tabs">
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
            onclick="${t.locked ? "return false" : `switchTab('${def.id}', '${t.id}', this)`}"
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
