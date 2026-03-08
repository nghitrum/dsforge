/**
 * Interactive menu loop.
 * Imports prompt from prompt.ts — no circular deps.
 */

import chalk from "chalk";
import { ask, rl } from "./prompt";
import { runInit } from "./commands/init";
import { runGenerate } from "./commands/generate";
import { runValidate } from "./commands/validate";
import { runDiff } from "./commands/diff";
import { runShowcase } from "./commands/showcase";

const ITEMS = [
  {
    key: "1",
    label: "init",
    desc: "Scaffold config and rules files",
    color: chalk.cyan,
  },
  {
    key: "2",
    label: "generate",
    desc: "Generate tokens, components, metadata and docs",
    color: chalk.green,
  },
  {
    key: "3",
    label: "validate",
    desc: "Run config health checks and governance rules",
    color: chalk.yellow,
  },
  {
    key: "4",
    label: "diff",
    desc: "Compare two config versions",
    color: chalk.magenta,
  },
  {
    key: "5",
    label: "showcase",
    desc: "Generate docs and open in browser",
    color: chalk.blue,
  },
];

function printMenu(): void {
  console.log();
  console.log(
    "  " +
      chalk.bold.white("dsforge") +
      chalk.dim(" — AI-native design system generator"),
  );
  console.log("  " + chalk.dim("─".repeat(50)));
  console.log();
  for (const item of ITEMS) {
    console.log(
      "  " +
        item.color.bold(`${item.key}.`) +
        "  " +
        chalk.white(item.label.padEnd(12)) +
        chalk.dim(item.desc),
    );
  }
  console.log();
  console.log("  " + chalk.dim("Enter a number or name.  q = quit."));
  console.log();
}

export async function runMenu(): Promise<void> {
  const cwd = process.cwd();

  while (true) {
    printMenu();

    const input = (await ask("  " + chalk.bold("> "))).trim().toLowerCase();

    if (input === "q" || input === "quit") {
      console.log(chalk.dim("\n  Bye.\n"));
      rl.close();
      process.exit(0);
    }

    const item =
      ITEMS.find((m) => m.key === input) ??
      ITEMS.find((m) => m.label === input);

    if (!item) {
      console.log(chalk.red(`\n  Unknown: "${input}"\n`));
      continue;
    }

    console.log();

    try {
      switch (item.label) {
        case "init":
          await runInit(cwd, { preset: "comfortable" });
          break;
        case "generate":
          await runGenerate(cwd, {});
          break;
        case "validate":
          await runValidate(cwd, {});
          break;
        case "showcase":
          await runShowcase(cwd);
          break;
        case "diff": {
          const from = (
            await ask("  " + chalk.dim("Diff from (path or version): "))
          ).trim();
          if (!from) {
            console.log(chalk.red("\n  Cancelled.\n"));
            break;
          }
          await runDiff(cwd, { from });
          break;
        }
      }
    } catch (err) {
      console.log(chalk.red(`\n  Error: ${(err as Error).message}\n`));
    }
  }
}
