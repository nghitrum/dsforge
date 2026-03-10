import type { DesignSystemConfig } from "../../../types/index";
import type { ComponentDef } from "../types";
import { esc, componentTokens } from "../types";

export function badgeDef(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
): ComponentDef {
  const { ff } = componentTokens(config, tokens);

  const badgeHtml = (label: string, bg: string, color: string) =>
    `<span style="display:inline-flex;align-items:center;font-family:${esc(ff)};font-size:12px;font-weight:500;padding:2px 8px;border-radius:9999px;background:${bg};color:${color};white-space:nowrap">${label}</span>`;

  const variants = [
    { label: "Default", bg: "#f1f5f9", color: "#6b7280" },
    { label: "Success", bg: "#dcfce7", color: "#16a34a" },
    { label: "Warning", bg: "#fef9c3", color: "#ca8a04" },
    { label: "Danger", bg: "#fee2e2", color: "#dc2626" },
    { label: "Info", bg: "#dbeafe", color: "#2563eb" },
  ];

  return {
    id: "badge",
    label: "Badge",
    description:
      "Compact label for status, categories, or counts. Display-only — not interactive.",
    overviewHtml: `
      <div class="comp-overview-section">
        <div class="comp-overview-label">Variants</div>
        <div class="comp-preview-row">
          ${variants.map((v) => badgeHtml(v.label, v.bg, v.color)).join("\n          ")}
        </div>
      </div>
      <div class="comp-overview-section">
        <div class="comp-overview-label">Sizes</div>
        <div class="comp-preview-row" style="align-items:center">
          <span style="display:inline-flex;align-items:center;font-family:${esc(ff)};font-size:11px;font-weight:500;padding:1px 6px;border-radius:9999px;background:#dbeafe;color:#2563eb">Small</span>
          <span style="display:inline-flex;align-items:center;font-family:${esc(ff)};font-size:12px;font-weight:500;padding:2px 8px;border-radius:9999px;background:#dbeafe;color:#2563eb">Medium</span>
          <span style="display:inline-flex;align-items:center;font-family:${esc(ff)};font-size:14px;font-weight:500;padding:4px 12px;border-radius:9999px;background:#dbeafe;color:#2563eb">Large</span>
          <span style="display:inline-flex;width:8px;height:8px;border-radius:50%;background:#16a34a" title="Dot mode"></span>
        </div>
      </div>`,
    props: [
      {
        name: "variant",
        type: '"default" | "success" | "warning" | "danger" | "info"',
        default: '"default"',
        required: false,
        description: "Semantic color variant.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        required: false,
        description: "Controls font size and padding.",
      },
      {
        name: "dot",
        type: "boolean",
        default: "false",
        required: false,
        description: "Renders as a coloured dot with no text.",
      },
      {
        name: "children",
        type: "React.ReactNode",
        default: "—",
        required: false,
        description: "Badge label text.",
      },
    ],
    examples: [
      {
        label: "Status badges",
        description: "Use semantic variants to communicate status at a glance.",
        code: `<Badge variant="success">Published</Badge>
<Badge variant="warning">Draft</Badge>
<Badge variant="danger">Archived</Badge>`,
        previewHtml: `<div style="display:flex;gap:8px;flex-wrap:wrap">
          ${badgeHtml("Published", "#dcfce7", "#16a34a")}
          ${badgeHtml("Draft", "#fef9c3", "#ca8a04")}
          ${badgeHtml("Archived", "#fee2e2", "#dc2626")}
        </div>`,
      },
      {
        label: "Dot indicator",
        description: "Use dot mode for presence or connection status indicators.",
        code: `<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
  <Badge variant="success" dot />
  Online
</span>`,
        previewHtml: `<div style="display:flex;align-items:center;gap:6px;font-family:${esc(ff)};font-size:14px;color:var(--color-text-primary,#0f172a)">
          <span style="display:inline-flex;width:8px;height:8px;border-radius:50%;background:#16a34a"></span>
          Online
        </div>`,
      },
      {
        label: "With a count",
        description: "Pair with a label for notification counts.",
        code: `<Badge variant="danger">3</Badge>`,
        previewHtml: `<div style="display:flex;gap:8px">
          ${badgeHtml("3", "#fee2e2", "#dc2626")}
          ${badgeHtml("12", "#dbeafe", "#2563eb")}
        </div>`,
      },
    ],
    a11y: [
      {
        criterion: "1.3.1 Info and Relationships",
        level: "A",
        description:
          "Badge is a <span> with no implicit role. If it conveys status, add role='status' or wrap in a live region.",
      },
      {
        criterion: "1.4.3 Contrast (Minimum)",
        level: "AA",
        description:
          "All variant colour pairs are chosen to meet 4.5:1 contrast ratio for small text.",
      },
      {
        criterion: "1.4.11 Non-text Contrast",
        level: "AA",
        description:
          "Dot badges must have sufficient contrast with their background. Pair with a text label for screen readers.",
      },
    ],
    aiMeta: {
      component: "Badge",
      role: "status-indicator",
      hierarchyLevel: "utility",
      interactionModel: "none",
      layoutImpact: "inline",
      destructiveVariants: [],
      accessibilityContract: {
        implicitRole: "none",
        dotRequiresTextAlternative: true,
      },
      variants: ["default", "success", "warning", "danger", "info"],
      aiGuidance: [
        "Use badge to convey status, not to trigger actions — use Button for actions.",
        "Dot badges are not perceivable by screen readers alone; always pair with adjacent text.",
        "Keep badge labels short — 1–2 words or a count.",
        "Danger variant is appropriate for errors or destructive states, not general alerts.",
      ],
    },
  };
}
