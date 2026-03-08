#!/usr/bin/env node
import { program } from "commander";
import chalk from "chalk";
import { runInit } from "./commands/init";
import { runGenerate } from "./commands/generate";
import { runValidate } from "./commands/validate";
import { runDiff } from "./commands/diff";
import { runMenu } from "./menu";
import { runShowcase } from "./commands/showcase";

program
  .name("dsforge")
  .description(chalk.bold("dsforge") + " — AI-native design system generator")
  .version("0.1.0");

program
  .command("init")
  .description(
    "Scaffold design-system.config.json and design-system.rules.json",
  )
  .option("-n, --name <n>", "Package name")
  .option(
    "-p, --preset <preset>",
    "compact | comfortable | spacious",
    "comfortable",
  )
  .option("--force", "Overwrite existing config files", false)
  .action(
    async (options: { name?: string; preset?: string; force?: boolean }) => {
      await runInit(process.cwd(), options);
      process.exit(0);
    },
  );

program
  .command("generate")
  .description("Generate tokens, components, metadata and docs")
  .option("-w, --watch", "Re-generate on config changes", false)
  .option("--only <target>", "tokens | components | metadata | docs")
  .action(async (options: { watch?: boolean; only?: string }) => {
    await runGenerate(process.cwd(), options);
    process.exit(0);
  });

program
  .command("validate")
  .description("Run config health checks and governance rules")
  .action(async () => {
    await runValidate(process.cwd(), {});
    process.exit(0);
  });

program
  .command("showcase")
  .description("Generate a static docs/showcase and open in browser")
  .action(async () => {
    await runShowcase(process.cwd());
    process.exit(0);
  });

program
  .command("diff")
  .description("Compare two config versions and report breaking changes")
  .requiredOption("--from <version>", "Old config path or semver")
  .option("--to <version>", "New config path (defaults to current)")
  .action(async (options: { from: string; to?: string }) => {
    await runDiff(process.cwd(), options);
    process.exit(0);
  });

program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
});

program.exitOverride((err) => {
  if (
    err.code !== "commander.helpDisplayed" &&
    err.code !== "commander.version"
  ) {
    console.error(chalk.red(`\n  Error: ${err.message}\n`));
  }
  process.exit(err.exitCode);
});

const hasSubcommand = process.argv.slice(2).some((arg) => !arg.startsWith("-"));

if (hasSubcommand) {
  program.parse(process.argv);
} else {
  runMenu();
}
