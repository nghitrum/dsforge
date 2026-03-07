import {
  GovernanceRules,
  ValidationResult,
  ValidationIssue,
  ComponentMetadata,
} from "../types";

export function validateGovernance(
  metadata: ComponentMetadata[],
  rules: GovernanceRules,
): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const meta of metadata) {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    const component = meta.component.toLowerCase() as keyof GovernanceRules;
    const componentRules = rules[component];

    if (!componentRules) {
      results.push({ component: meta.component, errors, warnings });
      continue;
    }

    if (
      "allowedVariants" in componentRules &&
      componentRules.allowedVariants &&
      meta.variants
    ) {
      for (const variant of meta.variants) {
        if (!componentRules.allowedVariants.includes(variant)) {
          errors.push({
            rule: "allowedVariants",
            message: `Variant "${variant}" is not in allowedVariants: [${componentRules.allowedVariants.join(", ")}]`,
            severity: "error",
          });
        }
      }
    }

    if (
      "colorPalette" in componentRules &&
      componentRules.colorPalette &&
      meta.tokens
    ) {
      // Only match token keys that start with "color" (e.g. colorPrimary, colorDanger).
      // Keys like borderColor or backgroundColor intentionally do NOT start with "color"
      // and must not be checked against the palette — they are not color-role tokens.
      const usedColors = Object.keys(meta.tokens)
        .filter((k) => /^color[A-Z]/.test(k))
        .map((k) => k.replace(/^color/, "").toLowerCase());

      for (const color of usedColors) {
        if (!componentRules.colorPalette.includes(color)) {
          warnings.push({
            rule: "colorPalette",
            message: `Color token "${color}" may not be in allowed palette: [${componentRules.colorPalette.join(", ")}]`,
            severity: "warning",
          });
        }
      }
    }

    if (
      "borderRadius" in componentRules &&
      componentRules.borderRadius &&
      meta.tokens.borderRadius
    ) {
      if (!componentRules.borderRadius.includes(meta.tokens.borderRadius)) {
        warnings.push({
          rule: "borderRadius",
          message: `borderRadius "${meta.tokens.borderRadius}" is not in allowed values: [${componentRules.borderRadius.join(", ")}]`,
          severity: "warning",
        });
      }
    }

    if (
      "maxWidth" in componentRules &&
      componentRules.maxWidth &&
      meta.tokens.maxWidth
    ) {
      if (meta.tokens.maxWidth !== componentRules.maxWidth) {
        warnings.push({
          rule: "maxWidth",
          message: `maxWidth "${meta.tokens.maxWidth}" differs from rule "${componentRules.maxWidth}"`,
          severity: "warning",
        });
      }
    }

    if (
      "allowedShadows" in componentRules &&
      componentRules.allowedShadows &&
      meta.tokens.shadow
    ) {
      if (!componentRules.allowedShadows.includes(meta.tokens.shadow)) {
        warnings.push({
          rule: "allowedShadows",
          message: `shadow "${meta.tokens.shadow}" is not in allowedShadows: [${componentRules.allowedShadows.join(", ")}]`,
          severity: "warning",
        });
      }
    }

    if (
      "requiredAccessibility" in componentRules &&
      componentRules.requiredAccessibility
    ) {
      const { accessibilityContract } = meta;
      for (const req of componentRules.requiredAccessibility) {
        if (req === "keyboard-support" && !accessibilityContract.keyboard) {
          errors.push({
            rule: "requiredAccessibility",
            message: `Missing required accessibility: keyboard-support`,
            severity: "error",
          });
        }
        if (req === "aria-label" && !accessibilityContract.ariaLabel) {
          errors.push({
            rule: "requiredAccessibility",
            message: `Missing required accessibility: aria-label contract`,
            severity: "error",
          });
        }
      }
    }

    results.push({ component: meta.component, errors, warnings });
  }

  return results;
}

export function formatValidationReport(results: ValidationResult[]): string {
  const lines: string[] = ["", "Governance Validation Report", "═".repeat(40)];

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of results) {
    const issues = [...result.errors, ...result.warnings];
    if (issues.length === 0) {
      lines.push(`✅ ${result.component} — no issues`);
      continue;
    }

    lines.push(`\n📦 ${result.component}`);
    for (const issue of issues) {
      if (issue.severity === "error") {
        lines.push(`  ✖ [ERROR]   ${issue.message}`);
        totalErrors++;
      } else {
        lines.push(`  ⚠ [WARNING] ${issue.message}`);
        totalWarnings++;
      }
    }
  }

  lines.push("\n" + "─".repeat(40));
  lines.push(`Summary: ${totalErrors} error(s), ${totalWarnings} warning(s)`);

  if (totalErrors > 0) {
    lines.push("❌ Validation failed — fix errors before shipping");
  } else if (totalWarnings > 0) {
    lines.push("⚠️  Validation passed with warnings");
  } else {
    lines.push("✅ All components passed governance validation");
  }

  return lines.join("\n");
}
