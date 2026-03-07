import * as fs from "fs-extra";
import * as path from "path";
import {
  DesignSystemConfig,
  DesignSystemConfigSchema,
  GovernanceRules,
  GovernanceRulesSchema,
} from "../types";

export async function loadConfig(cwd: string): Promise<DesignSystemConfig> {
  const configPath = path.join(cwd, "design-system.config.json");

  if (!(await fs.pathExists(configPath))) {
    throw new Error(
      `Config file not found at ${configPath}. Run "dsforge init" first.`,
    );
  }

  const raw = await fs.readJson(configPath);
  const result = DesignSystemConfigSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid design-system.config.json:\n${issues}`);
  }

  return result.data;
}

export async function loadRules(cwd: string): Promise<GovernanceRules> {
  const rulesPath = path.join(cwd, "design-system.rules.json");

  if (!(await fs.pathExists(rulesPath))) {
    throw new Error(
      `Rules file not found at ${rulesPath}. Run "dsforge init" first.`,
    );
  }

  const raw = await fs.readJson(rulesPath);
  const result = GovernanceRulesSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid design-system.rules.json:\n${issues}`);
  }

  return result.data;
}
