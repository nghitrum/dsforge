/**
 * Shared readline + prompt helpers.
 * No imports from our own code — keeps this free of circular deps.
 */

import readline from "node:readline";
import chalk from "chalk";

export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export function ask(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

export async function confirm(question: string): Promise<boolean> {
  const answer = await ask(
    "\n  " + chalk.yellow("?") + " " + question + " " + chalk.dim("(y/N) "),
  );
  return answer.trim().toLowerCase() === "y";
}
