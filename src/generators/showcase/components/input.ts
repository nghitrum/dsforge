import type { DesignSystemConfig } from "../../../types/index";
import type { ComponentDef } from "../types";
import { esc, componentTokens } from "../types";

export function inputDef(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
): ComponentDef {
  const { radiusMd, ff } = componentTokens(config, tokens);
  const r = `${radiusMd}px`;

  // CSS variable shortcuts
  const C = {
    text: "var(--color-text-primary, #0f172a)",
    textSecondary: "var(--color-text-secondary, #64748b)",
    bg: "var(--color-bg-default, #fff)",
    border: "var(--color-border-default, #e2e8f0)",
  };

  const fieldHtml = (
    label: string,
    opts: string,
    borderColor = C.border,
    helperHtml = "",
  ) => `
    <div class="ds-field" style="font-family:${esc(ff)};max-width:320px">
      <label class="ds-label" style="color:${C.text}">${label}</label>
      <input class="ds-input" style="border-color:${borderColor};border-radius:${r};color:${C.text};background:${C.bg}" ${opts} />
      ${helperHtml}
    </div>`;

  return {
    id: "input",
    label: "Input",
    description:
      "Single-line text field. Covers all standard input types with label, helper text, and validation states.",
    overviewHtml: `
      <div class="comp-overview-section">
        <div class="comp-overview-label">States</div>
        <div class="comp-preview-col">
          ${fieldHtml("Default", 'placeholder="Placeholder text"')}
          ${fieldHtml("With value", 'value="Some input value"')}
          ${fieldHtml(
            "Error",
            'value="invalid@"',
            "#dc2626",
            `<span style="font-size:12px;color:#dc2626;margin-top:2px">Enter a valid email address</span>`,
          )}
          ${fieldHtml("Disabled", 'disabled placeholder="Disabled" style="opacity:0.5"')}
        </div>
      </div>`,
    props: [
      {
        name: "label",
        type: "string",
        default: "—",
        required: true,
        description:
          "Visible label rendered above the field. Also used as the accessible name.",
      },
      {
        name: "value",
        type: "string",
        default: "—",
        required: false,
        description: "Controlled value. Pair with onChange.",
      },
      {
        name: "onChange",
        type: "(value: string) => void",
        default: "—",
        required: false,
        description: "Fires on every keystroke.",
      },
      {
        name: "placeholder",
        type: "string",
        default: "—",
        required: false,
        description:
          "Hint text shown when value is empty. Not a substitute for label.",
      },
      {
        name: "type",
        type: '"text" | "email" | "password" | "number" | "search" | "tel" | "url"',
        default: '"text"',
        required: false,
        description: "HTML input type.",
      },
      {
        name: "error",
        type: "string",
        default: "—",
        required: false,
        description:
          "Validation message shown below the field. Triggers error styling.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        required: false,
        description: "Makes the field non-interactive.",
      },
      {
        name: "required",
        type: "boolean",
        default: "false",
        required: false,
        description: "Marks the field as required and sets aria-required.",
      },
      {
        name: "helperText",
        type: "string",
        default: "—",
        required: false,
        description:
          "Supplementary text below the field (shown when no error).",
      },
    ],
    examples: [
      {
        label: "Controlled input",
        description: "Typical controlled usage with value and onChange.",
        code: `const [email, setEmail] = useState('');

<Input
  label="Email address"
  type="email"
  value={email}
  onChange={setEmail}
  placeholder="you@example.com"
/>`,
        previewHtml: fieldHtml(
          "Email address",
          'type="email" placeholder="you@example.com"',
        ),
      },
      {
        label: "With validation error",
        description: "Pass an error string to show inline validation feedback.",
        code: `<Input
  label="Username"
  value="ab"
  error="Username must be at least 3 characters."
/>`,
        previewHtml: fieldHtml(
          "Username",
          'value="ab"',
          "#dc2626",
          `<span style="font-size:12px;color:#dc2626;margin-top:2px">Username must be at least 3 characters.</span>`,
        ),
      },
      {
        label: "Password field",
        description: "type='password' masks the value automatically.",
        code: `<Input
  label="Password"
  type="password"
  required
  helperText="Must be at least 8 characters."
/>`,
        previewHtml: `
          <div class="ds-field" style="font-family:${esc(ff)};max-width:320px">
            <label class="ds-label" style="color:${C.text}">Password <span style="color:#dc2626">*</span></label>
            <input class="ds-input" type="password" style="border-color:${C.border};border-radius:${r};color:${C.text};background:${C.bg}" placeholder="••••••••" />
            <span style="font-size:12px;color:${C.textSecondary};margin-top:2px">Must be at least 8 characters.</span>
          </div>`,
      },
    ],
    a11y: [
      {
        criterion: "1.3.1 Info and Relationships",
        level: "A",
        description:
          "Every input is programmatically associated with its label via htmlFor/id. Never use placeholder as a label.",
      },
      {
        criterion: "1.4.3 Contrast (Minimum)",
        level: "AA",
        description:
          "Text, placeholder, and border colour all meet WCAG AA at the configured token values.",
      },
      {
        criterion: "3.3.1 Error Identification",
        level: "A",
        description:
          "When an error is present, the field receives aria-invalid='true' and aria-describedby pointing to the error message.",
      },
      {
        criterion: "3.3.2 Labels or Instructions",
        level: "A",
        description:
          "The label prop is always rendered as a visible <label> element. helperText is associated via aria-describedby.",
      },
      {
        criterion: "4.1.2 Name, Role, Value",
        level: "A",
        description:
          "required maps to aria-required. disabled maps to the native disabled attribute, preventing all interaction.",
      },
    ],
    aiMeta: {
      component: "Input",
      role: "data-entry",
      hierarchyLevel: "atomic",
      interactionModel: "continuous",
      layoutImpact: "block",
      destructiveVariants: [],
      accessibilityContract: {
        labelRequired: true,
        ariaInvalidOnError: true,
        ariaDescribedByForHelper: true,
        ariaRequired: "mirrors-required-prop",
      },
      variants: ["default", "error", "disabled"],
      aiGuidance: [
        "Always provide a label — never rely on placeholder alone.",
        "Use error to surface validation results inline, not via alert/toast.",
        "For password fields always use type='password' — never type='text'.",
        "Group related inputs inside a <fieldset> with a <legend> for screen readers.",
      ],
    },
  };
}
