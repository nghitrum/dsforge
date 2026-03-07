import {
  DesignSystemConfig,
  GovernanceRules,
  ComponentMetadata,
} from "../types";
import * as path from "path";
import * as fs from "fs-extra";

export async function generateMetadata(
  config: DesignSystemConfig,
  rules: GovernanceRules,
  outputDir: string,
): Promise<void> {
  const metadataDir = path.join(outputDir, "metadata");
  await fs.ensureDir(metadataDir);

  const allowedVariants = rules.button?.allowedVariants ?? [
    "primary",
    "secondary",
    "danger",
  ];

  const components: ComponentMetadata[] = [
    {
      component: "Button",
      role: "action-trigger",
      hierarchyLevel: "primary",
      interactionModel: "synchronous",
      layoutImpact: "inline",
      destructive: allowedVariants.includes("danger"),
      accessibilityContract: {
        keyboard: true,
        focusRing: "required",
        ariaLabel: "required-for-icon-only",
      },
      variants: allowedVariants,
      tokens: {
        colorPrimary: config.color.primary,
        colorDanger: config.color.danger,
        colorSecondary: config.color.secondary,
        borderRadius: `${config.radius.scale[1]}px`,
        fontWeight: "500",
      },
    },
    {
      component: "Input",
      role: "data-entry",
      hierarchyLevel: "secondary",
      interactionModel: "synchronous",
      layoutImpact: "block",
      destructive: false,
      accessibilityContract: {
        keyboard: true,
        focusRing: "required",
        ariaLabel: "label-element-required",
      },
      tokens: {
        borderColor: config.color.secondary,
        borderColorError: config.color.danger,
        borderRadius: `${config.radius.scale[1]}px`,
        fontSize: `${config.typography.scale[1]}px`,
      },
    },
    {
      component: "Card",
      role: "content-container",
      hierarchyLevel: "layout",
      interactionModel: "static",
      layoutImpact: "block",
      destructive: false,
      accessibilityContract: {
        keyboard: false,
        focusRing: "none",
      },
      tokens: {
        backgroundColor: config.color.background,
        borderRadius: `${config.radius.scale[2]}px`,
        maxWidth: rules.card?.maxWidth ?? "600px",
      },
    },
    {
      component: "Typography",
      role: "text-display",
      hierarchyLevel: "content",
      interactionModel: "static",
      layoutImpact: "inline-block",
      destructive: false,
      accessibilityContract: {
        keyboard: false,
        focusRing: "none",
      },
      tokens: {
        fontFamily: config.typography.fontFamily,
        colorDefault: config.color.text,
      },
    },
    {
      component: "Stack",
      role: "layout-primitive",
      hierarchyLevel: "layout",
      interactionModel: "static",
      layoutImpact: "block",
      destructive: false,
      accessibilityContract: {
        keyboard: false,
        focusRing: "none",
      },
      tokens: {
        spacingBaseUnit: `${config.spacing.baseUnit}px`,
      },
    },
  ];

  // Write individual component metadata
  for (const meta of components) {
    await fs.writeJson(path.join(metadataDir, `${meta.component}.json`), meta, {
      spaces: 2,
    });
  }

  // Write combined index
  await fs.writeJson(
    path.join(metadataDir, "index.json"),
    {
      generatedAt: new Date().toISOString(),
      version: "0.1.0",
      components,
    },
    { spaces: 2 },
  );
}
