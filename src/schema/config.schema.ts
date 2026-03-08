import { z } from "zod";

// ─── Primitives ───────────────────────────────────────────────────────────────

const RawValueSchema = z.union([z.string(), z.number()]);

/**
 * TokenValue: either a raw value or a {layer.key} reference.
 * We accept any string as TokenValue here; the resolver validates references.
 */
const TokenValueSchema = RawValueSchema;

const CssLengthSchema = z
  .string()
  .regex(
    /^\d+(\.\d+)?(px|rem|em|%|vw|vh)?$/,
    "Must be a valid CSS length (e.g. '4px', '0.25rem')",
  );

// ─── Token Layers ─────────────────────────────────────────────────────────────

const GlobalTokensSchema = z
  .record(z.string(), RawValueSchema)
  .describe("Layer 1: primitive raw values only. No {references} allowed.");

const SemanticTokensSchema = z
  .record(z.string(), TokenValueSchema)
  .describe("Layer 2: intent-named tokens. May reference {global.*} tokens.");

const ComponentTokensSchema = z
  .record(z.string(), TokenValueSchema)
  .describe("Layer 3: component-specific. May reference global or semantic.");

export const TokenLayersSchema = z.object({
  global: GlobalTokensSchema.optional(),
  semantic: SemanticTokensSchema.optional(),
  component: ComponentTokensSchema.optional(),
});

// ─── Color ────────────────────────────────────────────────────────────────────

const ColorSurfaceSchema = z.object({
  default: TokenValueSchema,
  subtle: TokenValueSchema.optional(),
  overlay: TokenValueSchema.optional(),
  inverse: TokenValueSchema.optional(),
});

const ColorBorderSchema = z.object({
  default: TokenValueSchema,
  strong: TokenValueSchema.optional(),
  focus: TokenValueSchema.optional(),
  subtle: TokenValueSchema.optional(),
});

const ColorTextSchema = z.object({
  primary: TokenValueSchema,
  secondary: TokenValueSchema.optional(),
  disabled: TokenValueSchema.optional(),
  inverse: TokenValueSchema.optional(),
  onColor: TokenValueSchema.optional(),
});

const StatusColorSetSchema = z.object({
  bg: TokenValueSchema,
  fg: TokenValueSchema,
  border: TokenValueSchema.optional(),
});

const ColorStatusSchema = z.object({
  success: StatusColorSetSchema.optional(),
  warning: StatusColorSetSchema.optional(),
  danger: StatusColorSetSchema.optional(),
  info: StatusColorSetSchema.optional(),
});

const InteractiveStateSetSchema = z.object({
  rest: TokenValueSchema,
  hover: TokenValueSchema,
  active: TokenValueSchema,
  disabled: TokenValueSchema,
  selected: TokenValueSchema.optional(),
});

const ColorInteractiveSchema = z.object({
  primary: InteractiveStateSetSchema.optional(),
  secondary: InteractiveStateSetSchema.optional(),
  danger: InteractiveStateSetSchema.optional(),
});

export const ColorConfigSchema = z.object({
  surface: ColorSurfaceSchema.optional(),
  border: ColorBorderSchema.optional(),
  text: ColorTextSchema.optional(),
  status: ColorStatusSchema.optional(),
  interactive: ColorInteractiveSchema.optional(),
});

// ─── Typography ───────────────────────────────────────────────────────────────

const FontWeightSchema = z.union([
  z.literal(100),
  z.literal(200),
  z.literal(300),
  z.literal(400),
  z.literal(500),
  z.literal(600),
  z.literal(700),
  z.literal(800),
  z.literal(900),
]);

const TypographyRoleSchema = z.object({
  size: z.number().min(8).max(128).describe("Font size in px"),
  weight: FontWeightSchema,
  lineHeight: z
    .number()
    .min(0.8)
    .max(3)
    .describe("Unitless line height multiplier"),
  letterSpacing: z.union([z.string(), z.number()]).optional(),
  fontFamily: z.string().optional(),
});

export const TypographyConfigSchema = z.object({
  fontFamily: z.string().min(1),
  roles: z
    .object({
      display: TypographyRoleSchema.optional(),
      h1: TypographyRoleSchema.optional(),
      h2: TypographyRoleSchema.optional(),
      h3: TypographyRoleSchema.optional(),
      body: TypographyRoleSchema.optional(),
      small: TypographyRoleSchema.optional(),
      caption: TypographyRoleSchema.optional(),
      label: TypographyRoleSchema.optional(),
      code: TypographyRoleSchema.optional(),
    })
    .optional(),
  /** Legacy — kept for backward compat; prefer roles */
  scale: z.array(z.number().positive()).optional(),
  fontWeights: z.array(FontWeightSchema).optional(),
});

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const SpacingConfigSchema = z.object({
  baseUnit: z.number().positive().optional(),
  scale: z.record(z.string(), z.number().nonnegative()).optional(),
  semantic: z.record(z.string(), TokenValueSchema).optional(),
});

// ─── Radius ──────────────────────────────────────────────────────────────────

export const RadiusConfigSchema = z
  .record(z.string(), z.number().nonnegative())
  .describe(
    "Named border-radius values in px. Keys: none, sm, md, lg, xl, full",
  );

// ─── Elevation ───────────────────────────────────────────────────────────────

export const ElevationConfigSchema = z
  .record(z.string(), z.string())
  .describe(
    "Named shadow levels. Values are CSS box-shadow strings or 'none'.",
  );

// ─── Motion ──────────────────────────────────────────────────────────────────

const MotionDurationSchema = z.record(
  z.string(),
  z.number().nonnegative().describe("Duration in ms"),
);

const MotionEasingSchema = z.record(
  z.string(),
  z.string().describe("CSS easing value: keyword or cubic-bezier(...)"),
);

export const MotionConfigSchema = z.object({
  duration: MotionDurationSchema.optional(),
  easing: MotionEasingSchema.optional(),
});

// ─── States ──────────────────────────────────────────────────────────────────

const FocusRingSchema = z.object({
  color: TokenValueSchema,
  width: CssLengthSchema,
  offset: CssLengthSchema,
  style: z.enum(["solid", "dashed", "dotted"]).optional(),
});

export const StatesConfigSchema = z.object({
  hoverOpacity: z.number().min(0).max(1).optional(),
  activeOpacity: z.number().min(0).max(1).optional(),
  disabledOpacity: z.number().min(0).max(1).optional(),
  focusRing: FocusRingSchema.optional(),
});

// ─── Layout ──────────────────────────────────────────────────────────────────

const BreakpointsSchema = z.record(
  z.string(),
  z.number().positive().describe("Breakpoint width in px"),
);

const GridColumnsSchema = z.record(
  z.string(),
  z.number().int().positive().max(24),
);

const GridConfigSchema = z.object({
  columns: GridColumnsSchema.optional(),
  gutter: z.number().nonnegative().optional(),
  margin: z.number().nonnegative().optional(),
});

export const LayoutConfigSchema = z.object({
  breakpoints: BreakpointsSchema.optional(),
  grid: GridConfigSchema.optional(),
  container: z.record(z.string(), z.number().positive()).optional(),
});

// ─── Themes ──────────────────────────────────────────────────────────────────

export const ThemesConfigSchema = z
  .record(z.string(), z.record(z.string(), RawValueSchema))
  .describe(
    "Named themes. Each is a flat map of semantic token overrides. " +
      "Keys become CSS custom property names; values are concrete values.",
  );

// ─── Philosophy ───────────────────────────────────────────────────────────────

export const PhilosophyConfigSchema = z.object({
  density: z.enum(["compact", "comfortable", "spacious"]).optional(),
  elevation: z.enum(["minimal", "moderate", "expressive"]).optional(),
  motion: z.enum(["none", "reduced", "full"]).optional(),
});

// ─── Customization ────────────────────────────────────────────────────────────

export const CustomizationConfigSchema = z.object({
  extends: z.string().nullable().optional(),
  overrides: z.record(z.string(), RawValueSchema).optional(),
});

// ─── Meta ─────────────────────────────────────────────────────────────────────

export const MetaConfigSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(
      /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/,
      "Must be a valid npm package name",
    ),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+/, "Must be a valid semver string (e.g. 0.1.0)"),
  description: z.string().optional(),
  preset: z.enum(["compact", "comfortable", "spacious"]).optional(),
  npmScope: z
    .string()
    .regex(
      /^@[a-z0-9-~][a-z0-9-._~]*$/,
      "Must be a valid npm scope (e.g. @myorg)",
    )
    .optional(),
});

// ─── Root Schema ─────────────────────────────────────────────────────────────

export const DesignSystemConfigSchema = z.object({
  meta: MetaConfigSchema,
  tokens: TokenLayersSchema.optional(),
  themes: ThemesConfigSchema.optional(),
  color: ColorConfigSchema.optional(),
  typography: TypographyConfigSchema.optional(),
  spacing: SpacingConfigSchema.optional(),
  radius: RadiusConfigSchema.optional(),
  elevation: ElevationConfigSchema.optional(),
  motion: MotionConfigSchema.optional(),
  states: StatesConfigSchema.optional(),
  layout: LayoutConfigSchema.optional(),
  philosophy: PhilosophyConfigSchema.optional(),
  customization: CustomizationConfigSchema.optional(),
});

// ─── Rules Schema ─────────────────────────────────────────────────────────────

const A11yRuleSchema = z.object({
  keyboard: z.boolean().optional(),
  focusRing: z.boolean().optional(),
  ariaLabel: z.enum(["required", "optional", "forbidden"]).optional(),
  role: z.string().optional(),
});

const ComponentRuleSchema = z.object({
  allowedVariants: z.array(z.string()).optional(),
  requiredProps: z.array(z.string()).optional(),
  maxWidth: z.string().optional(),
  allowedRadius: z.array(z.string()).optional(),
  allowedShadows: z.array(z.string()).optional(),
  colorPalette: z.array(z.string()).optional(),
  tokens: z.record(z.string(), TokenValueSchema).optional(),
  a11y: A11yRuleSchema.optional(),
});

export const RulesConfigSchema = z.record(z.string(), ComponentRuleSchema);

// ─── Inferred types from Zod (source of truth for runtime) ────────────────────

export type DesignSystemConfigInput = z.input<typeof DesignSystemConfigSchema>;
export type DesignSystemConfigOutput = z.output<
  typeof DesignSystemConfigSchema
>;
export type RulesConfigInput = z.input<typeof RulesConfigSchema>;
