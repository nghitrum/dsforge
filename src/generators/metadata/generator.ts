/**
 * AI-consumable metadata generator.
 *
 * Outputs one JSON file per component + an index.json registry.
 * These files are read by AI coding assistants (Copilot, Cursor, Claude)
 * to understand component contracts before generating UI code.
 *
 * Format is designed to be both human-readable and machine-parseable.
 */

import type {
  DesignSystemConfig,
  RulesConfig,
  ComponentRule,
} from "../../types/index";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ComponentMetadata {
  component: string;
  version: string;
  description: string;
  role: string;
  hierarchyLevel: "primary" | "secondary" | "tertiary" | "utility";
  interactionModel: "synchronous" | "asynchronous" | "none";
  layoutImpact: "inline" | "block" | "overlay" | "layout";
  destructive: boolean;
  allowedVariants: string[];
  defaultVariant: string;
  sizes?: string[];
  requiredProps: string[];
  optionalProps: string[];
  tokens: Record<string, string>;
  accessibilityContract: {
    keyboard: boolean;
    focusRing: boolean;
    ariaLabel: "required" | "optional" | "forbidden";
    role?: string;
    announcements?: string[];
  };
  governanceRules: {
    maxWidth?: string;
    allowedRadius?: string[];
    allowedShadows?: string[];
    colorPalette?: string[];
  };
}

export interface DesignSystemMetadata {
  name: string;
  version: string;
  generatedAt: string;
  components: string[];
  tokenCount: number;
  themes: string[];
}

// ─── Component metadata builders ─────────────────────────────────────────────

const COMPONENT_DEFAULTS: Record<string, Partial<ComponentMetadata>> = {
  button: {
    description:
      "Triggers an action or navigation. The primary interactive element.",
    role: "action-trigger",
    hierarchyLevel: "primary",
    interactionModel: "synchronous",
    layoutImpact: "inline",
    destructive: false,
    sizes: ["sm", "md", "lg"],
  },
  input: {
    description: "Accepts user text input. Use with a label for accessibility.",
    role: "data-entry",
    hierarchyLevel: "primary",
    interactionModel: "synchronous",
    layoutImpact: "block",
    destructive: false,
    sizes: ["sm", "md", "lg"],
  },
  card: {
    description:
      "Groups related content with optional header, body, and footer slots.",
    role: "content-container",
    hierarchyLevel: "utility",
    interactionModel: "none",
    layoutImpact: "block",
    destructive: false,
  },
};

function buildComponentMetadata(
  componentName: string,
  rule: ComponentRule,
  config: DesignSystemConfig,
): ComponentMetadata {
  const defaults = COMPONENT_DEFAULTS[componentName.toLowerCase()] ?? {};
  const variants = rule.allowedVariants ?? ["default"];
  const requiredProps = rule.requiredProps ?? [];

  // Build token map: token name → CSS custom property
  const tokens: Record<string, string> = {};
  for (const [tokenName] of Object.entries(rule.tokens ?? {})) {
    tokens[tokenName] = `--${tokenName}`;
  }

  const meta: ComponentMetadata = {
    component: pascalCase(componentName),
    version: config.meta.version,
    description: defaults.description ?? `A ${componentName} component.`,
    role: defaults.role ?? "ui-element",
    hierarchyLevel: defaults.hierarchyLevel ?? "utility",
    interactionModel: defaults.interactionModel ?? "none",
    layoutImpact: defaults.layoutImpact ?? "inline",
    destructive:
      componentName.toLowerCase().includes("delete") ||
      variants.includes("danger"),
    allowedVariants: variants,
    defaultVariant: variants[0] ?? "default",
    requiredProps,
    optionalProps: buildOptionalProps(componentName, defaults),
    tokens,
    accessibilityContract: {
      keyboard: rule.a11y?.keyboard ?? true,
      focusRing: rule.a11y?.focusRing ?? true,
      ariaLabel: rule.a11y?.ariaLabel ?? "optional",
      ...(rule.a11y?.role ? { role: rule.a11y.role } : {}),
    },
    governanceRules: {
      ...(rule.maxWidth ? { maxWidth: rule.maxWidth } : {}),
      ...(rule.allowedRadius ? { allowedRadius: rule.allowedRadius } : {}),
      ...(rule.allowedShadows ? { allowedShadows: rule.allowedShadows } : {}),
      ...(rule.colorPalette ? { colorPalette: rule.colorPalette } : {}),
    },
  };

  if (defaults.sizes) {
    meta.sizes = defaults.sizes;
  }

  return meta;
}

function buildOptionalProps(
  componentName: string,
  _defaults: Partial<ComponentMetadata>,
): string[] {
  const common = ["className", "style", "id", "data-testid"];
  const byComponent: Record<string, string[]> = {
    button: [
      "size",
      "loading",
      "disabled",
      "fullWidth",
      "iconLeft",
      "iconRight",
      "onClick",
    ],
    input: [
      "size",
      "disabled",
      "label",
      "helperText",
      "errorMessage",
      "placeholder",
      "startAdornment",
      "endAdornment",
      "onChange",
    ],
    card: ["maxWidth", "noPadding", "onClick"],
  };
  return [...(byComponent[componentName.toLowerCase()] ?? []), ...common];
}

function pascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Index metadata ───────────────────────────────────────────────────────────

function buildIndexMetadata(
  config: DesignSystemConfig,
  componentNames: string[],
  tokenCount: number,
): DesignSystemMetadata {
  return {
    name: config.meta.name,
    version: config.meta.version,
    generatedAt: new Date().toISOString(),
    components: componentNames.map(pascalCase),
    tokenCount,
    themes: Object.keys(config.themes ?? {}),
  };
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export interface MetadataFile {
  filename: string;
  content: string;
}

/**
 * Generate all metadata JSON files.
 * Returns { filename, content } pairs ready to write to disk.
 */
export function generateMetadata(
  config: DesignSystemConfig,
  rules: RulesConfig,
  tokenCount: number,
): MetadataFile[] {
  const files: MetadataFile[] = [];
  const componentNames = Object.keys(rules);

  // One JSON file per component
  for (const [componentName, rule] of Object.entries(rules)) {
    const metadata = buildComponentMetadata(componentName, rule, config);
    files.push({
      filename: `${componentName}.json`,
      content: JSON.stringify(metadata, null, 2),
    });
  }

  // index.json — registry of all components
  const index = buildIndexMetadata(config, componentNames, tokenCount);
  files.push({
    filename: "index.json",
    content: JSON.stringify(index, null, 2),
  });

  return files;
}
