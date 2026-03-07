#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import * as readline from "readline";
import { initCommand } from "./commands/init";
import { generateCommand } from "./commands/generate";
import { validateCommand } from "./commands/validate";
import { showcaseCommand } from "./commands/showcase";

export interface MenuOption {
  key: string;
  label: string;
  description: string;
}

export function handleError(err: unknown, command: string): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.red(`\n  ✖ Command "${command}" failed\n`));
  if (message.includes("not found") && message.includes("config")) {
    console.error(
      chalk.yellow("  → Config file is missing. Run dsforge init first.\n"),
    );
  } else if (message.includes("not found") && message.includes("rules")) {
    console.error(
      chalk.yellow(
        "  → design-system.rules.json is missing. Run dsforge init first.\n",
      ),
    );
  } else if (message.includes("Invalid design-system.config.json")) {
    console.error(
      chalk.yellow("  → Your config file has validation errors:\n"),
    );
    console.error(
      chalk.dim(
        `    ${message.replace("Invalid design-system.config.json:\n", "").trim()}\n`,
      ),
    );
  } else if (message.includes("Invalid design-system.rules.json")) {
    console.error(
      chalk.yellow(
        "  → Your design-system.rules.json has validation errors:\n",
      ),
    );
    console.error(
      chalk.dim(
        `    ${message.replace("Invalid design-system.rules.json:\n", "").trim()}\n`,
      ),
    );
  } else if (message.includes("No generated metadata")) {
    console.error(
      chalk.yellow("  → Run dsforge generate first, then try again.\n"),
    );
  } else if (message.includes("ENOENT")) {
    console.error(
      chalk.yellow("  → A required file or directory could not be found.\n"),
    );
    console.error(chalk.dim(`    ${message}\n`));
  } else if (message.includes("EACCES") || message.includes("permission")) {
    console.error(
      chalk.yellow("  → Permission denied. Check file/folder permissions.\n"),
    );
  } else if (message.includes("JSON")) {
    console.error(
      chalk.yellow(
        "  → Could not parse a JSON file. Check for syntax errors.\n",
      ),
    );
    console.error(chalk.dim(`    ${message}\n`));
  } else {
    console.error(chalk.dim(`    ${message}\n`));
  }
  process.exit(1);
}

// ─── Shared prompt ────────────────────────────────────────────────────────────
// One function, two modes — arrow keys when TTY raw mode is available,
// numbered fallback otherwise. Both resolve with a 0-based index.
// showcase calls this too, so there's only ever one readline at a time.

function renderMenu(
  options: MenuOption[],
  selectedIndex: number,
  hint: string,
): void {
  options.forEach((opt, i) => {
    const sel = i === selectedIndex;
    const cursor = sel ? chalk.cyan("❯") : " ";
    const key = sel ? chalk.cyan(`[${opt.key}]`) : chalk.dim(`[${opt.key}]`);
    const label = sel ? chalk.bold.white(opt.label) : chalk.dim(opt.label);
    const desc = sel ? chalk.gray(opt.description) : chalk.dim(opt.description);
    process.stdout.write(`  ${cursor} ${key} ${label.padEnd(12)}  ${desc}\n`);
  });
  process.stdout.write(`\n  ${chalk.dim(hint)}\n\n`);
}

function clearMenu(options: MenuOption[]): void {
  // rows = options.length + blank + hint + blank = length + 3
  process.stdout.write(`\u001B[${options.length + 3}A\u001B[0J`);
}

export async function prompt(
  title: string,
  options: MenuOption[],
): Promise<number> {
  process.stdout.write(chalk.bold(`\n  ${title}\n\n`));

  const canRaw =
    process.stdin.isTTY === true &&
    typeof process.stdin.setRawMode === "function";

  return canRaw ? promptRaw(options) : promptFallback(options);
}

function promptRaw(options: MenuOption[]): Promise<number> {
  let selected = 0;
  const hint = `↑ ↓ to move  ·  ${options.map((o) => o.key).join("/")} shortcuts  ·  enter to confirm  ·  ctrl+c to quit`;
  const rl = readline.createInterface({ input: process.stdin });
  process.stdin.setRawMode!(true);
  process.stdin.resume();
  renderMenu(options, selected, hint);

  return new Promise((resolve) => {
    const onData = (buf: Buffer) => {
      const str = buf.toString();

      if (str === "\u0003") {
        cleanup();
        console.log(chalk.dim("\n  Bye!\n"));
        process.exit(0);
      }

      const num = parseInt(str, 10);
      if (num >= 1 && num <= options.length) selected = num - 1;
      if (str === "\u001B\u005B\u0041")
        selected = (selected - 1 + options.length) % options.length; // ↑
      if (str === "\u001B\u005B\u0042")
        selected = (selected + 1) % options.length; // ↓

      if (str === "\r" || str === "\n" || str === "\u000D") {
        cleanup();
        clearMenu(options);
        resolve(selected);
        return;
      }

      clearMenu(options);
      renderMenu(options, selected, hint);
    };

    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode!(false);
      rl.close();
    };

    process.stdin.on("data", onData);
  });
}

function promptFallback(options: MenuOption[]): Promise<number> {
  options.forEach((opt) => {
    console.log(
      `  ${chalk.cyan(opt.key + ".")} ${chalk.bold(opt.label.padEnd(14))} ${chalk.dim(opt.description)}`,
    );
  });
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const range = `1-${options.length}`;
    const ask = () => {
      rl.question(chalk.bold(`  Enter choice (${range}): `), (answer) => {
        const num = parseInt(answer.trim(), 10);
        if (!options[num - 1]) {
          console.log(
            chalk.yellow(`  ⚠ Invalid — enter a number between ${range}.\n`),
          );
          ask();
          return;
        }
        rl.close();
        resolve(num - 1);
      });
    };
    ask();
  });
}

// ─── Banner & menu ────────────────────────────────────────────────────────────

function printBanner(): void {
  console.log();
  console.log(chalk.bold.blue("  ╔══════════════════════════════════╗"));
  console.log(
    chalk.bold.blue("  ║") +
      chalk.bold.white("  🎨 dsforge  ") +
      chalk.dim("v0.1.0") +
      chalk.bold.blue("                ║"),
  );
  console.log(
    chalk.bold.blue("  ║") +
      chalk.dim("  AI-Native Design System CLI     ") +
      chalk.bold.blue("║"),
  );
  console.log(chalk.bold.blue("  ╚══════════════════════════════════╝"));
  console.log();
}

const MAIN_OPTIONS: MenuOption[] = [
  {
    key: "1",
    label: "init",
    description: "Create config + rules files to get started",
  },
  {
    key: "2",
    label: "generate",
    description: "Generate tokens, components, metadata & docs",
  },
  {
    key: "3",
    label: "validate",
    description: "Run governance validation against design-system.rules.json",
  },
  {
    key: "4",
    label: "showcase",
    description: "Generate a visual showcase app for your design system",
  },
];

const MAIN_ACTIONS = [
  () => initCommand(process.cwd()),
  () => generateCommand(process.cwd()),
  () => validateCommand(process.cwd()),
  () => showcaseCommand(process.cwd()),
];

async function runInteractiveMenu(): Promise<void> {
  printBanner();
  const idx = await prompt("What do you want to do?", MAIN_OPTIONS);
  const chosen = MAIN_OPTIONS[idx];
  console.log(
    chalk.dim(`\n  Running: `) + chalk.cyan(`dsforge ${chosen.label}\n`),
  );
  try {
    await MAIN_ACTIONS[idx]();
  } catch (err) {
    handleError(err, chosen.label);
  }
}

// ─── Commander ────────────────────────────────────────────────────────────────

const program = new Command();
program
  .name("dsforge")
  .description("AI-Native Design System Generator")
  .version("0.1.0")
  .addHelpText(
    "after",
    `
  Examples:
    $ npx dsforge                  # interactive menu
    $ npx dsforge init             # create config files
    $ npx dsforge generate         # generate everything
    $ npx dsforge validate         # check governance rules
    $ npx dsforge showcase         # open HTML showcase in browser
  `,
  );

program
  .command("init")
  .description("Initialize project")
  .action(async () => {
    try {
      await initCommand(process.cwd());
    } catch (err) {
      handleError(err, "init");
    }
  });

program
  .command("generate")
  .description("Generate tokens, components, metadata, docs")
  .action(async () => {
    try {
      await generateCommand(process.cwd());
    } catch (err) {
      handleError(err, "generate");
    }
  });

program
  .command("validate")
  .description("Run governance validation")
  .action(async () => {
    try {
      await validateCommand(process.cwd());
    } catch (err) {
      handleError(err, "validate");
    }
  });

program
  .command("showcase")
  .description("Generate a visual HTML showcase for your design system")
  .action(async () => {
    try {
      await showcaseCommand(process.cwd());
    } catch (err) {
      handleError(err, "showcase");
    }
  });

// ─── Entry point ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.length === 0) {
  runInteractiveMenu().catch((err) => {
    console.error(
      chalk.red(`\n  Unexpected error: ${(err as Error).message}\n`),
    );
    process.exit(1);
  });
} else {
  program.parse(process.argv);
}
