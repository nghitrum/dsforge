import path from "node:path";
import { spawn } from "node:child_process";
import fs from "fs-extra";
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
        ? "open"
        : process.platform === "win32"
          ? "cmd"
          : "xdg-open";

    const args =
      process.platform === "win32" ? ["/c", "start", "", outPath] : [outPath];

    const child = spawn(cmd, args, {
      detached: true,
      stdio: "ignore",
    });
    child.unref();

    logger.success(`Opened dist-ds/showcase.html`);
  } catch {
    logger.hint("Could not auto-open. Open manually:", `dist-ds/showcase.html`);
  }
  logger.blank();
}