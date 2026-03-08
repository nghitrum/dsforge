/**
 * WCAG 2.1 contrast ratio utilities.
 *
 * Implements the relative luminance formula from:
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */

// ─── Hex parsing ──────────────────────────────────────────────────────────────

/**
 * Parse a 3 or 6 digit hex color string into [r, g, b] (0–255).
 * Returns null if the string is not a valid hex color.
 */
export function parseHex(hex: string): [number, number, number] | null {
  const clean = hex.replace(/^#/, "");

  if (clean.length === 3) {
    const r = parseInt(clean[0]! + clean[0]!, 16);
    const g = parseInt(clean[1]! + clean[1]!, 16);
    const b = parseInt(clean[2]! + clean[2]!, 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r, g, b];
  }

  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r, g, b];
  }

  return null;
}

// ─── Relative luminance ───────────────────────────────────────────────────────

/**
 * Convert a single 8-bit channel value to its linearized form.
 * WCAG formula: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function linearize(channel: number): number {
  const sRGB = channel / 255;
  return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
}

/**
 * Calculate the relative luminance of an RGB color (values 0–255).
 * Returns a value between 0 (black) and 1 (white).
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

// ─── Contrast ratio ───────────────────────────────────────────────────────────

/**
 * Calculate the WCAG contrast ratio between two luminance values.
 * Returns a value between 1 (no contrast) and 21 (black on white).
 */
export function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate the contrast ratio between two hex color strings.
 * Returns null if either color cannot be parsed.
 */
export function hexContrastRatio(
  foreground: string,
  background: string,
): number | null {
  const fg = parseHex(foreground);
  const bg = parseHex(background);
  if (!fg || !bg) return null;

  const fgLum = relativeLuminance(...fg);
  const bgLum = relativeLuminance(...bg);
  return contrastRatio(fgLum, bgLum);
}

// ─── WCAG compliance checks ───────────────────────────────────────────────────

export type WcagLevel = "AA" | "AAA";
export type TextSize = "normal" | "large";

/**
 * Minimum contrast ratios per WCAG 2.1:
 *   AA normal text:  4.5:1
 *   AA large text:   3.0:1
 *   AAA normal text: 7.0:1
 *   AAA large text:  4.5:1
 *
 * "Large text" = ≥18pt (24px) normal weight OR ≥14pt (18.67px) bold.
 */
const WCAG_THRESHOLDS: Record<WcagLevel, Record<TextSize, number>> = {
  AA: { normal: 4.5, large: 3.0 },
  AAA: { normal: 7.0, large: 4.5 },
};

export interface ContrastCheckResult {
  ratio: number;
  passes: boolean;
  level: WcagLevel;
  textSize: TextSize;
  required: number;
  /** Rounded to 2dp for display */
  ratioDisplay: string;
}

/**
 * Check whether a foreground/background color pair meets the WCAG threshold.
 */
export function checkContrast(
  foreground: string,
  background: string,
  level: WcagLevel = "AA",
  textSize: TextSize = "normal",
): ContrastCheckResult | null {
  const ratio = hexContrastRatio(foreground, background);
  if (ratio === null) return null;

  const required = WCAG_THRESHOLDS[level][textSize];
  return {
    ratio,
    passes: ratio >= required,
    level,
    textSize,
    required,
    ratioDisplay: ratio.toFixed(2),
  };
}

/**
 * Given a hex color that fails contrast against a background,
 * suggest a darker (or lighter) variant that passes AA.
 *
 * Strategy: darken/lighten in HSL space by small steps until threshold met.
 * Returns the adjusted hex, or null if no adjustment found within 20 steps.
 */
export function suggestContrastFix(
  foreground: string,
  background: string,
  level: WcagLevel = "AA",
  textSize: TextSize = "normal",
): string | null {
  const bgParsed = parseHex(background);
  if (!bgParsed) return null;

  const bgLum = relativeLuminance(...bgParsed);
  const required = WCAG_THRESHOLDS[level][textSize];

  // Determine if we should darken or lighten the foreground
  // (darken if background is light, lighten if background is dark)
  const shouldDarken = bgLum > 0.5;

  const fgParsed = parseHex(foreground);
  if (!fgParsed) return null;

  let [r, g, b] = fgParsed;

  for (let step = 0; step < 30; step++) {
    const fgLum = relativeLuminance(r, g, b);
    const ratio = contrastRatio(fgLum, bgLum);

    if (ratio >= required) {
      return rgbToHex(r, g, b);
    }

    if (shouldDarken) {
      // Move RGB values toward 0 by ~5% each step
      r = Math.max(0, Math.round(r * 0.88));
      g = Math.max(0, Math.round(g * 0.88));
      b = Math.max(0, Math.round(b * 0.88));
    } else {
      // Move RGB values toward 255 by ~5% each step
      r = Math.min(255, Math.round(r + (255 - r) * 0.12));
      g = Math.min(255, Math.round(g + (255 - g) * 0.12));
      b = Math.min(255, Math.round(b + (255 - b) * 0.12));
    }
  }

  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

/**
 * Check whether a string looks like a parseable hex color.
 */
export function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}
