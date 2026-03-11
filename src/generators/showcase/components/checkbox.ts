import type { DesignSystemConfig } from "../../../types/index";
import type { ComponentDef } from "../types";
import { esc, componentTokens } from "../types";

export function checkboxDef(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
): ComponentDef {
  const { ff } = componentTokens(config, tokens);

  const C = {
    action: "var(--color-action, #2563eb)",
    text: "var(--color-text-primary, #0f172a)",
    textSecondary: "var(--color-text-secondary, #64748b)",
    border: "var(--color-border-default, #e2e8f0)",
    bg: "var(--color-bg-default, #fff)",
  };

  const boxHtml = (checked: boolean, indeterminate = false) => {
    const fill = checked || indeterminate ? "#2563eb" : C.bg;
    const borderColor = checked || indeterminate ? "#2563eb" : C.border;
    const mark = checked
      ? `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5,5 4,7.5 8.5,2.5"/></svg>`
      : indeterminate
        ? `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><line x1="2" y1="5" x2="8" y2="5"/></svg>`
        : "";
    return `<span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:2px;border:2px solid ${borderColor};background:${fill};flex-shrink:0">${mark}</span>`;
  };

  const checkboxHtml = (
    label: string,
    checked: boolean,
    opts = "",
    helper = "",
  ) =>
    `<label style="display:inline-flex;align-items:flex-start;gap:8px;cursor:pointer;font-family:${esc(ff)};${opts}">
      ${boxHtml(checked)}
      <span style="font-size:14px;color:${C.text};line-height:1.4">${label}${helper ? `<br><span style="font-size:12px;color:${C.textSecondary}">${helper}</span>` : ""}</span>
    </label>`;

  return {
    id: "checkbox",
    label: "Checkbox",
    description:
      "Binary toggle for boolean values. Supports indeterminate state for partial selections.",
    usageExample: `<Checkbox
  label="Accept terms"
  checked={accepted}
  onChange={(e) => setAccepted(e.target.checked)}
/>`,
    overviewHtml: `
      <div class="comp-overview-section">
        <div class="comp-overview-label">States</div>
        <div class="comp-preview-col">
          ${checkboxHtml("Unchecked", false)}
          ${checkboxHtml("Checked", true)}
          <label style="display:inline-flex;align-items:flex-start;gap:8px;cursor:pointer;font-family:${esc(ff)}">
            ${boxHtml(false, true)}
            <span style="font-size:14px;color:${C.text}">Indeterminate</span>
          </label>
          ${checkboxHtml("Disabled", false, "opacity:0.4;cursor:not-allowed")}
        </div>
      </div>`,
    props: [
      {
        name: "label",
        type: "string",
        default: "—",
        required: false,
        description: "Visible label rendered next to the checkbox.",
      },
      {
        name: "checked",
        type: "boolean",
        default: "—",
        required: false,
        description: "Controlled checked state. Pair with onChange.",
      },
      {
        name: "defaultChecked",
        type: "boolean",
        default: "false",
        required: false,
        description: "Initial checked state for uncontrolled usage.",
      },
      {
        name: "indeterminate",
        type: "boolean",
        default: "false",
        required: false,
        description:
          "Partial selection state. Visually distinct from checked/unchecked.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        required: false,
        description: "Prevents interaction and applies reduced opacity.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        required: false,
        description: "Controls checkbox and label size.",
      },
      {
        name: "helperText",
        type: "string",
        default: "—",
        required: false,
        description: "Secondary text below the label.",
      },
      {
        name: "onChange",
        type: "(e: React.ChangeEvent<HTMLInputElement>) => void",
        default: "—",
        required: false,
        description: "Fires when the checked state changes.",
      },
    ],
    examples: [
      {
        label: "Controlled checkbox",
        description: "Manage checked state externally with useState.",
        code: `const [agreed, setAgreed] = useState(false);

<Checkbox
  label="I accept the terms and conditions"
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
/>`,
        previewHtml: checkboxHtml("I accept the terms and conditions", true),
      },
      {
        label: "Indeterminate (parent selection)",
        description:
          "Use indeterminate when some but not all children are selected.",
        code: `<Checkbox
  label="Select all (3 of 5)"
  indeterminate
/>`,
        previewHtml: `<label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-family:${esc(ff)}">
          ${boxHtml(false, true)}
          <span style="font-size:14px;color:${C.text}">Select all (3 of 5)</span>
        </label>`,
      },
      {
        label: "With helper text",
        description:
          "helperText provides secondary context without replacing the label.",
        code: `<Checkbox
  label="Receive email notifications"
  helperText="We'll send summaries once a week."
  defaultChecked
/>`,
        previewHtml: checkboxHtml(
          "Receive email notifications",
          true,
          "",
          "We'll send summaries once a week.",
        ),
      },
    ],
    a11y: [
      {
        criterion: "1.3.1 Info and Relationships",
        level: "A",
        description:
          "A hidden native <input type=checkbox> is always present. The visible custom box is aria-hidden.",
      },
      {
        criterion: "2.1.1 Keyboard",
        level: "A",
        description:
          "Focusable and toggleable with Space. Tab moves focus to/from the checkbox.",
      },
      {
        criterion: "2.4.7 Focus Visible",
        level: "AA",
        description:
          "Focus ring renders on keyboard focus via :focus-visible detection.",
      },
      {
        criterion: "4.1.2 Name, Role, Value",
        level: "A",
        description:
          "Role is conveyed by the native input element. Indeterminate state is set via the indeterminate property on the DOM node.",
      },
    ],
    aiMeta: {
      component: "Checkbox",
      role: "data-entry",
      hierarchyLevel: "primary",
      interactionModel: "synchronous",
      layoutImpact: "inline",
      destructiveVariants: [],
      accessibilityContract: {
        keyboard: true,
        focusRing: "required",
        nativeInputPreserved: true,
        indeterminateDomProperty: true,
      },
      variants: ["default", "error", "disabled"],
      aiGuidance: [
        "Always provide a label prop or a wrapping <label> — never rely on adjacent text alone.",
        "Use indeterminate for 'select all' patterns when partial selection exists.",
        "Group related checkboxes in a <fieldset> with a <legend>.",
        "For single boolean toggles, prefer Checkbox over a custom toggle switch.",
      ],
    },
  };
}
