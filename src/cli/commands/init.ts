import path from "node:path";
import fs from "fs-extra";
import chalk from "chalk";
import { logger } from "../../utils/logger";
import { projectExists } from "../../utils/fs";
import { CONFIG_FILENAME, RULES_FILENAME } from "../../utils/fs";
import { ask, confirm } from "../prompt";
import { isProUnlocked } from "../../lib/license";
import type { DesignSystemConfig, RulesConfig } from "../../types/index";
import {
  type Preset,
  SPACING_PRESETS,
  RADIUS_PRESETS,
  PRESET_BASE_UNITS,
  buildSemanticSpacing,
  applyPreset,
} from "../../presets/index";

export { applyPreset };

// ─── Config template builder ──────────────────────────────────────────────────

export function buildInitialConfig(
  name: string,
  preset: Preset = "comfortable",
): DesignSystemConfig {
  const spacing = SPACING_PRESETS[preset];
  const radius = RADIUS_PRESETS[preset];

  return {
    meta: {
      name,
      version: "0.1.0",
      description: `${name} design system`,
      preset,
    },

    tokens: {
      global: {
        // ── Brand palette ──
        // Replace with your actual brand colors from Figma.
        "brand-50": "#eff6ff",
        "brand-100": "#dbeafe",
        "brand-500": "#3b82f6",
        "brand-600": "#2563eb",
        "brand-700": "#1d4ed8",
        "brand-900": "#1e3a8a",

        // ── Neutral palette ──
        "neutral-0": "#ffffff",
        "neutral-50": "#f8fafc",
        "neutral-100": "#f1f5f9",
        "neutral-200": "#e2e8f0",
        "neutral-300": "#cbd5e1",
        "neutral-400": "#94a3b8",
        "neutral-500": "#64748b",
        "neutral-600": "#475569",
        "neutral-700": "#334155",
        "neutral-800": "#1e293b",
        "neutral-900": "#0f172a",
        "neutral-950": "#020617",

        // ── Status ──
        "green-50": "#f0fdf4",
        "green-700": "#15803d",
        "green-300": "#86efac",
        "yellow-50": "#fffbeb",
        "yellow-700": "#b45309",
        "yellow-300": "#fcd34d",
        "red-50": "#fef2f2",
        "red-600": "#c22121",
        "red-300": "#fca5a5",
        "blue-50": "#eff6ff",
        "blue-700": "#1d4ed8",
        "blue-300": "#93c5fd",
      },

      semantic: {
        // ── Color action ──
        "color-action": "{global.brand-600}",
        "color-action-hover": "{global.brand-700}",
        "color-action-active": "{global.brand-900}",
        "color-action-disabled": "{global.brand-100}",
        "color-action-text": "{global.neutral-0}",

        // ── Surfaces ──
        "color-bg-default": "{global.neutral-0}",
        "color-bg-subtle": "{global.neutral-50}",
        "color-bg-overlay": "{global.neutral-100}",
        "color-bg-inverse": "{global.neutral-900}",

        // ── Borders ──
        "color-border-default": "{global.neutral-200}",
        "color-border-strong": "{global.neutral-400}",
        "color-border-focus": "{global.brand-600}",

        // ── Text ──
        "color-text-primary": "{global.neutral-900}",
        "color-text-secondary": "{global.neutral-500}",
        "color-text-disabled": "{global.neutral-400}",
        "color-text-inverse": "{global.neutral-0}",
        "color-text-on-color": "{global.neutral-0}",
      },

      component: {
        // These will be filled in during generate.
        // Example: "button-bg": "{semantic.color-action}"
      },
    },

    themes: {
      light: {
        "color-bg-default": "#ffffff",
        "color-bg-subtle": "#f8fafc",
        "color-text-primary": "#0f172a",
        "color-text-secondary": "#64748b",
        "color-border-default": "#e2e8f0",
        "color-action": "#2563eb",
        "color-action-hover": "#1d4ed8",
      },
      dark: {
        "color-bg-default": "#0f172a",
        "color-bg-subtle": "#1e293b",
        "color-text-primary": "#f1f5f9",
        "color-text-secondary": "#94a3b8",
        "color-border-default": "#334155",
        "color-action": "#60a5fa",
        "color-action-hover": "#93c5fd",
      },
    },

    color: {
      surface: {
        default: "{semantic.color-bg-default}",
        subtle: "{semantic.color-bg-subtle}",
        overlay: "{semantic.color-bg-overlay}",
        inverse: "{semantic.color-bg-inverse}",
      },
      border: {
        default: "{semantic.color-border-default}",
        strong: "{semantic.color-border-strong}",
        focus: "{semantic.color-border-focus}",
      },
      text: {
        primary: "{semantic.color-text-primary}",
        secondary: "{semantic.color-text-secondary}",
        disabled: "{semantic.color-text-disabled}",
        inverse: "{semantic.color-text-inverse}",
        onColor: "{semantic.color-text-on-color}",
      },
      status: {
        success: {
          bg: "{global.green-50}",
          fg: "{global.green-700}",
          border: "{global.green-300}",
        },
        warning: {
          bg: "{global.yellow-50}",
          fg: "{global.yellow-700}",
          border: "{global.yellow-300}",
        },
        danger: {
          bg: "{global.red-50}",
          fg: "{global.red-600}",
          border: "{global.red-300}",
        },
        info: {
          bg: "{global.blue-50}",
          fg: "{global.blue-700}",
          border: "{global.blue-300}",
        },
      },
      interactive: {
        primary: {
          rest: "{semantic.color-action}",
          hover: "{semantic.color-action-hover}",
          active: "{semantic.color-action-active}",
          disabled: "{semantic.color-action-disabled}",
        },
      },
    },

    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      roles: {
        display: {
          size: 32,
          weight: 700,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
        },
        h1: {
          size: 24,
          weight: 700,
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
        },
        h2: {
          size: 20,
          weight: 600,
          lineHeight: 1.4,
          letterSpacing: "-0.005em",
        },
        h3: { size: 18, weight: 600, lineHeight: 1.4, letterSpacing: 0 },
        body: { size: 16, weight: 400, lineHeight: 1.6, letterSpacing: 0 },
        small: { size: 14, weight: 400, lineHeight: 1.5, letterSpacing: 0 },
        caption: {
          size: 12,
          weight: 400,
          lineHeight: 1.4,
          letterSpacing: "0.01em",
        },
        label: {
          size: 14,
          weight: 500,
          lineHeight: 1.4,
          letterSpacing: "0.01em",
        },
        code: {
          size: 13,
          weight: 400,
          lineHeight: 1.6,
          fontFamily: "ui-monospace, monospace",
        },
      },
    },

    spacing: {
      baseUnit: PRESET_BASE_UNITS[preset],
      scale: spacing,
      semantic: buildSemanticSpacing(spacing),
    },

    radius,

    elevation: {
      "0": "none",
      "1": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      "2": "0 1px 3px 0 rgb(0 0 0 / 0.10), 0 1px 2px -1px rgb(0 0 0 / 0.10)",
      "3": "0 4px 6px -1px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.10)",
      "4": "0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10)",
    },

    motion: {
      duration: {
        instant: 50,
        fast: 100,
        normal: 200,
        slow: 300,
        deliberate: 500,
      },
      easing: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        decelerate: "cubic-bezier(0, 0, 0, 1)",
        accelerate: "cubic-bezier(0.3, 0, 1, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },

    states: {
      hoverOpacity: 0.08,
      activeOpacity: 0.12,
      disabledOpacity: 0.4,
      focusRing: {
        color: "{semantic.color-border-focus}",
        width: "2px",
        offset: "2px",
      },
    },

    layout: {
      breakpoints: {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536,
      },
      grid: {
        columns: { sm: 4, md: 8, lg: 12 },
        gutter: 16,
        margin: 24,
      },
      container: {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
      },
    },

    philosophy: {
      density: preset,
      elevation: "minimal",
      motion: "full",
    },

    customization: {
      extends: null,
      overrides: {},
    },
  };
}

export function buildInitialRules(): RulesConfig {
  return {
    button: {
      allowedVariants: ["primary", "secondary", "danger", "ghost"],
      requiredProps: ["aria-label"],
      maxWidth: "320px",
      tokens: {
        "button-bg": "{semantic.color-action}",
        "button-bg-hover": "{semantic.color-action-hover}",
        "button-text": "{semantic.color-text-on-color}",
        "button-radius": "{radius.md}",
      },
      a11y: {
        keyboard: true,
        focusRing: true,
        ariaLabel: "required",
      },
    },
    input: {
      allowedVariants: ["default", "error", "disabled"],
      requiredProps: ["aria-label"],
      tokens: {
        "input-border": "{semantic.color-border-default}",
        "input-border-focus": "{semantic.color-border-focus}",
        "input-bg": "{semantic.color-bg-default}",
      },
      a11y: {
        keyboard: true,
        focusRing: true,
        ariaLabel: "required",
      },
    },
    card: {
      allowedVariants: ["default", "elevated", "outlined"],
      maxWidth: "640px",
      allowedRadius: ["md", "lg"],
      allowedShadows: ["0", "1", "2", "3"],
      tokens: {
        "card-bg": "{semantic.color-bg-default}",
        "card-border": "{semantic.color-border-default}",
        "card-radius": "{radius.lg}",
      },
    },
  };
}

// ─── Command handler ──────────────────────────────────────────────────────────

export interface InitOptions {
  name?: string;
  preset?: string;
  force?: boolean;
}

const VALID_PRESETS = ["compact", "comfortable", "spacious"] as const;

export async function runInit(
  cwd: string,
  options: InitOptions,
): Promise<void> {
  logger.wordmark();
  logger.blank();

  // Guard against overwriting existing project
  if (!options.force && (await projectExists(cwd))) {
    logger.warn("A design system config already exists in this directory.");
    const overwrite = await confirm("Overwrite existing config?");
    if (!overwrite) {
      logger.dim("Cancelled.");
      logger.blank();
      return;
    }
    logger.blank();
  }

  // ── Resolve name ──
  let rawName: string;
  if (options.name) {
    rawName = options.name;
  } else {
    const defaultName = path.basename(cwd);
    const answer = await ask(
      `  Package name ${chalk.dim(`(${defaultName})`)} `,
    );
    rawName = answer.trim() || defaultName;
  }
  const name = rawName.replace(/\s+/g, "-").toLowerCase();

  // ── Resolve preset ──
  let preset: (typeof VALID_PRESETS)[number];
  if (!isProUnlocked()) {
    // Free tier: compact and spacious are Pro-only
    if (options.preset && options.preset !== "comfortable") {
      logger.hint(
        `Preset "${options.preset}" requires dsforge Pro`,
        `Set DSFORGE_KEY to unlock compact and spacious. Using comfortable.`,
      );
    }
    preset = "comfortable";
  } else if (options.preset && VALID_PRESETS.includes(options.preset as never)) {
    preset = options.preset as (typeof VALID_PRESETS)[number];
  } else {
    const answer = await ask(
      `  Density preset ${chalk.dim("(compact | comfortable | spacious)")} ${chalk.dim("[comfortable]")} `,
    );
    const trimmed = answer.trim().toLowerCase();
    preset = VALID_PRESETS.includes(trimmed as never)
      ? (trimmed as (typeof VALID_PRESETS)[number])
      : "comfortable";
  }

  logger.blank();

  // ── Build and write ──
  const config = buildInitialConfig(name, preset);
  const rules = buildInitialRules();

  await fs.writeJson(path.join(cwd, CONFIG_FILENAME), config, { spaces: 2 });
  logger.success(`${CONFIG_FILENAME}`);

  await fs.writeJson(path.join(cwd, RULES_FILENAME), rules, { spaces: 2 });
  logger.success(`${RULES_FILENAME}`);

  // ── Summary ──
  logger.blank();
  logger.info(`Package: ${name}  ·  Preset: ${preset}`);
  logger.blank();
  logger.dim("What was created:");
  logger.dim(
    `  ${CONFIG_FILENAME}  — token architecture, themes, typography, spacing`,
  );
  logger.dim(`  ${RULES_FILENAME}  — component governance rules`);
  logger.blank();
  logger.dim("Next:");
  logger.dim(
    `  1. Edit ${CONFIG_FILENAME} — replace the placeholder brand colors`,
  );
  logger.dim(`  2. dsforge generate`);
  logger.blank();
}
