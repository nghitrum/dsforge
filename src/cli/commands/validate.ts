import chalk from "chalk";
import * as path from "path";
import * as fs from "fs-extra";
import { loadRules } from "../../utils/config-loader";
import {
  validateGovernance,
  formatValidationReport,
} from "../../validators/governance";
import { ComponentMetadata } from "../../types";

export async function validateCommand(cwd: string): Promise<void> {
  console.log(chalk.bold.blue("\n🔍 dsforge validate\n"));

  const rulesPath = path.join(cwd, "design-system.rules.json");
  const generatedDir = path.join(cwd, "generated");
  const metadataPath = path.join(generatedDir, "metadata", "index.json");

  if (!(await fs.pathExists(rulesPath))) {
    throw new Error(
      `design-system.rules.json not found in ${cwd}.\n    Run "dsforge init" to create it.`,
    );
  }
  if (!(await fs.pathExists(generatedDir))) {
    throw new Error(
      `No "generated/" directory found.\n    Run "dsforge generate" first.`,
    );
  }
  if (!(await fs.pathExists(metadataPath))) {
    throw new Error(
      `metadata/index.json not found.\n    Run "dsforge generate" to produce it.`,
    );
  }

  let rules;
  try {
    rules = await loadRules(cwd);
  } catch (err) {
    throw new Error(
      `Could not load design-system.rules.json: ${(err as Error).message}`,
    );
  }

  let metadataIndex;
  try {
    metadataIndex = await fs.readJson(metadataPath);
  } catch {
    throw new Error(
      `Could not parse metadata/index.json — it may be corrupted.\n    Try running "dsforge generate" again.`,
    );
  }

  if (
    !Array.isArray(metadataIndex.components) ||
    metadataIndex.components.length === 0
  ) {
    throw new Error(
      `metadata/index.json has no components.\n    Try running "dsforge generate" again.`,
    );
  }

  const components = metadataIndex.components as ComponentMetadata[];
  const results = validateGovernance(components, rules);
  const report = formatValidationReport(results);

  console.log(report);

  const hasErrors = results.some((r) => r.errors.length > 0);
  if (hasErrors) process.exit(1);

  console.log();
}
