import { z } from "zod";

export const DesignSystemConfigSchema = z.object({
  typography: z.object({
    fontFamily: z.string(),
    scale: z
      .array(z.number().positive())
      .min(
        6,
        "typography.scale must have at least 6 entries (xs → 2xl). Example: [12, 14, 16, 20, 24, 32]",
      ),
    fontWeights: z
      .array(z.number().int().min(100).max(900))
      .min(
        3,
        "typography.fontWeights must have at least 3 entries (regular, medium, semibold). Example: [400, 500, 600]",
      ),
  }),
  spacing: z.object({
    baseUnit: z.number().positive(),
  }),
  radius: z.object({
    scale: z
      .array(z.number().nonnegative())
      .min(
        4,
        "radius.scale must have at least 4 entries (sm → xl). Example: [2, 4, 8, 16]",
      ),
  }),
  color: z.object({
    primary: z.string(),
    secondary: z.string(),
    danger: z.string(),
    background: z.string(),
    text: z.string(),
    surface: z.string().optional(), // elevated surfaces (sidebars, cards)
    border: z.string().optional(), // subtle dividers / outlines
    focus: z.string().optional(), // focus ring (defaults to primary)
    success: z.string().optional(), // positive feedback (copy confirm etc.)
    onPrimary: z.string().optional(), // text on primary-colored backgrounds
  }),
  shadow: z
    .object({
      none: z.string().optional(),
      small: z.string().optional(),
      medium: z.string().optional(),
    })
    .optional(),
  animation: z
    .object({
      duration: z.string().optional(),
      easing: z.string().optional(),
    })
    .optional(),
  darkMode: z
    .object({
      background: z.string().optional(), // default: #0f172a
      text: z.string().optional(), // default: #f1f5f9
      surface: z.string().optional(), // default: #1e293b
      border: z.string().optional(), // default: rgba(255,255,255,0.08)
      codeBg: z.string().optional(), // default: #1e293b
    })
    .optional(),
  philosophy: z.object({
    density: z.enum(["compact", "comfortable", "spacious"]),
    elevation: z.enum(["minimal", "moderate", "high"]),
  }),
});

export const GovernanceRulesSchema = z.object({
  button: z
    .object({
      allowedVariants: z.array(z.string()).optional(),
      maxWidth: z.string().optional(),
      colorPalette: z.array(z.string()).optional(),
      requiredAccessibility: z.array(z.string()).optional(),
    })
    .optional(),
  card: z
    .object({
      maxWidth: z.string().optional(),
      borderRadius: z.array(z.string()).optional(),
      allowedShadows: z.array(z.string()).optional(),
    })
    .optional(),
  input: z
    .object({
      allowedTypes: z.array(z.string()).optional(),
      requiredAccessibility: z.array(z.string()).optional(),
    })
    .optional(),
});

export type DesignSystemConfig = z.infer<typeof DesignSystemConfigSchema>;
export type GovernanceRules = z.infer<typeof GovernanceRulesSchema>;

export interface ComponentMetadata {
  component: string;
  role: string;
  hierarchyLevel: string;
  interactionModel: string;
  layoutImpact: string;
  destructive: boolean;
  accessibilityContract: {
    keyboard: boolean;
    focusRing: string;
    ariaLabel?: string;
  };
  variants?: string[];
  tokens: Record<string, string>;
}

export interface ValidationResult {
  component: string;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationIssue {
  rule: string;
  message: string;
  severity: "error" | "warning";
}

export interface GenerationContext {
  config: DesignSystemConfig;
  rules: GovernanceRules;
  outputDir: string;
}

// ─── Resolved design tokens ───────────────────────────────────────────────────
// Single source of truth — derived from DesignSystemConfig by resolveTokens().
// All generators consume ONLY these resolved values — no hardcoding elsewhere.

export interface ResolvedTokens {
  // ── Colors ─────────────────────────────────────────────────────────────
  colorPrimary: string; // brand / interactive
  colorSecondary: string; // muted / supporting
  colorDanger: string; // destructive / error
  colorBackground: string; // page background
  colorText: string; // body text
  colorSurface: string; // elevated surface (cards, sidebar)
  colorBorder: string; // subtle borders
  colorFocus: string; // focus ring base colour
  colorSuccess: string; // positive feedback
  colorOnPrimary: string; // text/icon on primary-coloured backgrounds
  colorCodeBg: string; // inline-code / snippet background
  // Dark-mode counterparts (used to emit CSS custom property overrides)
  darkBackground: string;
  darkText: string;
  darkSurface: string;
  darkBorder: string;
  darkCodeBg: string;

  // ── Shadows ─────────────────────────────────────────────────────────────
  shadowNone: string;
  shadowSmall: string;
  shadowMedium: string;

  // ── Focus ring ───────────────────────────────────────────────────────────
  focusRing: string; // full box-shadow value

  // ── Typography ───────────────────────────────────────────────────────────
  fontFamily: string;
  // Size scale — named by role, not arbitrary index
  fontSizeXs: string; // scale[0]  e.g. 12px
  fontSizeSm: string; // scale[1]  e.g. 14px
  fontSizeMd: string; // scale[2]  e.g. 16px — body
  fontSizeLg: string; // scale[3]  e.g. 20px
  fontSizeXl: string; // scale[4]  e.g. 24px
  fontSize2xl: string; // scale[5]  e.g. 32px
  // UI chrome sizes (for labels, badges, nav items — sub-scale)
  fontSizeUiXs: string; // scale[0] − 2px, min 10px — tiny labels
  fontSizeUiSm: string; // scale[0]         — captions/meta
  fontSizeUiMd: string; // scale[1]         — nav items, table rows
  // Weights
  fontWeightRegular: number; // fontWeights[0]  400
  fontWeightMedium: number; // fontWeights[1]  500
  fontWeightSemibold: number; // fontWeights[2]  600
  // Line-heights per role
  lineHeightTight: number; // headings h1/h2   1.2–1.25
  lineHeightSnug: number; // headings h3/h4   1.35–1.4
  lineHeightNormal: number; // body copy        1.5–1.6
  lineHeightLoose: number; // small / caption  1.4–1.5

  // ── Spacing ──────────────────────────────────────────────────────────────
  // All derived from baseUnit × density multiplier
  spaceUnit: number; // raw px number — for computed gaps (gap * spaceUnit)
  spaceXs: string; // unit × 1
  spaceSm: string; // unit × 2
  spaceMd: string; // unit × 3
  spaceLg: string; // unit × 4
  spaceXl: string; // unit × 6
  space2xl: string; // unit × 8

  // ── Border ───────────────────────────────────────────────────────────────
  borderWidth: string; // always "1px" — but a token so it can be overridden

  // ── Radius ───────────────────────────────────────────────────────────────
  radiusSm: string; // scale[0]
  radiusMd: string; // scale[1]
  radiusLg: string; // scale[2]
  radiusXl: string; // scale[3]
  radiusFull: string; // pill / full round

  // ── Animation ────────────────────────────────────────────────────────────
  duration: string;
  durationFast: string; // half of duration — micro-interactions
  easing: string;
  transition: string; // convenience: `all ${duration} ${easing}`
}
