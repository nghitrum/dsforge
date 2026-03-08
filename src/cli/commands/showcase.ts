import path from "node:path";
import fs from "fs-extra";
import { execSync } from "node:child_process";
import { logger } from "../../utils/logger";

export async function runShowcase(cwd: string): Promise<void> {
  logger.blank();
  logger.section("dsforge showcase");

  const outPath = path.join(cwd, "dist-ds", "showcase.html");

  if (!(await fs.pathExists(outPath))) {
    logger.error("showcase.html not found.");
    logger.dim('Run "dsforge generate" first to build it.');
    return;
  }

  logger.step("Opening showcase...");
  try {
    const cmd =
      process.platform === "darwin"
        ? `open "${outPath}"`
        : process.platform === "win32"
          ? `start "" "${outPath}"`
          : `xdg-open "${outPath}"`;
    execSync(cmd);
    logger.success(`Opened dist-ds/showcase.html`);
  } catch {
    logger.hint("Could not auto-open. Open manually:", `dist-ds/showcase.html`);
  }
  logger.blank();
}
