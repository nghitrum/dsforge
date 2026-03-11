import type { DesignSystemConfig } from "../../../types/index";
import type { ComponentDef } from "../types";
import { esc, componentTokens } from "../types";

export function radioDef(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
): ComponentDef {
  const { ff } = componentTokens(config, tokens);

  const C = {
    action: "#2563eb",
    text: "var(--color-text-primary, #0f172a)",
    textSecondary: "var(--color-text-secondary, #64748b)",
    border: "var(--color-border-default, #e2e8f0)",
    bg: "var(--color-bg-default, #fff)",
  };

  const circleHtml = (selected: boolean) => {
    const borderColor = selected ? C.action : C.border;
    return `<span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;border:2px solid ${borderColor};background:${C.bg};flex-shrink:0">
      ${selected ? `<span style="width:8px;height:8px;border-radius:50%;background:${C.action}"></span>` : ""}
    </span>`;
  };

  const radioHtml = (label: string, selected: boolean, opts = "") =>
    `<label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-family:${esc(ff)};${opts}">
      ${circleHtml(selected)}
      <span style="font-size:14px;color:${C.text}">${label}</span>
    </label>`;

  return {
    id: "radio",
    label: "Radio",
    description:
      "Single selection within a mutually exclusive group. Always pair Radio with RadioGroup.",
    usageExample: `<Radio label="Option A" name="choice" value="a" checked={choice === 'a'} onChange={() => setChoice('a')} />
<Radio label="Option B" name="choice" value="b" checked={choice === 'b'} onChange={() => setChoice('b')} />`,
    overviewHtml: `
      <div class="comp-overview-section">
        <div class="comp-overview-label">RadioGroup (vertical)</div>
        <div class="comp-preview-col">
          <fieldset style="border:none;padding:0;margin:0;font-family:${esc(ff)}">
            <legend style="font-size:13px;font-weight:600;color:${C.text};margin-bottom:8px">Notification preference</legend>
            <div class="comp-preview-col">
              ${radioHtml("Email", true)}
              ${radioHtml("SMS", false)}
              ${radioHtml("Push notification", false)}
            </div>
          </fieldset>
        </div>
      </div>
      <div class="comp-overview-section">
        <div class="comp-overview-label">Horizontal layout</div>
        <div class="comp-preview-row">
          ${radioHtml("Monthly", true)}
          ${radioHtml("Quarterly", false)}
          ${radioHtml("Annually", false)}
        </div>
      </div>`,
    props: [
      {
        name: "label",
        type: "string",
        default: "—",
        required: false,
        description: "Visible label rendered next to the radio circle.",
      },
      {
        name: "value",
        type: "string",
        default: "—",
        required: false,
        description:
          "The value submitted when this radio is selected. Required when used inside RadioGroup.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        required: false,
        description: "Controls radio and label size.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        required: false,
        description: "Prevents interaction and applies reduced opacity.",
      },
      {
        name: "legend",
        type: "string",
        default: "—",
        required: true,
        description:
          "[RadioGroup] Accessible group label read by screen readers.",
      },
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"vertical"',
        required: false,
        description: "[RadioGroup] Layout direction of the radio items.",
      },
      {
        name: "onChange",
        type: "(value: string) => void",
        default: "—",
        required: false,
        description: "[RadioGroup] Fires when the selected value changes.",
      },
    ],
    examples: [
      {
        label: "Controlled RadioGroup",
        description:
          "Wrap Radio buttons inside RadioGroup for proper grouping and keyboard navigation.",
        code: `const [plan, setPlan] = useState("monthly");

<RadioGroup
  legend="Billing cycle"
  value={plan}
  onChange={setPlan}
>
  <Radio value="monthly" label="Monthly" />
  <Radio value="annual" label="Annual (save 20%)" />
</RadioGroup>`,
        previewHtml: `<fieldset style="border:none;padding:0;margin:0;font-family:${esc(ff)}">
          <legend style="font-size:13px;font-weight:600;color:${C.text};margin-bottom:8px">Billing cycle</legend>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${radioHtml("Monthly", true)}
            ${radioHtml("Annual (save 20%)", false)}
          </div>
        </fieldset>`,
      },
      {
        label: "Horizontal orientation",
        description: "Use orientation='horizontal' for compact inline layouts.",
        code: `<RadioGroup legend="Size" orientation="horizontal" defaultValue="md">
  <Radio value="sm" label="S" />
  <Radio value="md" label="M" />
  <Radio value="lg" label="L" />
</RadioGroup>`,
        previewHtml: `<fieldset style="border:none;padding:0;margin:0;font-family:${esc(ff)}">
          <legend style="font-size:13px;font-weight:600;color:${C.text};margin-bottom:8px">Size</legend>
          <div style="display:flex;gap:16px">
            ${radioHtml("S", false)}
            ${radioHtml("M", true)}
            ${radioHtml("L", false)}
          </div>
        </fieldset>`,
      },
    ],
    a11y: [
      {
        criterion: "1.3.1 Info and Relationships",
        level: "A",
        description:
          "RadioGroup renders a native <fieldset> with <legend>. Individual radios are native <input type=radio> elements — role and grouping are implicit.",
      },
      {
        criterion: "2.1.1 Keyboard",
        level: "A",
        description:
          "Arrow keys cycle through options within the group. Tab moves focus to/from the group.",
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
          "Selected state is communicated via the native checked attribute. Name grouping is handled by RadioGroup context.",
      },
    ],
    aiMeta: {
      component: "Radio",
      role: "data-entry",
      hierarchyLevel: "primary",
      interactionModel: "synchronous",
      layoutImpact: "inline",
      destructiveVariants: [],
      accessibilityContract: {
        keyboard: true,
        focusRing: "required",
        mustUseRadioGroup: true,
        nativeInputPreserved: true,
      },
      variants: ["default", "disabled"],
      aiGuidance: [
        "Always wrap Radio inside RadioGroup — never render standalone Radio elements.",
        "Use radio buttons when the user must pick exactly one option from a small set (2–7 items).",
        "For longer lists, prefer Select instead.",
        "The legend prop is required on RadioGroup and must describe the choice being made.",
      ],
    },
  };
}
