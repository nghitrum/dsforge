import { DesignSystemConfig, ResolvedTokens } from "../types";

/**
 * Single source of truth for all resolved design token values.
 *
 * Every generator imports from here. Nothing in generators/, showcase.ts,
 * or components.ts may hardcode a px value, hex color, shadow string,
 * or timing function — it must come from this function's return value.
 */
export function resolveTokens(config: DesignSystemConfig): ResolvedTokens {
  const { color, typography, spacing, radius, philosophy, shadow, animation } =
    config;

  // ── Colors ──────────────────────────────────────────────────────────────────
  const colorSurface = color.surface ?? deriveSurface(color.background);
  const colorBorder =
    color.border ??
    withAlpha("#000000", philosophy.elevation === "minimal" ? 0.06 : 0.09);
  const colorFocus = color.focus ?? color.primary;
  const colorSuccess = color.success ?? "#16a34a";
  const colorOnPrimary = color.onPrimary ?? contrastColor(color.primary);
  const colorCodeBg = deriveCodeBg(color.background, colorSurface);

  // Dark mode — user-configurable via config.darkMode, with sensible defaults
  const darkBackground = config.darkMode?.background ?? "#0f172a";
  const darkText = config.darkMode?.text ?? "#f1f5f9";
  const darkSurface = config.darkMode?.surface ?? "#1e293b";
  const darkBorder = config.darkMode?.border ?? "rgba(255,255,255,0.08)";
  const darkCodeBg = config.darkMode?.codeBg ?? "#1e293b";

  // ── Shadows ─────────────────────────────────────────────────────────────────
  const shadows = resolveShadows(philosophy.elevation, shadow);

  // ── Focus ring ───────────────────────────────────────────────────────────────
  const focusRing = `0 0 0 3px ${withAlpha(colorFocus, 0.35)}`;

  // ── Typography ───────────────────────────────────────────────────────────────
  const scale = typography.scale;
  const weights = typography.fontWeights;

  // UI chrome sizes — just below the content scale
  const scaleMin = scale[0] ?? 12;
  const fontSizeUiXs = Math.max(scaleMin - 2, 10) + "px"; // e.g. 10px
  const fontSizeUiSm = scaleMin + "px"; // e.g. 12px
  const fontSizeUiMd = (scale[1] ?? 14) + "px"; // e.g. 14px — nav items

  // Line-heights driven by density
  const lhTight = philosophy.density === "compact" ? 1.15 : 1.2;
  const lhSnug = philosophy.density === "compact" ? 1.3 : 1.35;
  const lhNormal = philosophy.density === "compact" ? 1.5 : 1.6;
  const lhLoose = philosophy.density === "compact" ? 1.4 : 1.5;

  // ── Spacing ──────────────────────────────────────────────────────────────────
  const densityMult =
    philosophy.density === "compact"
      ? 0.75
      : philosophy.density === "spacious"
        ? 1.25
        : 1;
  const base = spacing.baseUnit;
  const sp = (n: number) => Math.round(base * n * densityMult) + "px";
  const spNum = (n: number) => Math.round(base * n * densityMult); // raw number for JS computations

  // ── Radius ───────────────────────────────────────────────────────────────────
  const rad = radius.scale;

  // ── Animation ────────────────────────────────────────────────────────────────
  const duration =
    animation?.duration ??
    (philosophy.density === "compact" ? "0.1s" : "0.15s");
  const durationFast = animation?.duration
    ? halfDuration(animation.duration)
    : philosophy.density === "compact"
      ? "0.08s"
      : "0.12s";
  const easing = animation?.easing ?? "ease";

  return {
    // Colors
    colorPrimary: color.primary,
    colorSecondary: color.secondary,
    colorDanger: color.danger,
    colorBackground: color.background,
    colorText: color.text,
    colorSurface,
    colorBorder,
    colorFocus,
    colorSuccess,
    colorOnPrimary,
    colorCodeBg,
    darkBackground,
    darkText,
    darkSurface,
    darkBorder,
    darkCodeBg,
    // Shadows
    shadowNone: shadows.none,
    shadowSmall: shadows.small,
    shadowMedium: shadows.medium,
    // Focus
    focusRing,
    // Typography
    fontFamily: typography.fontFamily,
    fontSizeXs: (scale[0] ?? 12) + "px",
    fontSizeSm: (scale[1] ?? 14) + "px",
    fontSizeMd: (scale[2] ?? 16) + "px",
    fontSizeLg: (scale[3] ?? 20) + "px",
    fontSizeXl: (scale[4] ?? 24) + "px",
    fontSize2xl: (scale[5] ?? 32) + "px",
    fontSizeUiXs,
    fontSizeUiSm,
    fontSizeUiMd,
    fontWeightRegular: weights[0] ?? 400,
    fontWeightMedium: weights[1] ?? 500,
    fontWeightSemibold: weights[2] ?? 600,
    lineHeightTight: lhTight,
    lineHeightSnug: lhSnug,
    lineHeightNormal: lhNormal,
    lineHeightLoose: lhLoose,
    // Spacing
    spaceUnit: spNum(1),
    spaceXs: sp(1),
    spaceSm: sp(2),
    spaceMd: sp(3),
    spaceLg: sp(4),
    spaceXl: sp(6),
    space2xl: sp(8),
    // Border
    borderWidth: "1px",
    // Radius
    radiusSm: (rad[0] ?? 2) + "px",
    radiusMd: (rad[1] ?? 4) + "px",
    radiusLg: (rad[2] ?? 8) + "px",
    radiusXl: (rad[3] ?? 16) + "px",
    radiusFull: "9999px",
    // Animation
    duration,
    durationFast,
    easing,
    transition: `all ${duration} ${easing}`,
  };
}

// ─── Shadow presets by elevation ─────────────────────────────────────────────

function resolveShadows(
  elevation: "minimal" | "moderate" | "high",
  override?: { none?: string; small?: string; medium?: string },
): { none: string; small: string; medium: string } {
  const presets = {
    minimal: {
      none: "none",
      small: "0 1px 2px rgba(0,0,0,0.07)",
      medium: "0 2px 8px rgba(0,0,0,0.10)",
    },
    moderate: {
      none: "none",
      small: "0 1px 3px rgba(0,0,0,0.10)",
      medium: "0 4px 12px rgba(0,0,0,0.12)",
    },
    high: {
      none: "none",
      small: "0 2px 6px rgba(0,0,0,0.14)",
      medium: "0 8px 24px rgba(0,0,0,0.16)",
    },
  };
  const base = presets[elevation];
  return {
    none: override?.none ?? base.none,
    small: override?.small ?? base.small,
    medium: override?.medium ?? base.medium,
  };
}

// ─── Color helpers ────────────────────────────────────────────────────────────

/** Adds alpha to a 6-digit hex color → rgba(...) */
function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Derives a surface color (slightly off-background) when not explicitly set.
 * Light backgrounds → very light grey. Others → unchanged.
 */
function deriveSurface(bg: string): string {
  const normalized = bg.replace("#", "").toLowerCase();
  if (normalized === "ffffff" || normalized === "fff") return "#f8fafc";
  if (normalized === "f8fafc") return "#f1f5f9";
  return bg;
}

/**
 * Derives a code/snippet background. Slightly darker than surface.
 */
function deriveCodeBg(bg: string, surface: string): string {
  const normalized = bg.replace("#", "").toLowerCase();
  if (normalized === "ffffff" || normalized === "fff") return "#f1f5f9";
  if (normalized === "f8fafc") return "#e2e8f0";
  return surface;
}

/**
 * Returns white or near-black depending on whether the given hex is dark or light.
 * Used for text on primary-coloured buttons/backgrounds.
 */
function contrastColor(hex: string): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "#ffffff";
  // Perceived luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#111827" : "#ffffff";
}

/** Halves a CSS duration string: "0.15s" → "0.08s" */
function halfDuration(d: string): string {
  const n = parseFloat(d);
  const unit = d.replace(/[0-9.]/g, "");
  return (Math.round(n * 50) / 100).toFixed(2) + unit;
}
