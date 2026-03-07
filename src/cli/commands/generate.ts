import chalk from "chalk";
import ora from "ora";
import * as path from "path";
import { loadConfig, loadRules } from "../../utils/config-loader";
import { generateTokens } from "../../generators/tokens";
import { generateComponents } from "../../generators/components";
import { generateMetadata } from "../../generators/metadata";
import { generateDocs } from "../../generators/docs";
import { ComponentMetadata } from "../../types";
import * as fs from "fs-extra";

export async function generateCommand(cwd: string): Promise<void> {
  console.log(chalk.bold.blue("\n⚙️  dsgen generate\n"));

  const spinner = ora({ color: "blue" });

  // Pre-flight checks
  const configPath = path.join(cwd, "design-system.config.json");
  const rulesPath = path.join(cwd, "design-system.rules.json");

  if (!(await fs.pathExists(configPath))) {
    throw new Error(
      `design-system.config.json not found in ${cwd}.\n    Run "dsgen init" to create it.`,
    );
  }
  if (!(await fs.pathExists(rulesPath))) {
    throw new Error(
      `design-system.rules.json not found in ${cwd}.\n    Run "dsgen init" to create it.`,
    );
  }

  spinner.start("Loading and validating config...");
  let config, rules;
  try {
    config = await loadConfig(cwd);
    rules = await loadRules(cwd);
  } catch (err) {
    spinner.fail("Config validation failed");
    throw err;
  }
  spinner.succeed("Config loaded and valid");

  const outputDir = path.join(cwd, "generated");
  try {
    await fs.ensureDir(outputDir);
  } catch {
    throw new Error(
      `Cannot create output directory at ${outputDir}. Check permissions.`,
    );
  }

  spinner.start("Generating tokens...");
  try {
    await generateTokens(config, outputDir);
    spinner.succeed("Tokens generated  →  generated/tokens/");
  } catch (err) {
    spinner.fail("Token generation failed");
    throw new Error(`Failed to generate tokens: ${(err as Error).message}`);
  }

  spinner.start("Generating components...");
  try {
    await generateComponents(config, rules, outputDir);
    spinner.succeed("Components generated  →  generated/components/");
  } catch (err) {
    spinner.fail("Component generation failed");
    throw new Error(`Failed to generate components: ${(err as Error).message}`);
  }

  spinner.start("Generating metadata...");
  try {
    await generateMetadata(config, rules, outputDir);
    spinner.succeed("Metadata generated  →  generated/metadata/");
  } catch (err) {
    spinner.fail("Metadata generation failed");
    throw new Error(`Failed to generate metadata: ${(err as Error).message}`);
  }

  spinner.start("Generating docs...");
  try {
    const metadataIndexPath = path.join(outputDir, "metadata", "index.json");
    if (!(await fs.pathExists(metadataIndexPath))) {
      throw new Error(
        "metadata/index.json was not created — metadata step may have failed silently.",
      );
    }
    const metadataIndex = await fs.readJson(metadataIndexPath);
    await generateDocs(
      metadataIndex.components as ComponentMetadata[],
      outputDir,
    );
    spinner.succeed("Docs generated  →  generated/docs/");
  } catch (err) {
    spinner.fail("Docs generation failed");
    throw new Error(`Failed to generate docs: ${(err as Error).message}`);
  }

  console.log(chalk.bold.green("\n✅ Generation complete!\n"));
  console.log(
    chalk.dim("  Run ") +
      chalk.cyan("dsgen validate") +
      chalk.dim(" to check governance rules"),
  );
  console.log();
}
