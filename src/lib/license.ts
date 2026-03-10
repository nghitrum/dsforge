/**
 * License key check.
 *
 * Resolution order:
 *   1. DSFORGE_KEY environment variable
 *   2. DSFORGE_KEY entry in .env file at process.cwd()
 *
 * No network call or real key validation at this stage.
 * Setting DSFORGE_KEY to any non-empty string unlocks Pro features.
 *
 * TODO: Replace with full auth integration when Pro billing is ready.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

function readKeyFromDotEnv(): string | undefined {
  try {
    const content = readFileSync(join(process.cwd(), ".env"), "utf8");
    for (const raw of content.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      if (key !== "DSFORGE_KEY") continue;
      // Strip optional surrounding quotes
      const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      return val || undefined;
    }
  } catch {
    // .env not present — that's fine
  }
  return undefined;
}

export function isProUnlocked(): boolean {
  const key = process.env["DSFORGE_KEY"] ?? readKeyFromDotEnv();
  return typeof key === "string" && key.length > 0;
}
