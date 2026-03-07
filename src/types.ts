import { z } from "zod";

export const DesignSystemConfigSchema = z.object({
  typography: z.object({
    fontFamily: z.string(),
    scale: z.array(z.number()),
    fontWeights: z.array(z.number()),
  }),
  spacing: z.object({
    baseUnit: z.number(),
  }),
  radius: z.object({
    scale: z.array(z.number()),
  }),
  color: z.object({
    primary: z.string(),
    secondary: z.string(),
    danger: z.string(),
    background: z.string(),
    text: z.string(),
  }),
  philosophy: z.object({
    density: z.enum(["compact", "comfortable", "spacious"]),
    elevation: z.enum(["minimal", "moderate", "high"]),
  }),
});

export const GovernanceRulesSchema = z.object({
  button: z
    .object({
      allowedVariants: z.array(z.string()).optional(),
      maxWidth: z.string().optional(),
      colorPalette: z.array(z.string()).optional(),
      requiredAccessibility: z.array(z.string()).optional(),
    })
    .optional(),
  card: z
    .object({
      maxWidth: z.string().optional(),
      borderRadius: z.array(z.string()).optional(),
      allowedShadows: z.array(z.string()).optional(),
    })
    .optional(),
  input: z
    .object({
      allowedTypes: z.array(z.string()).optional(),
      requiredAccessibility: z.array(z.string()).optional(),
    })
    .optional(),
});

export type DesignSystemConfig = z.infer<typeof DesignSystemConfigSchema>;
export type GovernanceRules = z.infer<typeof GovernanceRulesSchema>;

export interface ComponentMetadata {
  component: string;
  role: string;
  hierarchyLevel: string;
  interactionModel: string;
  layoutImpact: string;
  destructive: boolean;
  accessibilityContract: {
    keyboard: boolean;
    focusRing: string;
    ariaLabel?: string;
  };
  variants?: string[];
  tokens: Record<string, string>;
}

export interface ValidationResult {
  component: string;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationIssue {
  rule: string;
  message: string;
  severity: "error" | "warning";
}

export interface GenerationContext {
  config: DesignSystemConfig;
  rules: GovernanceRules;
  outputDir: string;
}
