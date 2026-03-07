import chalk from "chalk";
import ora from "ora";
import * as path from "path";
import * as fs from "fs-extra";
import { execSync } from "child_process";
import { loadConfig, loadRules } from "../../utils/config-loader";
import { generateShowcase } from "../../generators/showcase";
import { ComponentMetadata } from "../../types";

// ─── Open HTML in browser ─────────────────────────────────────────────────────

function openInBrowser(filePath: string): void {
  const url = `file://${filePath}`;
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";

  try {
    execSync(`${cmd} "${url}"`, { stdio: "ignore" });
  } catch {
    console.log(chalk.dim(`  Could not open browser automatically.`));
    console.log(
      chalk.dim(`  Open this file manually: `) + chalk.cyan(filePath),
    );
  }
}

// ─── Main command ─────────────────────────────────────────────────────────────

export async function showcaseCommand(cwd: string): Promise<void> {
  console.log(chalk.bold.blue("\n🖼️  dsforge showcase\n"));

  if (!(await fs.pathExists(path.join(cwd, "design-system.config.json")))) {
    throw new Error(
      `design-system.config.json not found.\n    Run "dsforge init" first.`,
    );
  }
  if (!(await fs.pathExists(path.join(cwd, "design-system.rules.json")))) {
    throw new Error(
      `design-system.rules.json not found.\n    Run "dsforge init" first.`,
    );
  }
  const metadataPath = path.join(cwd, "generated", "metadata", "index.json");
  if (!(await fs.pathExists(metadataPath))) {
    throw new Error(
      `No generated metadata found.\n    Run "dsforge generate" first.`,
    );
  }

  const config = await loadConfig(cwd);
  const rules = await loadRules(cwd);

  let metadataIndex;
  try {
    metadataIndex = await fs.readJson(metadataPath);
  } catch {
    throw new Error(
      `Could not read metadata/index.json. Run "dsforge generate" again.`,
    );
  }
  const metadata = metadataIndex.components as ComponentMetadata[];

  const spinner = ora({ color: "blue" });
  spinner.start("Generating HTML showcase...");

  let outPath: string;
  try {
    outPath = await generateShowcase(
      config,
      rules,
      metadata,
      path.join(cwd, "generated"),
    );
    spinner.succeed(`Showcase generated  →  generated/showcase/index.html`);
  } catch (err) {
    spinner.fail("Showcase generation failed");
    throw new Error(`Failed to generate showcase: ${(err as Error).message}`);
  }

  console.log(chalk.bold.green("\n✅ Opening in browser...\n"));
  openInBrowser(outPath);
}
