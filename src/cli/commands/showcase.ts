import path from "node:path";
import fs from "fs-extra";
import { execSync } from "node:child_process";
import { readConfig } from "../../utils/fs";
import { resolveTokens } from "../../core/token-resolver";
import { generateShowcase } from "../../generators/showcase/html";
import { logger } from "../../utils/logger";

export async function runShowcase(cwd: string): Promise<void> {
  logger.blank();
  logger.section("dsforge showcase");

  let config;
  try {
    config = await readConfig(cwd);
  } catch (err) {
    logger.error((err as Error).message);
    logger.dim('Run "dsforge init" first to create a config.');
    return;
  }

  logger.step("Resolving tokens...");
  const resolution = resolveTokens(config);

  logger.step("Generating showcase...");
  const html = generateShowcase(config, resolution);

  const outPath = path.join(cwd, "dist-ds", "showcase.html");
  await fs.ensureDir(path.dirname(outPath));
  await fs.writeFile(outPath, html, "utf8");

  logger.success(`Showcase written to dist-ds/showcase.html`);
  logger.blank();

  // Open in browser
  logger.step("Opening in browser...");
  try {
    const cmd =
      process.platform === "darwin"
        ? `open "${outPath}"`
        : process.platform === "win32"
          ? `start "" "${outPath}"`
          : `xdg-open "${outPath}"`;
    execSync(cmd);
  } catch {
    logger.hint(
      "Could not auto-open. Open this file manually:",
      `dist-ds/showcase.html`,
    );
  }
}
