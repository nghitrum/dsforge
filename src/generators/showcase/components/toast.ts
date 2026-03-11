import type { DesignSystemConfig } from "../../../types/index";
import type { ComponentDef } from "../types";
import { esc, componentTokens } from "../types";

export function toastDef(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
): ComponentDef {
  const { radiusMd, ff } = componentTokens(config, tokens);
  const r = `${radiusMd}px`;

  type VariantSpec = { name: string; bg: string; border: string; icon: string; label: string };
  const vDefault: VariantSpec = { name: "default", bg: "var(--color-bg-subtle, #f8fafc)", border: "var(--color-border-default, #e2e8f0)", icon: "var(--color-text-secondary, #6b7280)", label: "Default" };
  const vSuccess: VariantSpec = { name: "success", bg: "var(--color-success-subtle, #dcfce7)", border: "var(--color-success-border, #86efac)", icon: "var(--color-success, #16a34a)", label: "Success" };
  const vWarning: VariantSpec = { name: "warning", bg: "var(--color-warning-subtle, #fef9c3)", border: "var(--color-warning-border, #fde047)", icon: "var(--color-warning, #ca8a04)", label: "Warning" };
  const vDanger: VariantSpec  = { name: "danger",  bg: "var(--color-danger-subtle, #fee2e2)",  border: "var(--color-danger-border, #fca5a5)",  icon: "var(--color-danger, #dc2626)",  label: "Error" };
  const vInfo: VariantSpec    = { name: "info",    bg: "var(--color-info-subtle, #dbeafe)",    border: "var(--color-info-border, #93c5fd)",    icon: "var(--color-info, #2563eb)",    label: "Info" };
  const variants = [vDefault, vSuccess, vWarning, vDanger, vInfo];

  const icons: Record<string, string> = {
    default: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    danger: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };

  const alertHtml = (v: typeof variants[0], title: string, body: string) =>
    `<div role="alert" style="display:flex;gap:12px;padding:12px 16px;border-radius:${r};border:1px solid ${v.border};background:${v.bg};font-family:${esc(ff)};max-width:360px">
      <span style="color:${v.icon};flex-shrink:0;margin-top:1px">${icons[v.name]}</span>
      <div>
        <p style="margin:0;font-size:13px;font-weight:600;color:${v.icon}">${title}</p>
        <p style="margin:4px 0 0;font-size:13px;color:var(--color-text-secondary,#6b7280)">${body}</p>
      </div>
    </div>`;

  return {
    id: "toast",
    label: "Toast / Alert",
    description:
      "Feedback for user actions. Alert is inline and static; Toast is an overlay with auto-dismiss and a useToast() hook.",
    usageExample: `<Toast
  message="Changes saved successfully"
  variant="success"
  duration={3000}
  onDismiss={() => setToast(null)}
/>`,
    overviewHtml: `
      <div class="comp-overview-section">
        <div class="comp-overview-label">Alert — inline variants</div>
        <div class="comp-preview-col">
          ${variants.map((v) => alertHtml(v, v.label, `This is a ${v.name} alert message.`)).join("\n          ")}
        </div>
      </div>`,
    props: [
      {
        name: "variant",
        type: '"default" | "success" | "warning" | "danger" | "info"',
        default: '"default"',
        required: false,
        description: "Semantic color and icon variant.",
      },
      {
        name: "title",
        type: "string",
        default: "—",
        required: false,
        description: "Bold heading rendered above the message body.",
      },
      {
        name: "dismissible",
        type: "boolean",
        default: "false",
        required: false,
        description: "[Alert] Shows a close button. Hides the alert on click.",
      },
      {
        name: "onDismiss",
        type: "() => void",
        default: "—",
        required: false,
        description: "[Alert] Called after the alert is dismissed.",
      },
      {
        name: "message",
        type: "string",
        default: "—",
        required: true,
        description: "[Toast] The notification message body.",
      },
      {
        name: "duration",
        type: "number",
        default: "5000",
        required: false,
        description: "[Toast] Auto-dismiss delay in ms. Set to 0 to disable.",
      },
    ],
    examples: [
      {
        label: "Inline Alert",
        description: "Alert renders in-place within the page flow.",
        code: `<Alert variant="success" title="Payment confirmed">
  Your order #1234 has been placed successfully.
</Alert>`,
        previewHtml: alertHtml(
          vSuccess,
          "Payment confirmed",
          "Your order #1234 has been placed successfully.",
        ),
      },
      {
        label: "Dismissible Alert",
        description: "Add dismissible to show a close button.",
        code: `<Alert
  variant="warning"
  title="Your trial expires in 3 days"
  dismissible
  onDismiss={() => setShowBanner(false)}
>
  Upgrade to continue using all features.
</Alert>`,
        previewHtml: `<div role="alert" style="display:flex;gap:12px;padding:12px 16px;border-radius:${r};border:1px solid ${vWarning.border};background:${vWarning.bg};font-family:${esc(ff)};max-width:360px">
          <span style="color:${vWarning.icon};flex-shrink:0;margin-top:1px">${icons["warning"]}</span>
          <div style="flex:1">
            <p style="margin:0;font-size:13px;font-weight:600;color:${vWarning.icon}">Your trial expires in 3 days</p>
            <p style="margin:4px 0 0;font-size:13px;color:var(--color-text-secondary,#6b7280)">Upgrade to continue using all features.</p>
          </div>
          <button style="background:transparent;border:none;cursor:pointer;color:var(--color-text-secondary,#6b7280);padding:2px;flex-shrink:0" aria-label="Dismiss">✕</button>
        </div>`,
      },
      {
        label: "Toast via useToast()",
        description:
          "Wrap your app in ToastProvider, then call toast.add() from anywhere.",
        code: `// Wrap your app once
<ToastProvider>
  <App />
</ToastProvider>

// Inside any component
const toast = useToast();

toast.add({
  variant: "success",
  title: "Saved",
  message: "Your changes have been saved.",
  duration: 4000,
});`,
        previewHtml: `<div style="position:relative;background:var(--color-bg-subtle,#f8fafc);border:1px dashed var(--color-border-default,#e2e8f0);border-radius:${r};padding:20px;min-height:80px;font-family:${esc(ff)}">
          <p style="font-size:12px;color:var(--color-text-secondary,#6b7280);margin:0 0 12px">Bottom-right overlay (fixed position)</p>
          <div style="display:flex;gap:12px;padding:12px 16px;border-radius:${r};border:1px solid var(--color-success-border,#86efac);background:var(--color-success-subtle,#dcfce7);box-shadow:0 4px 12px rgba(0,0,0,0.12)">
            <span style="color:var(--color-success,#16a34a)">${icons["success"]}</span>
            <div>
              <p style="margin:0;font-size:13px;font-weight:600;color:var(--color-text-primary,#0f172a)">Saved</p>
              <p style="margin:4px 0 0;font-size:13px;color:var(--color-text-secondary,#6b7280)">Your changes have been saved.</p>
            </div>
            <button style="background:transparent;border:none;cursor:pointer;color:var(--color-text-secondary,#6b7280);padding:2px" aria-label="Dismiss">✕</button>
          </div>
        </div>`,
      },
    ],
    a11y: [
      {
        criterion: "4.1.3 Status Messages",
        level: "AA",
        description:
          "Alert uses role='alert' for immediate announcements. Toast container uses aria-live='polite' so screen readers announce without interrupting.",
      },
      {
        criterion: "2.2.1 Timing Adjustable",
        level: "A",
        description:
          "duration prop controls auto-dismiss timing. Set to 0 to disable. Users can also dismiss manually with the close button.",
      },
      {
        criterion: "2.1.1 Keyboard",
        level: "A",
        description:
          "The dismiss button is keyboard focusable and activatable. Toast overlay does not trap focus.",
      },
      {
        criterion: "1.4.3 Contrast (Minimum)",
        level: "AA",
        description:
          "All variant text/background pairs are selected to meet 4.5:1 contrast for body text.",
      },
    ],
    aiMeta: {
      component: "Toast",
      role: "feedback",
      hierarchyLevel: "utility",
      interactionModel: "asynchronous",
      layoutImpact: "overlay",
      destructiveVariants: [],
      accessibilityContract: {
        alertRoleForInline: true,
        ariaLivePoliteForToasts: true,
        dismissButtonRequired: "when-dismissible",
      },
      variants: ["default", "success", "warning", "danger", "info"],
      aiGuidance: [
        "Use Alert for inline, contextual feedback tied to a form or page section.",
        "Use Toast (via useToast) for transient system-level feedback after async actions.",
        "Never use Toast for error messages that the user must act on — use Alert instead.",
        "Keep toast messages under 80 characters — they are ephemeral.",
      ],
    },
  };
}
