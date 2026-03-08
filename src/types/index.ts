// ─── Token Reference ─────────────────────────────────────────────────────────
// A string of the form "{layer.key}" or "{path.to.nested}" is a token reference.
// Raw values (hex, px, numbers) are plain strings.

/** A raw CSS/design value: hex, px, number, CSS shadow string, etc. */
export type RawValue = string | number;

/** An unresolved token reference, e.g. "{global.blue-600}" */
export type TokenRef = `{${string}}`;

/** Either a raw value or a reference to be resolved */
export type TokenValue = RawValue | TokenRef;

// ─── Token Layers ─────────────────────────────────────────────────────────────

/** Layer 1: primitive, raw values only. No references allowed. */
export type GlobalTokens = Record<string, RawValue>;

/** Layer 2: intent-named tokens. May reference global tokens. */
export type SemanticTokens = Record<string, TokenValue>;

/** Layer 3: component-specific. May reference global or semantic. */
export type ComponentTokens = Record<string, TokenValue>;

export interface TokenLayers {
  global?: GlobalTokens;
  semantic?: SemanticTokens;
  component?: ComponentTokens;
}

// ─── Color ────────────────────────────────────────────────────────────────────

export interface ColorSurface {
  default: TokenValue;
  subtle?: TokenValue;
  overlay?: TokenValue;
  inverse?: TokenValue;
}

export interface ColorBorder {
  default: TokenValue;
  strong?: TokenValue;
  focus?: TokenValue;
  subtle?: TokenValue;
}

export interface ColorText {
  primary: TokenValue;
  secondary?: TokenValue;
  disabled?: TokenValue;
  inverse?: TokenValue;
  /** Text on top of a colored background, e.g. button label */
  onColor?: TokenValue;
}

export interface StatusColorSet {
  bg: TokenValue;
  fg: TokenValue;
  border?: TokenValue;
}

export interface ColorStatus {
  success?: StatusColorSet;
  warning?: StatusColorSet;
  danger?: StatusColorSet;
  info?: StatusColorSet;
}

export interface InteractiveStateSet {
  rest: TokenValue;
  hover: TokenValue;
  active: TokenValue;
  disabled: TokenValue;
  selected?: TokenValue;
}

export interface ColorInteractive {
  primary?: InteractiveStateSet;
  secondary?: InteractiveStateSet;
  danger?: InteractiveStateSet;
}

export interface ColorConfig {
  surface?: ColorSurface;
  border?: ColorBorder;
  text?: ColorText;
  status?: ColorStatus;
  interactive?: ColorInteractive;
}

// ─── Typography ───────────────────────────────────────────────────────────────

export interface TypographyRole {
  size: number;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  lineHeight: number;
  letterSpacing?: string | number;
  fontFamily?: string;
}

export interface TypographyConfig {
  fontFamily: string;
  /** Semantic roles — the public API for type usage */
  roles?: {
    display?: TypographyRole;
    h1?: TypographyRole;
    h2?: TypographyRole;
    h3?: TypographyRole;
    body?: TypographyRole;
    small?: TypographyRole;
    caption?: TypographyRole;
    label?: TypographyRole;
    code?: TypographyRole;
  };
  /** Raw numeric scale — kept for legacy; prefer roles */
  scale?: number[];
  fontWeights?: number[];
}

// ─── Spacing ─────────────────────────────────────────────────────────────────

/** Named numeric scale: { "1": 4, "2": 8, ... } */
export type SpacingScale = Record<string, number>;

/** Semantic spacing tokens that reference scale values */
export type SpacingSemantic = Record<string, TokenValue>;

export interface SpacingConfig {
  /** The raw numeric multiplier grid (e.g., base-4) */
  baseUnit?: number;
  /** Pre-computed named scale derived from baseUnit */
  scale?: SpacingScale;
  /** Intent-named tokens: component-padding-md, layout-gap-sm, etc. */
  semantic?: SpacingSemantic;
}

// ─── Radius ───────────────────────────────────────────────────────────────────

export interface RadiusConfig {
  none?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  full?: number;
  [key: string]: number | undefined;
}

// ─── Elevation ───────────────────────────────────────────────────────────────

/** Named shadow levels. Key is level name ("0"–"4" or "none"/"sm"/"lg"). */
export type ElevationConfig = Record<string, string>;

// ─── Motion ──────────────────────────────────────────────────────────────────

export interface MotionDuration {
  instant?: number;
  fast?: number;
  normal?: number;
  slow?: number;
  deliberate?: number;
  [key: string]: number | undefined;
}

export interface MotionEasing {
  standard?: string;
  decelerate?: string;
  accelerate?: string;
  spring?: string;
  linear?: string;
  [key: string]: string | undefined;
}

export interface MotionConfig {
  duration?: MotionDuration;
  easing?: MotionEasing;
}

// ─── States ──────────────────────────────────────────────────────────────────

export interface FocusRing {
  color: TokenValue;
  width: string;
  offset: string;
  style?: "solid" | "dashed" | "dotted";
}

export interface StatesConfig {
  hoverOpacity?: number;
  activeOpacity?: number;
  disabledOpacity?: number;
  focusRing?: FocusRing;
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export type Breakpoints = {
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  "2xl"?: number;
  [key: string]: number | undefined;
};

export interface GridColumns {
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  [key: string]: number | undefined;
}

export interface GridConfig {
  columns?: GridColumns;
  gutter?: number;
  margin?: number;
}

export interface LayoutConfig {
  breakpoints?: Breakpoints;
  grid?: GridConfig;
  container?: Record<string, number>;
}

// ─── Themes ──────────────────────────────────────────────────────────────────

/**
 * A theme is a flat map of semantic token overrides.
 * At runtime, these become CSS custom property overrides on :root[data-theme="..."].
 */
export type ThemeOverrides = Record<string, RawValue>;

export type ThemesConfig = Record<string, ThemeOverrides>;

// ─── Philosophy ───────────────────────────────────────────────────────────────

export interface PhilosophyConfig {
  /** Component density: affects padding/spacing defaults */
  density?: "compact" | "comfortable" | "spacious";
  /** Shadow approach */
  elevation?: "minimal" | "moderate" | "expressive";
  /** Motion preference */
  motion?: "none" | "reduced" | "full";
}

// ─── Customization ────────────────────────────────────────────────────────────

export interface CustomizationConfig {
  /**
   * Package name to extend. Merged before applying local overrides.
   * e.g. "@myorg/base-design-system"
   */
  extends?: string | null;
  /**
   * Deep-merged token overrides on top of resolved base config.
   * Keys use dot-path notation: "tokens.semantic.color-action"
   */
  overrides?: Record<string, RawValue>;
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

export interface MetaConfig {
  name: string;
  version: string;
  description?: string;
  /** Preset profile applied at init time */
  preset?: "compact" | "comfortable" | "spacious";
  /** The npm scope for publishing, e.g. "@myorg" */
  npmScope?: string;
}

// ─── Root Config ─────────────────────────────────────────────────────────────

export interface DesignSystemConfig {
  meta: MetaConfig;
  tokens?: TokenLayers;
  themes?: ThemesConfig;
  color?: ColorConfig;
  typography?: TypographyConfig;
  spacing?: SpacingConfig;
  radius?: RadiusConfig;
  elevation?: ElevationConfig;
  motion?: MotionConfig;
  states?: StatesConfig;
  layout?: LayoutConfig;
  philosophy?: PhilosophyConfig;
  customization?: CustomizationConfig;
}

// ─── Rules ───────────────────────────────────────────────────────────────────

export interface ComponentRule {
  /** Allowed variant prop values */
  allowedVariants?: string[];
  /** Props that must always be provided */
  requiredProps?: string[];
  /** Max CSS width value */
  maxWidth?: string;
  /** Allowed borderRadius values (must exist in radius config) */
  allowedRadius?: string[];
  /** Allowed shadow levels (must exist in elevation config) */
  allowedShadows?: string[];
  /** Allowed color palette tokens for this component */
  colorPalette?: string[];
  /** Component-level token overrides */
  tokens?: Record<string, TokenValue>;
  /** Accessibility requirements */
  a11y?: {
    keyboard?: boolean;
    focusRing?: boolean;
    ariaLabel?: "required" | "optional" | "forbidden";
    role?: string;
  };
}

export type RulesConfig = Record<string, ComponentRule>;

// ─── Resolved types (post-resolution) ────────────────────────────────────────

/** A fully resolved token map: all {refs} replaced with concrete values */
export type ResolvedTokenMap = Record<string, string>;

export interface ResolvedConfig {
  /** The original config before resolution */
  source: DesignSystemConfig;
  /** All tokens resolved to concrete values, keyed by "layer.name" */
  tokens: ResolvedTokenMap;
  /** CSS custom property declarations per theme */
  themes: Record<string, Record<string, string>>;
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export class TokenResolutionError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "TokenResolutionError";
  }
}

export class CircularReferenceError extends TokenResolutionError {
  constructor(public readonly cycle: string[]) {
    const chain = cycle.join(" → ");
    super(`Circular token reference detected: ${chain}`, cycle[0] ?? "");
    this.name = "CircularReferenceError";
  }
}

export class UnresolvedReferenceError extends TokenResolutionError {
  constructor(
    refPath: string,
    public readonly fromToken: string,
  ) {
    super(
      `Token reference "{${refPath}}" in "${fromToken}" could not be resolved`,
      fromToken,
    );
    this.name = "UnresolvedReferenceError";
  }
}

// ─── Validation result ────────────────────────────────────────────────────────

export type IssueSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  path?: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  maxScore: number;
  issues: ValidationIssue[];
}
