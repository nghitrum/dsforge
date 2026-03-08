import type { DesignSystemConfig } from "../../../types/index";
import type { ComponentDef } from "../types";
import { esc, componentTokens } from "../types";

export function cardDef(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
): ComponentDef {
  const { radiusMd, radiusLg, ff } = componentTokens(config, tokens);
  const rMd = `${radiusMd}px`;
  const rLg = `${radiusLg}px`;

  // CSS variable shortcuts
  const C = {
    action: "var(--color-action, #2563eb)",
    actionText: "var(--color-text-on-color, #fff)",
    text: "var(--color-text-primary, #0f172a)",
    textSecondary: "var(--color-text-secondary, #64748b)",
    bg: "var(--color-bg-default, #fff)",
    border: "var(--color-border-default, #e2e8f0)",
  };

  const cardHtml = (
    title: string,
    body: string,
    extraStyle = "",
    footerHtml = "",
  ) => `
    <div class="ds-card" style="border-color:${C.border};border-radius:${rLg};background:${C.bg};color:${C.text};${extraStyle}">
      <div class="ds-card-header" style="border-bottom:1px solid ${C.border}"><strong>${title}</strong></div>
      <div class="ds-card-body"><p style="color:${C.textSecondary};margin:0;font-size:14px;font-family:${esc(ff)}">${body}</p></div>
      ${footerHtml ? `<div class="ds-card-footer" style="border-top:1px solid ${C.border}">${footerHtml}</div>` : ""}
    </div>`;

  const footerBtn = `<button class="ds-btn" style="background:${C.action};color:${C.actionText};border-radius:${rMd};font-size:13px;padding:6px 14px;font-family:${esc(ff)}">Action</button>`;

  return {
    id: "card",
    label: "Card",
    description:
      "A surface that groups related content. Supports header, body, and optional footer slots.",
    overviewHtml: `
      <div class="comp-overview-section">
        <div class="comp-overview-label">Variants</div>
        <div class="comp-preview-row" style="align-items:flex-start;flex-wrap:wrap">
          ${cardHtml("Default", "Bordered surface, no shadow.", "", footerBtn)}
          ${cardHtml("Elevated", "Shadow replaces border.", `border-color:transparent;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.10)`)}
          ${cardHtml("Outlined", "Stronger border, no shadow.", `border:2px solid ${C.border}`)}
        </div>
      </div>`,
    props: [
      {
        name: "variant",
        type: '"default" | "elevated" | "outlined"',
        default: '"default"',
        required: false,
        description:
          "Visual style. Elevated uses box-shadow; outlined uses a heavier border.",
      },
      {
        name: "padding",
        type: '"none" | "sm" | "md" | "lg"',
        default: '"md"',
        required: false,
        description: "Inner padding of the card body.",
      },
      {
        name: "header",
        type: "React.ReactNode",
        default: "—",
        required: false,
        description: "Content rendered in the card header slot.",
      },
      {
        name: "footer",
        type: "React.ReactNode",
        default: "—",
        required: false,
        description: "Content rendered in the card footer slot.",
      },
      {
        name: "children",
        type: "React.ReactNode",
        default: "—",
        required: true,
        description: "Main body content.",
      },
      {
        name: "className",
        type: "string",
        default: "—",
        required: false,
        description: "Additional CSS classes on the root element.",
      },
    ],
    examples: [
      {
        label: "Basic card",
        description:
          "Default bordered card with header, body, and a footer action.",
        code: `<Card
  header={<strong>Card title</strong>}
  footer={<Button size="sm">Action</Button>}
>
  Card body content goes here.
</Card>`,
        previewHtml: cardHtml(
          "Card title",
          "Card body content goes here.",
          "",
          footerBtn,
        ),
      },
      {
        label: "Elevated card",
        description:
          "Use elevated for surfaces that float above the page background.",
        code: `<Card variant="elevated" header={<strong>Elevated</strong>}>
  Uses box-shadow instead of a border.
</Card>`,
        previewHtml: cardHtml(
          "Elevated",
          "Uses box-shadow instead of a border.",
          "border-color:transparent;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.10)",
        ),
      },
      {
        label: "No header or footer",
        description:
          "Header and footer are optional. Omit both for a simple content container.",
        code: `<Card>
  A minimal card with no header or footer — just body content.
</Card>`,
        previewHtml: `
          <div class="ds-card" style="border-color:${C.border};border-radius:${rLg};background:${C.bg};color:${C.text}">
            <div class="ds-card-body">
              <p style="color:${C.textSecondary};margin:0;font-size:14px;font-family:${esc(ff)}">A minimal card with no header or footer.</p>
            </div>
          </div>`,
      },
    ],
    a11y: [
      {
        criterion: "1.3.1 Info and Relationships",
        level: "A",
        description:
          "Card is a <div> container — it carries no implicit role. If the card is a meaningful landmark, add role='region' and an aria-label.",
      },
      {
        criterion: "1.4.3 Contrast (Minimum)",
        level: "AA",
        description:
          "Text and border colour tokens are validated against WCAG AA at generate time.",
      },
      {
        criterion: "2.4.6 Headings and Labels",
        level: "AA",
        description:
          "The header slot should contain a heading element (<h2>–<h4>) rather than bold text to preserve document outline.",
      },
      {
        criterion: "2.1.1 Keyboard",
        level: "A",
        description:
          "The card itself is not focusable. Interactive children (buttons, links) are reachable and operable by keyboard.",
      },
    ],
    aiMeta: {
      component: "Card",
      role: "content-container",
      hierarchyLevel: "composite",
      interactionModel: "passive",
      layoutImpact: "block",
      destructiveVariants: [],
      accessibilityContract: {
        implicitRole: "none",
        addRoleRegionForLandmarks: true,
        headerSlotShouldUseHeading: true,
      },
      variants: ["default", "elevated", "outlined"],
      aiGuidance: [
        "Do not nest interactive cards inside other interactive cards.",
        "If the entire card is clickable, use a single <a> or <button> wrapping the content — not onClick on the div.",
        "Use header slot for a concise title; keep it to one line where possible.",
        "Elevated variant is best on coloured or image backgrounds where a border would be lost.",
      ],
    },
  };
}
