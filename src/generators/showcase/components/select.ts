import type { DesignSystemConfig } from "../../../types/index";
import type { ComponentDef } from "../types";
import { esc, componentTokens } from "../types";

export function selectDef(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
): ComponentDef {
  const { radiusMd, ff } = componentTokens(config, tokens);
  const r = `${radiusMd}px`;

  const C = {
    text: "var(--color-text-primary, #0f172a)",
    textSecondary: "var(--color-text-secondary, #64748b)",
    bg: "var(--color-bg-default, #fff)",
    border: "var(--color-border-default, #e2e8f0)",
  };

  const chevron = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${C.textSecondary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

  const selectHtml = (
    label: string,
    placeholder: string,
    options: string[] = [],
    borderColor = C.border,
    helperHtml = "",
    disabled = false,
  ) => `
    <div class="ds-field" style="font-family:${esc(ff)};max-width:320px;${disabled ? "opacity:0.5" : ""}">
      <label class="ds-label" style="color:${C.text}">${esc(label)}</label>
      <div style="position:relative;display:flex;align-items:center;background:${C.bg};border:1px solid ${borderColor};border-radius:${r}">
        <select style="flex:1;appearance:none;-webkit-appearance:none;background:${C.bg};border:none;outline:none;padding:8px 32px 8px 12px;font-size:14px;color:${C.text};cursor:${disabled ? "not-allowed" : "pointer"};width:100%" ${disabled ? "disabled" : ""}>
          <option value="" disabled selected style="color:${C.textSecondary}">${esc(placeholder)}</option>
          ${options.map((o) => `<option>${esc(o)}</option>`).join("")}
        </select>
        <span style="position:absolute;right:8px;display:flex;align-items:center;pointer-events:none">${chevron}</span>
      </div>
      ${helperHtml}
    </div>`;

  return {
    id: "select",
    label: "Select",
    description:
      "Dropdown picker for selecting from a list of options. Wraps native <select> for full accessibility.",
    overviewHtml: `
      <div class="comp-overview-section">
        <div class="comp-overview-label">States</div>
        <div class="comp-preview-col">
          ${selectHtml("Country", "Select a country…", ["Norway", "Sweden", "Denmark"], C.border, `<span style="font-size:12px;color:${C.textSecondary};margin-top:2px">Select your country of residence.</span>`)}
          ${selectHtml("Role", "Select a role…", ["Admin", "Editor", "Viewer"], C.border, `<span style="font-size:12px;color:${C.textSecondary};margin-top:2px">Role determines what permissions this user has.</span>`)}
          ${selectHtml("Priority", "Select a priority…", ["Low", "Medium", "High"], "#dc2626", `<span style="font-size:12px;color:#dc2626;margin-top:2px">Please select a priority level.</span>`)}
          ${selectHtml("Status", "Select a status…", ["Active", "Inactive"], C.border, "", true)}
        </div>
      </div>`,
    props: [
      {
        name: "label",
        type: "string",
        default: "—",
        required: false,
        description: "Visible label rendered above the select.",
      },
      {
        name: "options",
        type: "SelectOption[]",
        default: "—",
        required: false,
        description:
          "Structured option list. Alternatively, pass <option> children directly.",
      },
      {
        name: "placeholder",
        type: "string",
        default: "—",
        required: false,
        description: "Disabled first option shown when no value is selected.",
      },
      {
        name: "errorMessage",
        type: "string",
        default: "—",
        required: false,
        description: "Validation message. Also applies error border styling.",
      },
      {
        name: "helperText",
        type: "string",
        default: "—",
        required: false,
        description: "Secondary text shown below the select (no error state).",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        required: false,
        description: "Controls padding and font size.",
      },
      {
        name: "fullWidth",
        type: "boolean",
        default: "false",
        required: false,
        description: "Expands the select to fill its container.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        required: false,
        description: "Prevents interaction and applies reduced opacity.",
      },
    ],
    examples: [
      {
        label: "Using options prop",
        description: "Pass a structured array for programmatic option lists.",
        code: `<Select
  label="Framework"
  placeholder="Choose a framework…"
  options={[
    { value: "react", label: "React" },
    { value: "vue", label: "Vue" },
    { value: "svelte", label: "Svelte" },
  ]}
  onChange={(e) => console.log(e.target.value)}
/>`,
        previewHtml: `<div class="ds-field" style="font-family:${esc(ff)};max-width:320px">
          <label class="ds-label" style="color:${C.text}">Framework</label>
          <div style="position:relative;display:flex;align-items:center;background:${C.bg};border:1px solid ${C.border};border-radius:${r}">
            <select style="flex:1;appearance:none;-webkit-appearance:none;background:${C.bg};border:none;outline:none;padding:8px 32px 8px 12px;font-size:14px;color:${C.text};cursor:pointer;width:100%">
              <option value="" disabled selected style="color:${C.textSecondary}">Choose a framework…</option>
              <option>React</option>
              <option>Vue</option>
              <option>Svelte</option>
            </select>
            <span style="position:absolute;right:8px;display:flex;align-items:center;pointer-events:none">${chevron}</span>
          </div>
        </div>`,
      },
      {
        label: "With validation error",
        description:
          "Pass errorMessage to show inline validation and apply error styling.",
        code: `<Select
  label="Department"
  placeholder="Select department"
  errorMessage="Please select a department."
/>`,
        previewHtml: selectHtml(
          "Department",
          "Select a department…",
          ["Engineering", "Design", "Product"],
          "#dc2626",
          `<span style="font-size:12px;color:#dc2626;margin-top:2px">Please select a department.</span>`,
        ),
      },
    ],
    a11y: [
      {
        criterion: "1.3.1 Info and Relationships",
        level: "A",
        description:
          "The native <select> is always rendered. The custom chevron icon is aria-hidden. Label is associated via htmlFor/id.",
      },
      {
        criterion: "2.1.1 Keyboard",
        level: "A",
        description:
          "Native <select> is fully keyboard accessible. Arrow keys navigate options; Enter or Space opens the dropdown.",
      },
      {
        criterion: "3.3.1 Error Identification",
        level: "A",
        description:
          "When errorMessage is present, the select receives aria-invalid='true' and aria-describedby pointing to the error.",
      },
      {
        criterion: "4.1.2 Name, Role, Value",
        level: "A",
        description:
          "Role and value state are communicated by the native select element — no ARIA additions needed.",
      },
    ],
    aiMeta: {
      component: "Select",
      role: "data-entry",
      hierarchyLevel: "primary",
      interactionModel: "synchronous",
      layoutImpact: "block",
      destructiveVariants: [],
      accessibilityContract: {
        keyboard: true,
        nativeSelectPreserved: true,
        ariaInvalidOnError: true,
      },
      variants: ["default", "error", "disabled"],
      aiGuidance: [
        "Use Select for lists of 4+ options; use RadioGroup for 2–3 mutually exclusive choices.",
        "Always provide a label — never rely on placeholder alone.",
        "For multi-select, use native multiple attribute or a custom multi-select component.",
        "options prop and children are mutually exclusive — use one approach consistently.",
      ],
    },
  };
}
