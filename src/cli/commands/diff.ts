/**
 * diff.ts — compare two config versions, report breaking changes.
 *
 * Classifies token changes as:
 *   BREAKING  — token removed or renamed (consumers will break)
 *   CHANGED   — token value modified (visual regression risk)
 *   ADDED     — new token (safe, no impact on existing consumers)
 *
 * Output feeds CHANGELOG.md and can be used as a CI/CD quality gate.
 */

import path from "node:path";
import fs from "fs-extra";
import { logger } from "../../utils/logger";
import { readConfig } from "../../utils/fs";
import { resolveTokens } from "../../core/token-resolver";
import type { DesignSystemConfig } from "../../types/index";

export interface DiffOptions {
  from: string; // path to old config file, or version in dist-ds/
  to?: string; // defaults to current design-system.config.json
}

// ─── Change record ────────────────────────────────────────────────────────────

type ChangeType = "breaking" | "changed" | "added";

interface TokenChange {
  type: ChangeType;
  token: string;
  oldValue?: string;
  newValue?: string;
  affectedComponents?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadConfig(
  configPath: string,
): Promise<DesignSystemConfig | null> {
  try {
    if (!(await fs.pathExists(configPath))) return null;
    const raw = await fs.readJson(configPath);
    return raw as DesignSystemConfig;
  } catch {
    return null;
  }
}

function resolveFlat(config: DesignSystemConfig): Record<string, string> {
  try {
    return resolveTokens(config).tokens;
  } catch {
    // Return empty if resolution fails (e.g. old config with broken refs)
    return {};
  }
}

function findComponentsUsingToken(
  tokenPath: string,
  config: DesignSystemConfig,
): string[] {
  const components: string[] = [];
  const component = config.tokens?.component ?? {};
  for (const [key, value] of Object.entries(component)) {
    if (String(value).includes(tokenPath.replace(/^(global|semantic)\./, ""))) {
      components.push(key);
    }
  }
  return components;
}

// ─── Diff engine ──────────────────────────────────────────────────────────────

function diffConfigs(
  oldConfig: DesignSystemConfig,
  newConfig: DesignSystemConfig,
): TokenChange[] {
  const oldTokens = resolveFlat(oldConfig);
  const newTokens = resolveFlat(newConfig);

  const changes: TokenChange[] = [];

  // Check for removed or changed tokens
  for (const [token, oldValue] of Object.entries(oldTokens)) {
    if (!(token in newTokens)) {
      // Removed — BREAKING
      changes.push({
        type: "breaking",
        token,
        oldValue,
        affectedComponents: findComponentsUsingToken(token, oldConfig),
      });
    } else if (newTokens[token] !== oldValue) {
      // Value changed
      changes.push({
        type: "changed",
        token,
        oldValue,
        ...(newTokens[token] !== undefined
          ? { newValue: newTokens[token] }
          : {}),
        affectedComponents: findComponentsUsingToken(token, newConfig),
      });
    }
  }

  // Check for added tokens
  for (const [token, newValue] of Object.entries(newTokens)) {
    if (!(token in oldTokens)) {
      changes.push({ type: "added", token, newValue });
    }
  }

  // Also diff theme overrides
  const oldThemes = oldConfig.themes ?? {};
  const newThemes = newConfig.themes ?? {};

  for (const themeName of new Set([
    ...Object.keys(oldThemes),
    ...Object.keys(newThemes),
  ])) {
    const oldTheme = oldThemes[themeName] ?? {};
    const newTheme = newThemes[themeName] ?? {};

    for (const [key, oldVal] of Object.entries(oldTheme)) {
      const newVal = newTheme[key];
      if (newVal === undefined) {
        changes.push({
          type: "breaking",
          token: `themes.${themeName}.${key}`,
          oldValue: String(oldVal),
        });
      } else if (String(newVal) !== String(oldVal)) {
        changes.push({
          type: "changed",
          token: `themes.${themeName}.${key}`,
          oldValue: String(oldVal),
          newValue: String(newVal),
        });
      }
    }

    for (const key of Object.keys(newTheme)) {
      if (!(key in oldTheme)) {
        changes.push({
          type: "added",
          token: `themes.${themeName}.${key}`,
          newValue: String(newTheme[key]),
        });
      }
    }
  }

  return changes;
}

// ─── Report printer ───────────────────────────────────────────────────────────

function printReport(changes: TokenChange[]): void {
  const breaking = changes.filter((c) => c.type === "breaking");
  const changed = changes.filter((c) => c.type === "changed");
  const added = changes.filter((c) => c.type === "added");

  if (changes.length === 0) {
    logger.success("No token changes detected.");
    return;
  }

  if (breaking.length > 0) {
    logger.section(
      `BREAKING (${breaking.length}) — consumers will need to update`,
    );
    for (const c of breaking) {
      logger.fail(c.token, `removed (was: ${c.oldValue})`);
      if (c.affectedComponents && c.affectedComponents.length > 0) {
        logger.dim(`   Affects: ${c.affectedComponents.join(", ")}`);
      }
    }
  }

  if (changed.length > 0) {
    logger.section(`CHANGED (${changed.length}) — visual regression risk`);
    for (const c of changed) {
      logger.hint(c.token, `${c.oldValue} → ${c.newValue}`);
      if (c.affectedComponents && c.affectedComponents.length > 0) {
        logger.dim(`   Affects: ${c.affectedComponents.join(", ")}`);
      }
    }
  }

  if (added.length > 0) {
    logger.section(`ADDED (${added.length}) — safe, no consumer impact`);
    for (const c of added) {
      logger.pass(`${c.token}  (${c.newValue})`);
    }
  }

  logger.blank();

  if (breaking.length > 0) {
    logger.warn(
      `${breaking.length} breaking change(s) — bump the major version and add migration notes to CHANGELOG.md`,
    );
  } else if (changed.length > 0) {
    logger.warn(
      `${changed.length} visual change(s) — consider bumping the minor version`,
    );
  } else {
    logger.success("Only additive changes — safe to publish as a patch.");
  }
}

// ─── Changelog suggestion ─────────────────────────────────────────────────────

function generateChangelogEntry(
  changes: TokenChange[],
  fromVersion: string,
  toVersion: string,
): string {
  const date = new Date().toISOString().slice(0, 10);
  const breaking = changes.filter((c) => c.type === "breaking");
  const changed = changes.filter((c) => c.type === "changed");
  const added = changes.filter((c) => c.type === "added");

  const lines: string[] = [`## [${toVersion}] — ${date}`, ""];

  if (breaking.length > 0) {
    lines.push("### BREAKING CHANGES", "");
    for (const c of breaking) {
      lines.push(`- \`${c.token}\` removed (was \`${c.oldValue}\`)`);
      if (c.affectedComponents?.length) {
        lines.push(`  - Migration: update ${c.affectedComponents.join(", ")}`);
      }
    }
    lines.push("");
  }

  if (changed.length > 0) {
    lines.push("### Changed", "");
    for (const c of changed) {
      lines.push(`- \`${c.token}\`: \`${c.oldValue}\` → \`${c.newValue}\``);
    }
    lines.push("");
  }

  if (added.length > 0) {
    lines.push("### Added", "");
    for (const c of added) {
      lines.push(`- \`${c.token}\` (\`${c.newValue}\`)`);
    }
    lines.push("");
  }

  lines.push(`_Compared: v${fromVersion} → v${toVersion}_`, "");
  return lines.join("\n");
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function runDiff(
  cwd: string,
  options: DiffOptions,
): Promise<void> {
  logger.blank();
  logger.section("dsforge diff");

  // ── Resolve "to" config ──
  const toPath = options.to
    ? path.resolve(cwd, options.to)
    : path.join(cwd, "design-system.config.json");

  let toConfig: DesignSystemConfig | null = null;
  try {
    toConfig = await readConfig(path.dirname(toPath));
  } catch {
    logger.error(`Could not load "to" config from: ${toPath}`);
    process.exit(1);
    return;
  }

  // ── Resolve "from" config ──
  // Try: as a file path first, then as a dist-ds/dist-ds-<version>/config
  let fromConfig: DesignSystemConfig | null = null;
  const fromAsPath = path.resolve(cwd, options.from);

  if (await fs.pathExists(fromAsPath)) {
    fromConfig = await loadConfig(fromAsPath);
  }

  if (!fromConfig) {
    // Try looking in a dist-ds backup or a versioned folder
    const versionedPath = path.join(
      cwd,
      ".dsforge-history",
      `${options.from}.config.json`,
    );
    fromConfig = await loadConfig(versionedPath);
  }

  if (!fromConfig) {
    logger.error(`Could not load "from" config: ${options.from}`);
    logger.dim(`Supported formats:`);
    logger.dim(`  Path: dsforge diff --from ./old-config.json`);
    logger.dim(
      `  Version: dsforge diff --from 0.1.0  (requires .dsforge-history/0.1.0.config.json)`,
    );
    logger.blank();
    logger.dim(`Tip: save config snapshots with:`);
    logger.dim(
      `  cp design-system.config.json .dsforge-history/$(node -p "require('./design-system.config.json').meta.version").config.json`,
    );
    process.exit(1);
    return;
  }

  const fromVersion = fromConfig.meta?.version ?? options.from;
  const toVersion = toConfig!.meta?.version ?? "current";

  logger.step("Comparing", `v${fromVersion} → v${toVersion}`);
  logger.blank();

  const changes = diffConfigs(fromConfig, toConfig!);
  printReport(changes);

  // ── Emit changelog suggestion ──
  if (changes.length > 0) {
    logger.blank();
    logger.section("Suggested CHANGELOG entry");
    console.log(generateChangelogEntry(changes, fromVersion, toVersion));
  }
}
