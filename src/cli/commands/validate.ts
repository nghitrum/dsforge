import { readConfig, readRules } from "../../utils/fs";
import { resolveTokens, extractRefs } from "../../core/token-resolver";
import { logger } from "../../utils/logger";
import {
  checkContrast,
  isHexColor,
  suggestContrastFix,
} from "../../utils/contrast";
import type {
  DesignSystemConfig,
  RulesConfig,
  ValidationResult,
  ValidationIssue,
} from "../../types/index";
import { CircularReferenceError } from "../../types/index";

// ─── Health check registry ────────────────────────────────────────────────────
//
// Each check maps to one of the 9 config dimensions from the gap analysis.
// maxScore values sum to 89; a11y/governance/correctness checks are pass/fail.

interface HealthCheck {
  id: string;
  label: string;
  maxScore: number;
  run(config: DesignSystemConfig, rules: RulesConfig): ValidationIssue[];
}

const HEALTH_CHECKS: HealthCheck[] = [
  // ── 1. Token architecture (15 pts) ──────────────────────────────────────────
  {
    id: "token-architecture",
    label: "Token Architecture",
    maxScore: 15,
    run(config) {
      const issues: ValidationIssue[] = [];
      const layers = config.tokens;

      if (!layers) {
        issues.push({
          severity: "error",
          code: "TOKEN_ARCH_MISSING",
          message:
            'No "tokens" section defined. Add tokens.global, tokens.semantic, tokens.component.',
          path: "tokens",
          suggestion:
            'Add a "tokens": { "global": {}, "semantic": {}, "component": {} } section.',
        });
        return issues;
      }

      if (!layers.global || Object.keys(layers.global).length === 0) {
        issues.push({
          severity: "error",
          code: "TOKEN_GLOBAL_EMPTY",
          message:
            "tokens.global is empty. Global tokens are the raw value source of truth.",
          path: "tokens.global",
          suggestion:
            'Add your brand palette as global tokens: { "blue-600": "#2563eb" }',
        });
      }

      if (!layers.semantic || Object.keys(layers.semantic).length === 0) {
        issues.push({
          severity: "error",
          code: "TOKEN_SEMANTIC_EMPTY",
          message:
            "tokens.semantic is empty. Semantic tokens give intent to raw values.",
          path: "tokens.semantic",
          suggestion:
            'Add semantic tokens: { "color-action": "{global.blue-600}" }',
        });
      }

      // Validate that global tokens contain no {references}
      for (const [key, value] of Object.entries(layers.global ?? {})) {
        const strValue = String(value);
        if (extractRefs(strValue).length > 0) {
          issues.push({
            severity: "error",
            code: "TOKEN_GLOBAL_REF",
            message: `global.${key} contains a reference "${strValue}". Global tokens must be raw values.`,
            path: `tokens.global.${key}`,
            suggestion: "Replace the reference with the actual value.",
          });
        }
      }

      return issues;
    },
  },

  // ── 2. Color roles (15 pts) ─────────────────────────────────────────────────
  {
    id: "color-roles",
    label: "Color Roles",
    maxScore: 15,
    run(config) {
      const issues: ValidationIssue[] = [];
      const color = config.color;

      if (!color) {
        issues.push({
          severity: "error",
          code: "COLOR_ROLES_MISSING",
          message:
            'No "color" section defined. Define semantic color roles (surface, border, text, status).',
          path: "color",
        });
        return issues;
      }

      if (!color.surface?.default) {
        issues.push({
          severity: "error",
          code: "COLOR_SURFACE_MISSING",
          message: "color.surface.default is required.",
          path: "color.surface",
        });
      }

      if (!color.text?.primary) {
        issues.push({
          severity: "error",
          code: "COLOR_TEXT_MISSING",
          message: "color.text.primary is required.",
          path: "color.text",
        });
      }

      if (!color.border?.default) {
        issues.push({
          severity: "warning",
          code: "COLOR_BORDER_MISSING",
          message: "color.border.default is not defined.",
          path: "color.border",
          suggestion: "Add a default border color to keep borders consistent.",
        });
      }

      // Status: all 4 variants recommended
      const statusVariants = ["success", "warning", "danger", "info"] as const;
      for (const variant of statusVariants) {
        if (!color.status?.[variant]) {
          issues.push({
            severity: "warning",
            code: `COLOR_STATUS_${variant.toUpperCase()}_MISSING`,
            message: `color.status.${variant} is not defined.`,
            path: `color.status.${variant}`,
            suggestion: `Add bg, fg, and border values for ${variant} status.`,
          });
        }
      }

      return issues;
    },
  },

  // ── 3. Dark mode / theming (15 pts) ─────────────────────────────────────────
  {
    id: "dark-mode",
    label: "Theme Support",
    maxScore: 15,
    run(config) {
      const issues: ValidationIssue[] = [];

      if (!config.themes) {
        issues.push({
          severity: "error",
          code: "THEMES_MISSING",
          message:
            'No "themes" section defined. Without it, dark mode is impossible without a full rewrite.',
          path: "themes",
          suggestion:
            'Add "themes": { "light": {...}, "dark": {...} } to your config.',
        });
        return issues;
      }

      if (!config.themes["light"]) {
        issues.push({
          severity: "error",
          code: "THEME_LIGHT_MISSING",
          message: "themes.light is not defined.",
          path: "themes.light",
        });
      }

      if (!config.themes["dark"]) {
        issues.push({
          severity: "error",
          code: "THEME_DARK_MISSING",
          message:
            "themes.dark is not defined. Dark mode requires a dark theme override map.",
          path: "themes.dark",
          suggestion:
            "Add a dark theme that remaps surface, text, and border semantic tokens.",
        });
      }

      return issues;
    },
  },

  // ── 4. Typography roles (10 pts) ─────────────────────────────────────────────
  {
    id: "typography-roles",
    label: "Typography Roles",
    maxScore: 10,
    run(config) {
      const issues: ValidationIssue[] = [];
      const typo = config.typography;

      if (!typo) {
        issues.push({
          severity: "error",
          code: "TYPOGRAPHY_MISSING",
          message: 'No "typography" section defined.',
          path: "typography",
        });
        return issues;
      }

      if (!typo.roles) {
        issues.push({
          severity: "error",
          code: "TYPOGRAPHY_ROLES_MISSING",
          message:
            "typography.roles is not defined. A raw scale array is insufficient — roles carry intent.",
          path: "typography.roles",
          suggestion:
            "Replace typography.scale with named roles: display, h1, h2, body, small, caption.",
        });
        return issues;
      }

      const requiredRoles = ["body"] as const;
      const recommendedRoles = [
        "display",
        "h1",
        "h2",
        "small",
        "caption",
      ] as const;

      for (const role of requiredRoles) {
        if (!typo.roles[role]) {
          issues.push({
            severity: "error",
            code: `TYPOGRAPHY_ROLE_${role.toUpperCase()}_MISSING`,
            message: `typography.roles.${role} is required.`,
            path: `typography.roles.${role}`,
          });
        }
      }

      for (const role of recommendedRoles) {
        if (!typo.roles[role]) {
          issues.push({
            severity: "warning",
            code: `TYPOGRAPHY_ROLE_${role.toUpperCase()}_MISSING`,
            message: `typography.roles.${role} is not defined.`,
            path: `typography.roles.${role}`,
            suggestion: `Add a ${role} role with size, weight, and lineHeight.`,
          });
        }
      }

      // Each role must have lineHeight
      for (const [roleName, roleValue] of Object.entries(typo.roles ?? {})) {
        if (roleValue && !roleValue.lineHeight) {
          issues.push({
            severity: "error",
            code: "TYPOGRAPHY_ROLE_NO_LINE_HEIGHT",
            message: `typography.roles.${roleName} is missing lineHeight. Line height is required for readability.`,
            path: `typography.roles.${roleName}.lineHeight`,
            suggestion: `Add "lineHeight": 1.5 (or similar) to typography.roles.${roleName}.`,
          });
        }
      }

      return issues;
    },
  },

  // ── 5. Spacing semantic scale (8 pts) ────────────────────────────────────────
  {
    id: "spacing-semantic",
    label: "Spacing Semantic Scale",
    maxScore: 8,
    run(config) {
      const issues: ValidationIssue[] = [];
      const spacing = config.spacing;

      if (!spacing) {
        issues.push({
          severity: "error",
          code: "SPACING_MISSING",
          message: 'No "spacing" section defined.',
          path: "spacing",
        });
        return issues;
      }

      if (!spacing.scale || Object.keys(spacing.scale).length < 6) {
        issues.push({
          severity: "error",
          code: "SPACING_SCALE_INSUFFICIENT",
          message: `spacing.scale has fewer than 6 named steps (found ${Object.keys(spacing.scale ?? {}).length}). A robust scale needs at least 6.`,
          path: "spacing.scale",
          suggestion:
            'Define at least: { "1": 4, "2": 8, "3": 12, "4": 16, "5": 24, "6": 32 }',
        });
      }

      if (!spacing.semantic || Object.keys(spacing.semantic).length === 0) {
        issues.push({
          severity: "error",
          code: "SPACING_SEMANTIC_MISSING",
          message:
            "spacing.semantic is not defined. Without it, engineers arithmetic-derive spacing rather than using intent-named tokens.",
          path: "spacing.semantic",
          suggestion:
            'Add "component-padding-md", "layout-gap-sm" etc. as semantic tokens.',
        });
      }

      return issues;
    },
  },

  // ── 6. Interactive states (8 pts) ────────────────────────────────────────────
  {
    id: "interactive-states",
    label: "Interactive States",
    maxScore: 8,
    run(config) {
      const issues: ValidationIssue[] = [];

      if (!config.states) {
        issues.push({
          severity: "error",
          code: "STATES_MISSING",
          message:
            'No "states" section defined. Without state tokens every component invents its own hover/focus styles.',
          path: "states",
          suggestion:
            'Add "states": { "focusRing": {...}, "hoverOpacity": 0.08, "disabledOpacity": 0.4 }',
        });
        return issues;
      }

      if (!config.states.focusRing) {
        issues.push({
          severity: "error",
          code: "STATES_FOCUS_RING_MISSING",
          message:
            "states.focusRing is not defined. Focus rings are required for keyboard accessibility.",
          path: "states.focusRing",
          suggestion:
            'Add "focusRing": { "color": "...", "width": "2px", "offset": "2px" }',
        });
      }

      if (!config.color?.interactive?.primary) {
        issues.push({
          severity: "warning",
          code: "STATES_INTERACTIVE_MISSING",
          message:
            "color.interactive.primary is not defined. Without it, hover/active/disabled colors are undefined.",
          path: "color.interactive.primary",
          suggestion:
            'Add rest/hover/active/disabled values to "color.interactive.primary".',
        });
      }

      return issues;
    },
  },

  // ── 7. Motion tokens (6 pts) ──────────────────────────────────────────────────
  {
    id: "motion-tokens",
    label: "Motion Tokens",
    maxScore: 6,
    run(config) {
      const issues: ValidationIssue[] = [];
      const motion = config.motion;

      if (!motion) {
        issues.push({
          severity: "warning",
          code: "MOTION_MISSING",
          message:
            'No "motion" section defined. Animation durations and easing will be magic numbers.',
          path: "motion",
          suggestion:
            'Add "motion": { "duration": { "fast": 100, "normal": 200 }, "easing": { "standard": "..." } }',
        });
        return issues;
      }

      const durationCount = Object.keys(motion.duration ?? {}).length;
      if (durationCount < 2) {
        issues.push({
          severity: "warning",
          code: "MOTION_DURATION_INSUFFICIENT",
          message: `motion.duration has only ${durationCount} value(s). Define at least 3 (fast, normal, slow).`,
          path: "motion.duration",
        });
      }

      if (!motion.easing || Object.keys(motion.easing).length === 0) {
        issues.push({
          severity: "warning",
          code: "MOTION_EASING_MISSING",
          message: "motion.easing is not defined.",
          path: "motion.easing",
          suggestion: 'Add "standard" and "decelerate" easing curves.',
        });
      }

      return issues;
    },
  },

  // ── 8. Elevation (6 pts) ─────────────────────────────────────────────────────
  {
    id: "elevation",
    label: "Elevation Scale",
    maxScore: 6,
    run(config) {
      const issues: ValidationIssue[] = [];
      const elevation = config.elevation;

      if (!elevation || Object.keys(elevation).length === 0) {
        issues.push({
          severity: "warning",
          code: "ELEVATION_MISSING",
          message:
            'No "elevation" section defined. Shadow values will be inconsistent.',
          path: "elevation",
          suggestion:
            'Add at least 4 named shadow levels: { "0": "none", "1": "...", "2": "...", "3": "..." }',
        });
        return issues;
      }

      if (Object.keys(elevation).length < 3) {
        issues.push({
          severity: "warning",
          code: "ELEVATION_INSUFFICIENT",
          message: `elevation has only ${Object.keys(elevation).length} level(s). Define at least 3 for a usable scale.`,
          path: "elevation",
        });
      }

      return issues;
    },
  },

  // ── 9. Layout & breakpoints (6 pts) ──────────────────────────────────────────
  {
    id: "layout-grid",
    label: "Layout & Breakpoints",
    maxScore: 6,
    run(config) {
      const issues: ValidationIssue[] = [];
      const layout = config.layout;

      if (!layout) {
        issues.push({
          severity: "warning",
          code: "LAYOUT_MISSING",
          message:
            'No "layout" section defined. Responsive behavior will be undefined.',
          path: "layout",
          suggestion:
            'Add "layout": { "breakpoints": { "sm": 640, "md": 768, "lg": 1024 }, "grid": {...} }',
        });
        return issues;
      }

      const bpCount = Object.keys(layout.breakpoints ?? {}).length;
      if (bpCount < 3) {
        issues.push({
          severity: "warning",
          code: "LAYOUT_BREAKPOINTS_INSUFFICIENT",
          message: `layout.breakpoints has only ${bpCount} breakpoint(s). Define at least 3 for responsive design.`,
          path: "layout.breakpoints",
        });
      }

      if (!layout.grid?.columns) {
        issues.push({
          severity: "warning",
          code: "LAYOUT_GRID_MISSING",
          message:
            "layout.grid.columns is not defined. Grid column counts per breakpoint are needed for consistent layouts.",
          path: "layout.grid.columns",
        });
      }

      return issues;
    },
  },
];

// ─── Correctness: token resolution ───────────────────────────────────────────

function runTokenResolutionCheck(
  config: DesignSystemConfig,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  try {
    const { warnings } = resolveTokens(config);
    for (const w of warnings) {
      issues.push({
        severity: "error",
        code: "TOKEN_UNRESOLVED_REF",
        message: w.message,
        path: w.path,
        suggestion:
          "Check that the referenced token exists in tokens.global or tokens.semantic.",
      });
    }
  } catch (err) {
    if (err instanceof CircularReferenceError) {
      issues.push({
        severity: "error",
        code: "TOKEN_CIRCULAR_REF",
        message: `Circular token reference: ${err.cycle.join(" → ")}`,
        path: err.path,
        suggestion:
          "Break the cycle by resolving one of the references to a raw value.",
      });
    } else {
      issues.push({
        severity: "error",
        code: "TOKEN_RESOLUTION_FAILED",
        message: `Token resolution failed: ${(err as Error).message}`,
        path: "tokens",
      });
    }
  }

  return issues;
}

// ─── Governance checks ────────────────────────────────────────────────────────

function runGovernanceChecks(
  _config: DesignSystemConfig,
  rules: RulesConfig,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Validate that rule token references point to defined semantic tokens
  for (const [component, rule] of Object.entries(rules)) {
    for (const [tokenName, tokenValue] of Object.entries(rule.tokens ?? {})) {
      const refs = extractRefs(String(tokenValue));
      // Note: full ref resolution against config happens at generate time
      // Here we just flag obviously malformed references
      for (const ref of refs) {
        if (!ref.includes(".")) {
          issues.push({
            severity: "warning",
            code: "RULE_INVALID_REF_FORMAT",
            message: `rules.${component}.tokens.${tokenName}: reference "{${ref}}" has no layer prefix (expected "layer.key").`,
            path: `rules.${component}.tokens.${tokenName}`,
            suggestion: `Use "{semantic.${ref}}" or "{global.${ref}}" format.`,
          });
        }
      }
    }
  }

  return issues;
}

// ─── Accessibility: contrast checks ──────────────────────────────────────────

/**
 * Check WCAG AA contrast ratios for all text/background color pairs.
 */
function runContrastChecks(config: DesignSystemConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { tokens } = resolveTokens(config);

  function resolveColor(value: unknown): string | null {
    const str = String(value ?? "");
    if (!str) return null;
    const refMatch = /^\{([^{}]+)\}$/.exec(str);
    if (refMatch?.[1]) {
      const resolved = tokens[refMatch[1]];
      return resolved && isHexColor(resolved) ? resolved : null;
    }
    return isHexColor(str) ? str : null;
  }

  type ColorPair = [string, string, string];
  const pairs: ColorPair[] = [];

  const textPrimary = resolveColor(config.color?.text?.primary);
  const textSecondary = resolveColor(config.color?.text?.secondary);
  const textDisabled = resolveColor(config.color?.text?.disabled);
  const textInverse = resolveColor(config.color?.text?.inverse);
  const bgDefault = resolveColor(config.color?.surface?.default);
  const bgSubtle = resolveColor(config.color?.surface?.subtle);
  const bgInverse = resolveColor(config.color?.surface?.inverse);

  if (textPrimary && bgDefault)
    pairs.push([
      textPrimary,
      bgDefault,
      "color.text.primary on color.surface.default",
    ]);
  if (textSecondary && bgDefault)
    pairs.push([
      textSecondary,
      bgDefault,
      "color.text.secondary on color.surface.default",
    ]);
  if (textPrimary && bgSubtle)
    pairs.push([
      textPrimary,
      bgSubtle,
      "color.text.primary on color.surface.subtle",
    ]);
  if (textInverse && bgInverse)
    pairs.push([
      textInverse,
      bgInverse,
      "color.text.inverse on color.surface.inverse",
    ]);

  for (const [statusName, statusValue] of Object.entries(
    config.color?.status ?? {},
  )) {
    if (!statusValue) continue;
    const fg = resolveColor(statusValue.fg);
    const bg = resolveColor(statusValue.bg);
    if (fg && bg) pairs.push([fg, bg, `color.status.${statusName}.fg on .bg`]);
  }

  const actionBg = resolveColor(
    tokens["semantic.color-action"] ?? config.color?.interactive?.primary?.rest,
  );
  const actionText = resolveColor(config.color?.text?.onColor);
  if (actionBg && actionText)
    pairs.push([
      actionText,
      actionBg,
      "color.text.onColor on color-action (button text)",
    ]);

  for (const [fg, bg, label] of pairs) {
    const result = checkContrast(fg, bg, "AA", "normal");
    if (!result) continue;
    if (!result.passes) {
      const fix = suggestContrastFix(fg, bg, "AA", "normal");
      issues.push({
        severity: "error",
        code: "A11Y_CONTRAST_FAIL",
        message: `${label}: contrast ${result.ratioDisplay}:1 (required ${result.required}:1 for WCAG AA)`,
        path: label,
        suggestion: fix
          ? `Adjust foreground to approximately ${fix}`
          : `Increase contrast between ${fg} and ${bg} to at least ${result.required}:1`,
      });
    }
  }

  if (textDisabled && bgDefault) {
    const result = checkContrast(textDisabled, bgDefault, "AA", "normal");
    if (result && result.ratio < 1.5) {
      issues.push({
        severity: "warning",
        code: "A11Y_DISABLED_TOO_FAINT",
        message: `color.text.disabled has contrast ${result.ratioDisplay}:1 — disabled text should remain perceivable.`,
        path: "color.text.disabled",
        suggestion:
          "Keep disabled text contrast above 1.5:1 even though AA exemption applies.",
      });
    }
  }

  return issues;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function computeScore(
  config: DesignSystemConfig,
  rules: RulesConfig,
  issues: ValidationIssue[],
): number {
  let score = 0;

  for (const check of HEALTH_CHECKS) {
    const checkIssues = check.run(config, rules);
    const hasErrors = checkIssues.some((i) => i.severity === "error");
    const hasWarnings = checkIssues.some((i) => i.severity === "warning");

    if (!hasErrors && !hasWarnings) {
      score += check.maxScore;
    } else if (!hasErrors && hasWarnings) {
      score += Math.floor(check.maxScore * 0.6);
    }
    // errors: 0 points for this dimension
  }

  void issues;
  return score;
}

// ─── Main validation runner ───────────────────────────────────────────────────

export function validateConfig(
  config: DesignSystemConfig,
  rules: RulesConfig,
): ValidationResult {
  const allIssues: ValidationIssue[] = [];

  // Run all 9 health checks
  for (const check of HEALTH_CHECKS) {
    allIssues.push(...check.run(config, rules));
  }

  // Token correctness
  allIssues.push(...runTokenResolutionCheck(config));

  // Governance
  allIssues.push(...runGovernanceChecks(config, rules));

  // Accessibility: contrast ratios
  allIssues.push(...runContrastChecks(config));

  const maxScore = HEALTH_CHECKS.reduce((sum, c) => sum + c.maxScore, 0);
  const score = computeScore(config, rules, allIssues);
  const valid = !allIssues.some((i) => i.severity === "error");

  return { valid, score, maxScore, issues: allIssues };
}

// ─── CLI command handler ──────────────────────────────────────────────────────

export interface ValidateOptions {
  cwd?: string;
}

export async function runValidate(
  cwd: string,
  _options: ValidateOptions,
): Promise<void> {
  logger.blank();
  logger.section("dsforge validate");

  let config: DesignSystemConfig;
  let rules: RulesConfig;

  try {
    config = await readConfig(cwd);
    rules = await readRules(cwd);
  } catch (err) {
    logger.error((err as Error).message);
    process.exit(1);
    return;
  }

  const result = validateConfig(config!, rules!);

  // ── Score display ──
  logger.score(result.score, result.maxScore);

  // ── Health checks ──
  logger.section("Config Health");

  for (const check of HEALTH_CHECKS) {
    const checkIssues = result.issues.filter(
      (i) =>
        i.code
          .toLowerCase()
          .startsWith(check.id.replace(/-/g, "_").split("_")[0] ?? "") ||
        i.path?.startsWith(check.id.split("-")[0] ?? ""),
    );
    const hasError = checkIssues.some((i) => i.severity === "error");
    const hasWarning = checkIssues.some((i) => i.severity === "warning");

    if (!hasError && !hasWarning) {
      logger.pass(`${check.label}  (+${check.maxScore}pts)`);
    } else if (hasError) {
      const first = checkIssues.find((i) => i.severity === "error");
      logger.fail(check.label, first?.message);
      if (first?.suggestion) {
        logger.dim(`   → ${first.suggestion}`);
      }
    } else {
      const first = checkIssues.find((i) => i.severity === "warning");
      logger.hint(check.label, first?.message ?? "");
    }
  }

  // ── Errors and warnings detail ──
  const errors = result.issues.filter((i) => i.severity === "error");
  const warnings = result.issues.filter((i) => i.severity === "warning");

  if (errors.length > 0) {
    logger.section(`Errors (${errors.length})`);
    for (const issue of errors) {
      logger.fail(`[${issue.code}] ${issue.message}`);
      if (issue.suggestion) logger.dim(`   → ${issue.suggestion}`);
    }
  }

  if (warnings.length > 0) {
    logger.section(`Warnings (${warnings.length})`);
    for (const issue of warnings) {
      logger.hint(`[${issue.code}] ${issue.message}`, issue.suggestion ?? "");
    }
  }

  logger.blank();

  if (result.valid) {
    logger.success(
      `Validation passed with score ${result.score}/${result.maxScore}`,
    );
  } else {
    logger.error(
      `Validation failed — fix errors before running generate or publish.`,
    );
    process.exit(1);
  }

  logger.blank();
}
