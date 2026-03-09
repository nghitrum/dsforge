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
} from "./adapters/react/tokens/js-tokens";

// ─── Component generators ────────────────────────────────────────────────────
export { generateButton } from "./adapters/react/components/button";
export { generateInput } from "./adapters/react/components/input";
export { generateCard } from "./adapters/react/components/card";
export {
  generateThemeProvider,
  generateComponentIndex,
} from "./adapters/react/theme-provider";

// ─── Metadata + docs generators ──────────────────────────────────────────────
export { generateMetadata } from "./generators/metadata/generator";
export { generateDocs } from "./adapters/react/docs/mdx";

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
  OutputConfig,
  OutputTarget,
  ResolvedTokenMap,
  ResolvedConfig,
  ValidationResult,
  ValidationIssue,
  IssueSeverity,
  CircularReferenceError,
  UnresolvedReferenceError,
  TokenResolutionError,
} from "./types/index";

// ─── Adapter types ────────────────────────────────────────────────────────────
export type {
  FrameworkAdapter,
  GeneratedFile,
  AdapterRegistry,
} from "./adapters/types";

// ─── Zod schemas ─────────────────────────────────────────────────────────────
export {
  DesignSystemConfigSchema,
  OutputConfigSchema,
  SUPPORTED_TARGETS,
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
