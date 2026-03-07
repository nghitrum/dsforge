import chalk from "chalk";
import ora from "ora";
import * as path from "path";
import * as fs from "fs-extra";
import { spawn, execSync } from "child_process";
import { loadConfig, loadRules } from "../../utils/config-loader";
import { generateShowcase, ShowcaseFormat } from "../../generators/showcase";
import { ComponentMetadata } from "../../types";
import { prompt } from "../index";

const FORMAT_OPTIONS = [
  {
    key: "1",
    label: "HTML",
    description: "Single file — opens instantly in your browser",
  },
  {
    key: "2",
    label: "Vite + React",
    description: "Full app with hot reload — we'll install & start it for you",
  },
];

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

// ─── Run npm install + vite dev ───────────────────────────────────────────────

async function startViteApp(showcaseDir: string): Promise<void> {
  const installSpinner = ora({
    text: "Installing dependencies...",
    color: "blue",
  }).start();
  await new Promise<void>((resolve, reject) => {
    const install = spawn("npm", ["install"], {
      cwd: showcaseDir,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    install.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString();
    });
    install.on("close", (code) => {
      if (code === 0) {
        installSpinner.succeed("Dependencies installed");
        resolve();
      } else {
        installSpinner.fail("npm install failed");
        reject(
          new Error(stderr.trim() || "npm install exited with code " + code),
        );
      }
    });
  });

  console.log(chalk.bold.green("\n✅ Starting dev server...\n"));
  console.log(
    chalk.dim("  Press ") + chalk.bold("ctrl+c") + chalk.dim(" to stop\n"),
  );

  await new Promise<void>((resolve, reject) => {
    const dev = spawn("npm", ["run", "dev"], {
      cwd: showcaseDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    dev.on("close", (code) => {
      if (code === 0 || code === null) resolve();
      else reject(new Error(`Dev server exited with code ${code}`));
    });
    dev.on("error", reject);
  });
}

// ─── Main command ─────────────────────────────────────────────────────────────

export async function showcaseCommand(
  cwd: string,
  flagFormat?: string,
): Promise<void> {
  console.log(chalk.bold.blue("\n🖼️  dsgen showcase\n"));

  if (!(await fs.pathExists(path.join(cwd, "design-system.config.json")))) {
    throw new Error(
      `design-system.config.json not found.\n    Run "dsgen init" first.`,
    );
  }
  if (!(await fs.pathExists(path.join(cwd, "design-system.rules.json")))) {
    throw new Error(
      `design-system.rules.json not found.\n    Run "dsgen init" first.`,
    );
  }
  const metadataPath = path.join(cwd, "generated", "metadata", "index.json");
  if (!(await fs.pathExists(metadataPath))) {
    throw new Error(
      `No generated metadata found.\n    Run "dsgen generate" first.`,
    );
  }

  const config = await loadConfig(cwd);
  const rules = await loadRules(cwd);

  let metadataIndex;
  try {
    metadataIndex = await fs.readJson(metadataPath);
  } catch {
    throw new Error(
      `Could not read metadata/index.json. Run "dsgen generate" again.`,
    );
  }
  const metadata = metadataIndex.components as ComponentMetadata[];

  let format: ShowcaseFormat;
  if (flagFormat === "html" || flagFormat === "vite") {
    format = flagFormat;
    console.log(chalk.dim(`  Format: ${format}\n`));
  } else {
    const idx = await prompt("Choose a showcase format:", FORMAT_OPTIONS);
    format = idx === 0 ? "html" : "vite";
    console.log();
  }

  const spinner = ora({ color: "blue" });
  spinner.start(
    `Generating ${format === "html" ? "HTML showcase" : "Vite + React app"}...`,
  );

  let outPath: string;
  try {
    outPath = await generateShowcase(
      config,
      rules,
      metadata,
      path.join(cwd, "generated"),
      format,
    );
    spinner.succeed(`Showcase generated  →  generated/showcase/`);
  } catch (err) {
    spinner.fail("Showcase generation failed");
    throw new Error(`Failed to generate showcase: ${(err as Error).message}`);
  }

  if (format === "html") {
    console.log(chalk.bold.green("\n✅ Opening in browser...\n"));
    openInBrowser(outPath);
  } else {
    const showcaseDir = path.join(cwd, "generated", "showcase");
    try {
      await startViteApp(showcaseDir);
    } catch (err) {
      throw new Error(`Could not start dev server: ${(err as Error).message}`);
    }
  }
}
