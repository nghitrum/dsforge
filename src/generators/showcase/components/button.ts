import type { DesignSystemConfig } from "../../../types/index";
import type { ComponentDef } from "../types";
import { esc, componentTokens } from "../types";

export function buttonDef(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
): ComponentDef {
  const { radiusMd, ff } = componentTokens(config, tokens);
  const r = `${radiusMd}px`;
  const s = (extra = "") => `style="font-family:${esc(ff)};${extra}"`;

  // CSS variable shortcuts
  const C = {
    action: "var(--color-action, #2563eb)",
    actionText: "var(--color-text-on-color, #fff)",
    text: "var(--color-text-primary, #0f172a)",
  };

  return {
    id: "button",
    label: "Button",
    description:
      "Triggers an action or event. Use for form submissions, dialogs, and in-page actions.",
    usageExample: `<Button variant="primary" size="md" onClick={() => {}}>
  Save changes
</Button>`,
    overviewHtml: `
      <div class="comp-overview-section">
        <div class="comp-overview-label">Variants</div>
        <div class="comp-preview-row">
          <button class="ds-btn" ${s(`background:${C.action};color:${C.actionText};border-radius:${r}`)}>Primary</button>
          <button class="ds-btn" ${s(`background:transparent;color:${C.action};border:1.5px solid ${C.action};border-radius:${r}`)}>Secondary</button>
          <button class="ds-btn" ${s(`background:#dc2626;color:#fff;border-radius:${r}`)}>Danger</button>
          <button class="ds-btn" ${s(`background:transparent;color:${C.text};border-radius:${r}`)}>Ghost</button>
          <button class="ds-btn" ${s(`background:${C.action};color:${C.actionText};border-radius:${r};opacity:0.4;cursor:not-allowed`)} disabled>Disabled</button>
        </div>
      </div>
      <div class="comp-overview-section">
        <div class="comp-overview-label">Sizes</div>
        <div class="comp-preview-row" style="align-items:center">
          <button class="ds-btn" ${s(`background:${C.action};color:${C.actionText};border-radius:${r};font-size:12px;padding:4px 12px`)}>Small</button>
          <button class="ds-btn" ${s(`background:${C.action};color:${C.actionText};border-radius:${r};font-size:14px;padding:8px 16px`)}>Medium</button>
          <button class="ds-btn" ${s(`background:${C.action};color:${C.actionText};border-radius:${r};font-size:16px;padding:12px 24px`)}>Large</button>
        </div>
      </div>`,
    props: [
      {
        name: "variant",
        type: '"primary" | "secondary" | "danger" | "ghost"',
        default: '"primary"',
        required: false,
        description: "Visual style of the button.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        required: false,
        description: "Controls padding and font size.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        required: false,
        description: "Prevents interaction and applies reduced opacity.",
      },
      {
        name: "loading",
        type: "boolean",
        default: "false",
        required: false,
        description: "Shows a spinner and disables the button.",
      },
      {
        name: "onClick",
        type: "() => void",
        default: "—",
        required: false,
        description: "Callback fired on click.",
      },
      {
        name: "type",
        type: '"button" | "submit" | "reset"',
        default: '"button"',
        required: false,
        description: "Native button type. Always set explicitly inside forms.",
      },
      {
        name: "children",
        type: "React.ReactNode",
        default: "—",
        required: true,
        description:
          "Button label. Prefer plain text; icons should have aria-label.",
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
        label: "Basic usage",
        description: "The default primary button.",
        code: `<Button onClick={() => console.log('clicked')}>
  Save changes
</Button>`,
        previewHtml: `<button class="ds-btn" ${s(`background:${C.action};color:${C.actionText};border-radius:${r}`)}>Save changes</button>`,
      },
      {
        label: "Danger action",
        description:
          "Use the danger variant for destructive or irreversible actions.",
        code: `<Button variant="danger" onClick={handleDelete}>
  Delete account
</Button>`,
        previewHtml: `<button class="ds-btn" ${s(`background:#dc2626;color:#fff;border-radius:${r}`)}>Delete account</button>`,
      },
      {
        label: "Loading state",
        description:
          "Pass loading to show a spinner while an async action is in progress.",
        code: `<Button loading onClick={handleSubmit}>
  Saving…
</Button>`,
        previewHtml: `<button class="ds-btn" ${s(`background:${C.action};color:${C.actionText};border-radius:${r};opacity:0.7;cursor:not-allowed`)} disabled>⟳ &nbsp;Saving…</button>`,
      },
      {
        label: "Button group",
        description: "Combine secondary and primary for confirm/cancel pairs.",
        code: `<div style={{ display: 'flex', gap: 8 }}>
  <Button variant="secondary" onClick={onCancel}>Cancel</Button>
  <Button onClick={onConfirm}>Confirm</Button>
</div>`,
        previewHtml: `<div style="display:flex;gap:8px">
          <button class="ds-btn" ${s(`background:transparent;color:${C.action};border:1.5px solid ${C.action};border-radius:${r}`)}>Cancel</button>
          <button class="ds-btn" ${s(`background:${C.action};color:${C.actionText};border-radius:${r}`)}>Confirm</button>
        </div>`,
      },
    ],
    a11y: [
      {
        criterion: "1.3.1 Info and Relationships",
        level: "A",
        description:
          "Button role is conveyed via the native <button> element — no extra role attribute needed.",
      },
      {
        criterion: "1.4.3 Contrast (Minimum)",
        level: "AA",
        description:
          "Primary and danger variants are validated against WCAG AA (4.5:1 for text, 3:1 for UI components).",
      },
      {
        criterion: "2.1.1 Keyboard",
        level: "A",
        description:
          "Fully operable with keyboard. Enter and Space activate the button. Tab moves focus.",
      },
      {
        criterion: "2.4.7 Focus Visible",
        level: "AA",
        description:
          "A visible focus ring is applied on :focus-visible. Never suppressed with outline:none.",
      },
      {
        criterion: "4.1.2 Name, Role, Value",
        level: "A",
        description:
          "Icon-only buttons must receive an aria-label. Loading state sets aria-busy='true'.",
      },
    ],
    aiMeta: {
      component: "Button",
      role: "action-trigger",
      hierarchyLevel: "primary",
      interactionModel: "synchronous",
      layoutImpact: "inline",
      destructiveVariants: ["danger"],
      accessibilityContract: {
        keyboard: true,
        focusRing: "required",
        ariaLabel: "required-for-icon-only",
        ariaBusy: "set-when-loading",
      },
      variants: ["primary", "secondary", "danger", "ghost"],
      aiGuidance: [
        "Use primary for the single most important action on a surface.",
        "Never place two primary buttons side by side.",
        "Use danger only for irreversible destructive actions — always pair with a confirmation dialog.",
        "Ghost is suitable for tertiary actions inside dense UI (toolbars, table rows).",
      ],
    },
  };
}
