import chalk from "chalk";

export const logger = {
  // ─── Info / success ─────────────────────────────────────────────────
  info(message: string): void {
    console.log(chalk.cyan("  ℹ"), message);
  },

  success(message: string): void {
    console.log(chalk.green("  ✔"), message);
  },

  warn(message: string): void {
    console.warn(chalk.yellow("  ⚠"), chalk.yellow(message));
  },

  error(message: string): void {
    console.error(chalk.red("  ✘"), chalk.red(message));
  },

  // ─── Sections ────────────────────────────────────────────────────────
  section(title: string): void {
    console.log("\n" + chalk.bold.white(title));
    console.log(chalk.dim("  " + "─".repeat(50)));
  },

  step(label: string, detail?: string): void {
    const line = chalk.dim("  →") + " " + chalk.white(label);
    console.log(detail ? `${line} ${chalk.dim(detail)}` : line);
  },

  // ─── Validation output ───────────────────────────────────────────────
  pass(label: string): void {
    console.log(chalk.green("  ✔"), chalk.dim(label));
  },

  fail(label: string, detail?: string): void {
    const line = chalk.red("  ✘ ") + label;
    console.log(detail ? `${line}\n    ${chalk.dim(detail)}` : line);
  },

  hint(label: string, suggestion: string): void {
    console.log(chalk.yellow("  ⚠ ") + label);
    console.log(chalk.dim(`    → ${suggestion}`));
  },

  // ─── Layout ──────────────────────────────────────────────────────────
  blank(): void {
    console.log();
  },

  dim(message: string): void {
    console.log(chalk.dim("  " + message));
  },

  // ─── Score display ───────────────────────────────────────────────────
  score(score: number, max: number): void {
    const pct = score / max;
    const color =
      pct >= 0.8 ? chalk.green
      : pct >= 0.5 ? chalk.yellow
      : chalk.red;

    const filled = Math.round(pct * 20);
    const bar = color("█".repeat(filled)) + chalk.dim("░".repeat(20 - filled));

    console.log();
    console.log(
      "  " + bar + "  " + color.bold(`${score}/${max}`) + chalk.dim(" health score"),
    );
    console.log();
  },
};
