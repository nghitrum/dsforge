import type { DesignSystemConfig } from "../../../types/index";
import type { ComponentDef } from "../types";
import { esc, componentTokens } from "../types";

export function spinnerDef(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
): ComponentDef {
  const { ff } = componentTokens(config, tokens);

  const C = {
    action: "#2563eb",
    textSecondary: "#6b7280",
    bg: "var(--color-bg-default, #fff)",
  };

  const svgSpinner = (size: number, color: string, strokeWidth = 2) => {
    const r = size / 2 - strokeWidth;
    const c = 2 * Math.PI * r;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" style="color:${color};animation:dsforge-spin 0.75s linear infinite;display:block">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="currentColor" stroke-width="${strokeWidth}" opacity="0.2"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c * 0.25}"
        transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>`;
  };

  return {
    id: "spinner",
    label: "Spinner",
    description:
      "Loading indicator for async operations. Includes a visually hidden status label for screen readers.",
    usageExample: `<Spinner size="lg" label="Saving your changes" />`,
    overviewHtml: `
      <div class="comp-overview-section">
        <div class="comp-overview-label">Sizes</div>
        <div class="comp-preview-row" style="align-items:center">
          ${svgSpinner(12, C.action, 2.5)}
          ${svgSpinner(16, C.action, 2.5)}
          ${svgSpinner(24, C.action, 2)}
          ${svgSpinner(32, C.action, 2)}
          ${svgSpinner(48, C.action, 1.5)}
        </div>
      </div>
      <div class="comp-overview-section">
        <div class="comp-overview-label">Variants</div>
        <div class="comp-preview-row" style="align-items:center">
          ${svgSpinner(24, C.textSecondary, 2)}
          ${svgSpinner(24, C.action, 2)}
          <span style="background:#1e293b;padding:8px;border-radius:6px;display:inline-flex">${svgSpinner(24, "#ffffff", 2)}</span>
        </div>
      </div>`,
    props: [
      {
        name: "size",
        type: '"xs" | "sm" | "md" | "lg" | "xl"',
        default: '"md"',
        required: false,
        description: "Controls the diameter and stroke width.",
      },
      {
        name: "variant",
        type: '"default" | "primary" | "inverted"',
        default: '"default"',
        required: false,
        description:
          "Color variant. Use inverted on dark backgrounds.",
      },
      {
        name: "label",
        type: "string",
        default: '"Loading…"',
        required: false,
        description:
          "Screen reader announcement. Rendered as visually hidden text inside role='status'.",
      },
    ],
    examples: [
      {
        label: "Inline loading state",
        description:
          "Use inside buttons or next to labels during async operations.",
        code: `<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  <Spinner size="sm" label="Saving changes" />
  <span>Saving…</span>
</div>`,
        previewHtml: `<div style="display:flex;align-items:center;gap:8px;font-family:${esc(ff)};font-size:14px;color:var(--color-text-primary,#0f172a)">
          ${svgSpinner(16, C.action, 2.5)}
          <span>Saving…</span>
        </div>`,
      },
      {
        label: "Full-page loader",
        description:
          "Center a large spinner during initial data fetching.",
        code: `<div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
  <Spinner size="lg" label="Loading dashboard" />
</div>`,
        previewHtml: `<div style="display:flex;justify-content:center;padding:32px;background:var(--color-bg-subtle,#f8fafc);border-radius:6px;border:1px solid #e2e8f0">
          ${svgSpinner(32, C.action, 2)}
        </div>`,
      },
      {
        label: "On dark background",
        description:
          "Use variant='inverted' when the spinner sits on a dark surface.",
        code: `<div style={{ background: '#1e293b', padding: 16, borderRadius: 8 }}>
  <Spinner variant="inverted" label="Loading" />
</div>`,
        previewHtml: `<div style="background:#1e293b;padding:16px;border-radius:6px;display:inline-flex">
          ${svgSpinner(24, "#ffffff", 2)}
        </div>`,
      },
    ],
    a11y: [
      {
        criterion: "4.1.3 Status Messages",
        level: "AA",
        description:
          "Spinner is wrapped in a <span role='status'>. The label prop is rendered as visually hidden text inside this element, ensuring screen readers announce the loading state.",
      },
      {
        criterion: "1.4.3 Contrast (Minimum)",
        level: "AA",
        description:
          "The spinner arc contrasts with its track. default and primary variants are validated against the configured background token.",
      },
      {
        criterion: "2.2.2 Pause, Stop, Hide",
        level: "A",
        description:
          "Spinner animations are driven by CSS. Users with prefers-reduced-motion can override these with a media query.",
      },
    ],
    aiMeta: {
      component: "Spinner",
      role: "loading-indicator",
      hierarchyLevel: "utility",
      interactionModel: "asynchronous",
      layoutImpact: "inline",
      destructiveVariants: [],
      accessibilityContract: {
        roleStatus: true,
        visuallyHiddenLabel: "required",
        reducedMotionSupported: true,
      },
      variants: ["default", "primary", "inverted"],
      aiGuidance: [
        "Always provide a meaningful label describing what is loading, not just 'Loading…'.",
        "Use sm size inside buttons; md for inline states; lg/xl for full-page loaders.",
        "Pair with aria-busy='true' on the container that is loading for extra screen reader context.",
        "Use inverted variant on dark surfaces (dark backgrounds, colored buttons).",
      ],
    },
  };
}
