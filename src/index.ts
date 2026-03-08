// Public API — usable as a library by other tools, CI scripts, etc.

// ─── Core engine ──────────────────────────────────────────────────────────────
export {
  TokenResolver,
  resolveTokens,
  buildThemeCss,
  extractRefs,
  hasRefs,
} from "./core/token-resolver";

// ─── Validation ───────────────────────────────────────────────────────────────
export { validateConfig } from "./cli/commands/validate";

// ─── Init helpers ─────────────────────────────────────────────────────────────
export { buildInitialConfig, buildInitialRules } from "./cli/commands/init";

// ─── Token generators ─────────────────────────────────────────────────────────
export {
  generateCssFiles,
  emitBaseCss,
  emitThemeCss,
} from "./generators/tokens/css-vars";
export {
  emitJsTokens,
  emitTailwindConfig,
} from "./generators/tokens/js-tokens";

// ─── Component generators ────────────────────────────────────────────────────
export { generateButton } from "./generators/components/button";
export { generateInput } from "./generators/components/input";
export { generateCard } from "./generators/components/card";
export {
  generateThemeProvider,
  generateComponentIndex,
} from "./generators/components/theme-provider";

// ─── Metadata + docs generators ──────────────────────────────────────────────
export { generateMetadata } from "./generators/metadata/generator";
export { generateDocs } from "./generators/docs/mdx";

// ─── Package emitter ─────────────────────────────────────────────────────────
export {
  generatePackageJson,
  generateTsConfig,
  generateReadme,
  generateChangelog,
} from "./generators/package/emitter";

// ─── Contrast utility ────────────────────────────────────────────────────────
export {
  checkContrast,
  hexContrastRatio,
  suggestContrastFix,
  isHexColor,
} from "./utils/contrast";

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  DesignSystemConfig,
  RulesConfig,
  TokenLayers,
  GlobalTokens,
  SemanticTokens,
  ComponentTokens,
  TokenValue,
  RawValue,
  ColorConfig,
  TypographyConfig,
  TypographyRole,
  SpacingConfig,
  RadiusConfig,
  ElevationConfig,
  MotionConfig,
  StatesConfig,
  LayoutConfig,
  ThemesConfig,
  MetaConfig,
  ResolvedTokenMap,
  ResolvedConfig,
  ValidationResult,
  ValidationIssue,
  IssueSeverity,
  CircularReferenceError,
  UnresolvedReferenceError,
  TokenResolutionError,
} from "./types/index";

// ─── Zod schemas ─────────────────────────────────────────────────────────────
export {
  DesignSystemConfigSchema,
  TokenLayersSchema,
  ColorConfigSchema,
  TypographyConfigSchema,
  SpacingConfigSchema,
  RadiusConfigSchema,
  ElevationConfigSchema,
  MotionConfigSchema,
  StatesConfigSchema,
  LayoutConfigSchema,
  ThemesConfigSchema,
  RulesConfigSchema,
} from "./schema/config.schema";
