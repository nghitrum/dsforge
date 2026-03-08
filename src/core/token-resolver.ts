import type {
  DesignSystemConfig,
  ResolvedTokenMap,
  RawValue,
} from "../types/index";
import {
  CircularReferenceError,
  UnresolvedReferenceError,
  TokenResolutionError,
} from "../types/index";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Matches any {path.to.token} references, including multiple in a single string */
const REF_PATTERN = /\{([^{}]+)\}/g;

/** Matches a string that is ONLY a single reference, e.g. "{global.blue-600}" */
const SOLE_REF_PATTERN = /^\{([^{}]+)\}$/;

// ─── Path utilities ───────────────────────────────────────────────────────────

/**
 * Walk a nested object by dot-separated path segments.
 * Handles hyphenated keys like "blue-600".
 *
 * @example
 *   getByPath({ a: { "b-c": 42 } }, ["a", "b-c"]) // → 42
 */
function getByPath(obj: unknown, segments: string[]): unknown {
  let current: unknown = obj;
  for (const segment of segments) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/**
 * Resolve a dot-path reference against the tokens config object.
 *
 * Resolution order:
 *   1. tokens.{path} — tries the tokens namespace first
 *   2. config root — falls back to the full config tree
 *
 * @example
 *   "global.blue-600"       → config.tokens.global["blue-600"]
 *   "semantic.color-action" → config.tokens.semantic["color-action"]
 *   "spacing.scale.4"       → config.spacing.scale["4"]
 */
function lookupRef(
  refPath: string,
  config: DesignSystemConfig,
): RawValue | string | undefined {
  const segments = refPath.split(".");

  // 1. Try tokens namespace (layer.key pattern)
  if (config.tokens) {
    const fromTokens = getByPath(config.tokens, segments);
    if (fromTokens !== undefined) {
      return fromTokens as RawValue | string;
    }
  }

  // 2. Fall back to root config tree
  const fromRoot = getByPath(config, segments);
  if (fromRoot !== undefined) {
    return fromRoot as RawValue | string;
  }

  return undefined;
}

// ─── Resolution result ────────────────────────────────────────────────────────

export interface ResolutionResult {
  /** Fully resolved token map: "layer.key" → concrete value */
  tokens: ResolvedTokenMap;
  /** Any non-fatal warnings encountered during resolution */
  warnings: ResolutionWarning[];
}

export interface ResolutionWarning {
  type: "unresolved_ref" | "unexpected_type";
  path: string;
  message: string;
}

// ─── Resolver class ───────────────────────────────────────────────────────────

export class TokenResolver {
  private readonly config: DesignSystemConfig;

  /** LRU-style cache: refPath → resolved concrete string */
  private readonly cache = new Map<string, string>();

  /** Tracks the current resolution chain for cycle detection */
  private readonly stack: string[] = [];

  private readonly warnings: ResolutionWarning[] = [];

  constructor(config: DesignSystemConfig) {
    this.config = config;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Resolve all tokens in the config.
   * Returns a flat map of every token path to its concrete value.
   *
   * Resolution order ensures correct layering:
   *   global → semantic → component
   */
  resolve(): ResolutionResult {
    const tokens: ResolvedTokenMap = {};
    const layers = this.config.tokens;
    if (!layers) {
      return { tokens, warnings: this.warnings };
    }

    // Global tokens: no references allowed, but we still run through the
    // resolver to normalise numbers → strings and catch any accidental refs.
    for (const [key, value] of Object.entries(layers.global ?? {})) {
      const tokenPath = `global.${key}`;
      try {
        tokens[tokenPath] = this.resolveValue(String(value), tokenPath);
      } catch (err) {
        this.handleError(err, tokenPath);
      }
    }

    // Semantic tokens: may reference global
    for (const [key, value] of Object.entries(layers.semantic ?? {})) {
      const tokenPath = `semantic.${key}`;
      try {
        tokens[tokenPath] = this.resolveValue(String(value), tokenPath);
      } catch (err) {
        this.handleError(err, tokenPath);
      }
    }

    // Component tokens: may reference global or semantic
    for (const [key, value] of Object.entries(layers.component ?? {})) {
      const tokenPath = `component.${key}`;
      try {
        tokens[tokenPath] = this.resolveValue(String(value), tokenPath);
      } catch (err) {
        this.handleError(err, tokenPath);
      }
    }

    return { tokens, warnings: this.warnings };
  }

  /**
   * Resolve a single value in isolation.
   * Useful for one-off resolution outside the full config context.
   */
  resolveOneValue(value: string, contextPath: string = "<anonymous>"): string {
    return this.resolveValue(value, contextPath);
  }

  // ─── Core resolution logic ───────────────────────────────────────────────────

  /**
   * Resolve all {ref} patterns within a value string.
   *
   * Two modes:
   *   - SOLE reference: "{global.blue-600}"  → return the resolved value directly
   *     (preserves numeric types when the referenced value is a number)
   *   - INTERPOLATED: "0 1px {shadow.color}" → replace refs inline, return string
   */
  private resolveValue(value: string, currentPath: string): string {
    // Fast path: no reference in this value
    if (!value.includes("{")) {
      return value;
    }

    // Check for a sole reference — the entire string is one {ref}
    const soleMatch = SOLE_REF_PATTERN.exec(value);
    if (soleMatch?.[1] !== undefined) {
      return this.resolveRef(soleMatch[1], currentPath);
    }

    // Interpolation: replace each {ref} within a larger string
    return value.replace(REF_PATTERN, (_match, refPath: string) => {
      try {
        return this.resolveRef(refPath, currentPath);
      } catch (err) {
        if (err instanceof UnresolvedReferenceError) {
          // Emit warning and leave the ref as-is (graceful degradation)
          this.warnings.push({
            type: "unresolved_ref",
            path: currentPath,
            message: err.message,
          });
          return `{${refPath}}`;
        }
        throw err;
      }
    });
  }

  /**
   * Resolve a single reference path to its concrete value.
   * Implements:
   *   - Cache lookup (avoid redundant resolution)
   *   - Cycle detection via the resolution stack
   *   - Recursive resolution (a ref can point to another ref)
   */
  private resolveRef(refPath: string, fromToken: string): string {
    // Cache hit
    const cached = this.cache.get(refPath);
    if (cached !== undefined) {
      return cached;
    }

    // Cycle detection
    const cycleIndex = this.stack.indexOf(refPath);
    if (cycleIndex !== -1) {
      throw new CircularReferenceError([
        ...this.stack.slice(cycleIndex),
        refPath,
      ]);
    }

    // Look up the raw value
    const rawValue = lookupRef(refPath, this.config);
    if (rawValue === undefined) {
      throw new UnresolvedReferenceError(refPath, fromToken);
    }

    // Push to stack before recursing
    this.stack.push(refPath);
    const resolved = this.resolveValue(String(rawValue), refPath);
    this.stack.pop();

    // Cache and return
    this.cache.set(refPath, resolved);
    return resolved;
  }

  // ─── Error handling ──────────────────────────────────────────────────────────

  private handleError(err: unknown, path: string): void {
    if (err instanceof CircularReferenceError) {
      // Circular refs are always hard errors — re-throw
      throw err;
    }
    if (err instanceof UnresolvedReferenceError) {
      // Unresolved refs during full resolution become warnings
      this.warnings.push({
        type: "unresolved_ref",
        path,
        message: err.message,
      });
      return;
    }
    if (err instanceof Error) {
      throw new TokenResolutionError(err.message, path, err);
    }
    throw err;
  }
}

// ─── Convenience function ─────────────────────────────────────────────────────

/**
 * Resolve all tokens in a DesignSystemConfig.
 *
 * @example
 *   const { tokens, warnings } = resolveTokens(config);
 *   console.log(tokens["semantic.color-action"]); // "#2563eb"
 */
export function resolveTokens(config: DesignSystemConfig): ResolutionResult {
  return new TokenResolver(config).resolve();
}

/**
 * Build CSS custom property output for a given theme.
 *
 * @example
 *   buildThemeCss(config, "dark")
 *   // `:root[data-theme="dark"] { --color-action: #60a5fa; ... }`
 */
export function buildThemeCss(
  config: DesignSystemConfig,
  themeName: string,
): string {
  const theme = config.themes?.[themeName];
  if (!theme) {
    throw new Error(`Theme "${themeName}" not found in config.themes`);
  }

  // Resolve the base tokens first so we can substitute defaults
  const { tokens } = resolveTokens(config);

  const lines: string[] = [];

  for (const [tokenName, themeValue] of Object.entries(theme)) {
    const cssVarName = `--${tokenName}`;
    // Theme values are raw (no refs allowed in theme overrides)
    lines.push(`  ${cssVarName}: ${String(themeValue)};`);
  }

  // Also emit all resolved semantic tokens that aren't overridden by the theme
  for (const [tokenPath, resolvedValue] of Object.entries(tokens)) {
    if (tokenPath.startsWith("semantic.")) {
      const varName = tokenPath.replace("semantic.", "").replace(/\./g, "-");
      const cssVarName = `--${varName}`;
      // Skip if theme already defines this token
      const themeKey = varName;
      if (!(themeKey in theme)) {
        lines.push(`  ${cssVarName}: ${resolvedValue};`);
      }
    }
  }

  return `:root[data-theme="${themeName}"] {\n${lines.join("\n")}\n}`;
}

/**
 * Extract all {ref} paths from a value string.
 * Useful for static analysis and validation.
 *
 * @example
 *   extractRefs("0 1px {shadow.color} {radius.md}")
 *   // → ["shadow.color", "radius.md"]
 */
export function extractRefs(value: string): string[] {
  const refs: string[] = [];
  let match: RegExpExecArray | null;
  const pattern = new RegExp(REF_PATTERN.source, "g");
  while ((match = pattern.exec(value)) !== null) {
    if (match[1]) refs.push(match[1]);
  }
  return refs;
}

/**
 * Check whether a value contains any unresolved {ref} patterns.
 */
export function hasRefs(value: string): boolean {
  return REF_PATTERN.test(value);
}
