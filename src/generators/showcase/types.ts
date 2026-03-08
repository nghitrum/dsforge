import type { DesignSystemConfig } from "../../types/index";

// ─── HTML helpers ─────────────────────────────────────────────────────────────

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function isHex(v: string): boolean {
  return /^#[0-9a-fA-F]{3,8}$/.test(v);
}

export function hexLuminance(hex: string): number {
  const c = hex.replace("#", "");
  const full =
    c.length === 3
      ? c
          .split("")
          .map((x) => x + x)
          .join("")
      : c;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const toLinear = (x: number) =>
    x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function textOnColor(hex: string): string {
  return hexLuminance(hex) > 0.35 ? "#111827" : "#ffffff";
}

// ─── Component doc types ──────────────────────────────────────────────────────

export interface PropDef {
  name: string;
  type: string;
  default: string;
  required: boolean;
  description: string;
}

export interface ExampleDef {
  label: string;
  description: string;
  code: string;
  previewHtml: string;
}

export interface A11yItem {
  criterion: string;
  level: "A" | "AA" | "AAA";
  description: string;
}

export interface AiMeta {
  component: string;
  role: string;
  hierarchyLevel: string;
  interactionModel: string;
  layoutImpact: string;
  destructiveVariants: string[];
  accessibilityContract: Record<string, string | boolean>;
  variants: string[];
  aiGuidance: string[];
}

export interface ComponentDef {
  id: string;
  label: string;
  description: string;
  overviewHtml: string;
  props: PropDef[];
  examples: ExampleDef[];
  a11y: A11yItem[];
  aiMeta: AiMeta;
}

// ─── Token helper ─────────────────────────────────────────────────────────────

export function componentTokens(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
) {
  return {
    action: tokens["semantic.color-action"] ?? "#2563eb",
    actionHover: tokens["semantic.color-action-hover"] ?? "#1d4ed8",
    actionText: tokens["semantic.color-text-on-color"] ?? "#ffffff",
    bg: tokens["semantic.color-bg-default"] ?? "#ffffff",
    border: tokens["semantic.color-border-default"] ?? "#e2e8f0",
    text: tokens["semantic.color-text-primary"] ?? "#0f172a",
    textSecondary: tokens["semantic.color-text-secondary"] ?? "#64748b",
    radiusMd: config.radius?.["md"] ?? 4,
    radiusLg: config.radius?.["lg"] ?? 8,
    ff: config.typography?.fontFamily ?? "system-ui, sans-serif",
  };
}
