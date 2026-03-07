import * as fs from "fs-extra";
import * as path from "path";
import chalk from "chalk";

const DEFAULT_CONFIG = {
  typography: {
    fontFamily: "Inter",
    scale: [12, 14, 16, 20, 24, 32],
    fontWeights: [400, 500, 600],
  },
  spacing: { baseUnit: 4 },
  radius: { scale: [2, 4, 8, 16] },
  color: {
    primary: "#2563eb",
    secondary: "#64748b",
    danger: "#dc2626",
    background: "#ffffff",
    text: "#111827",
  },
  philosophy: {
    density: "comfortable",
    elevation: "minimal",
  },
};

const DEFAULT_RULES = {
  button: {
    allowedVariants: ["primary", "secondary", "danger"],
    maxWidth: "300px",
    colorPalette: ["primary", "secondary", "danger"],
    requiredAccessibility: ["aria-label", "keyboard-support"],
  },
  card: {
    maxWidth: "600px",
    borderRadius: ["2px", "4px", "8px"],
    allowedShadows: ["none", "small", "medium"],
  },
  input: {
    allowedTypes: ["text", "email", "password", "number", "tel", "url"],
    requiredAccessibility: ["aria-label", "keyboard-support"],
  },
};

export async function initCommand(cwd: string): Promise<void> {
  console.log(chalk.bold.blue("\n🎨 dsforge init\n"));

  const configPath = path.join(cwd, "design-system.config.json");
  const rulesPath = path.join(cwd, "design-system.rules.json");

  let wroteConfig = false;
  let wroteRules = false;

  if (await fs.pathExists(configPath)) {
    console.log(
      chalk.yellow(`  ⚠ design-system.config.json already exists — skipping`),
    );
  } else {
    await fs.writeJson(configPath, DEFAULT_CONFIG, { spaces: 2 });
    console.log(chalk.green(`  ✔ Created design-system.config.json`));
    wroteConfig = true;
  }

  if (await fs.pathExists(rulesPath)) {
    console.log(
      chalk.yellow(`  ⚠ design-system.rules.json already exists — skipping`),
    );
  } else {
    await fs.writeJson(rulesPath, DEFAULT_RULES, { spaces: 2 });
    console.log(chalk.green(`  ✔ Created design-system.rules.json`));
    wroteRules = true;
  }

  if (wroteConfig || wroteRules) {
    console.log(chalk.bold("\n  Next steps:"));
    console.log(
      chalk.dim("  1. Edit design-system.config.json with your brand tokens"),
    );
    console.log(
      chalk.dim("  2. Edit design-system.rules.json to set governance rules"),
    );
    console.log(chalk.dim("  3. Run: ") + chalk.cyan("npx dsforge generate"));
  } else {
    console.log(chalk.bold("\n  Run: ") + chalk.cyan("npx dsforge generate"));
  }

  console.log();
}
