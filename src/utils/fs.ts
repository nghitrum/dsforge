import fs from "fs-extra";
import path from "node:path";
import {
  DesignSystemConfigSchema,
  RulesConfigSchema,
} from "../schema/config.schema";
import type { DesignSystemConfig, RulesConfig } from "../types/index";

export const CONFIG_FILENAME = "design-system.config.json";
export const RULES_FILENAME = "design-system.rules.json";

// ─── Config I/O ───────────────────────────────────────────────────────────────

/**
 * Read and parse design-system.config.json from the given directory.
 * Throws with a descriptive message if the file is missing or malformed.
 */
export async function readConfig(
  cwd: string = process.cwd(),
): Promise<DesignSystemConfig> {
  const configPath = path.join(cwd, CONFIG_FILENAME);

  if (!(await fs.pathExists(configPath))) {
    throw new Error(
      `Config file not found at ${configPath}.\n` +
        `  Run "dsforge init" to create one.`,
    );
  }

  let raw: unknown;
  try {
    raw = await fs.readJson(configPath);
  } catch (err) {
    throw new Error(
      `Failed to parse ${CONFIG_FILENAME}: ${(err as Error).message}\n` +
        `  Check for JSON syntax errors.`,
    );
  }

  const result = DesignSystemConfigSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join(".")} — ${i.message}`)
      .join("\n");
    throw new Error(`Config validation failed:\n${issues}`);
  }

  return result.data as DesignSystemConfig;
}

/**
 * Read and parse design-system.rules.json, returning an empty object if the file doesn't exist.
 */
export async function readRules(
  cwd: string = process.cwd(),
): Promise<RulesConfig> {
  const rulesPath = path.join(cwd, RULES_FILENAME);

  if (!(await fs.pathExists(rulesPath))) {
    return {};
  }

  let raw: unknown;
  try {
    raw = await fs.readJson(rulesPath);
  } catch (err) {
    throw new Error(
      `Failed to parse ${RULES_FILENAME}: ${(err as Error).message}`,
    );
  }

  const result = RulesConfigSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join(".")} — ${i.message}`)
      .join("\n");
    throw new Error(`Rules validation failed:\n${issues}`);
  }

  return result.data as RulesConfig;
}

/**
 * Write a config object to disk as formatted JSON.
 */
export async function writeConfig(
  config: DesignSystemConfig,
  cwd: string = process.cwd(),
): Promise<void> {
  const configPath = path.join(cwd, CONFIG_FILENAME);
  await fs.writeJson(configPath, config, { spaces: 2 });
}

/**
 * Write a rules object to disk as formatted JSON.
 */
export async function writeRules(
  rules: RulesConfig,
  cwd: string = process.cwd(),
): Promise<void> {
  const rulesPath = path.join(cwd, RULES_FILENAME);
  await fs.writeJson(rulesPath, rules, { spaces: 2 });
}

// ─── Project discovery ────────────────────────────────────────────────────────

/**
 * Check whether a dsforge project already exists in the given directory.
 */
export async function projectExists(
  cwd: string = process.cwd(),
): Promise<boolean> {
  return fs.pathExists(path.join(cwd, CONFIG_FILENAME));
}

/**
 * Ensure a directory exists, creating it if necessary.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

/**
 * Write a file, creating parent directories if needed.
 */
export async function writeFile(
  filePath: string,
  content: string,
): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
}
