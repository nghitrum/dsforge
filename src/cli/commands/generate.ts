/**
 * generate.ts — full generation pipeline
 *
 * Pipeline order:
 *   1. Read + validate config and rules
 *   2. Resolve all tokens
 *   3. Emit CSS custom property files (base.css + one per theme)
 *   4. Emit JS/TS token constants + Tailwind config  [via adapter]
 *   5. Generate React components (Button, Input, Card, ThemeProvider) [via adapter]
 *   6. Generate AI-consumable metadata JSON           [Pro only]
 *   7. Emit package.json, tsconfig, README, CHANGELOG [via adapter]
 *   8. Generate showcase.html
 */

import path from "node:path";
import {
  readConfig,
  readRules,
  ensureDir,
  writeFile,
  CONFIG_FILENAME,
} from "../../utils/fs";
import { resolveTokens } from "../../core/token-resolver";
import { logger } from "../../utils/logger";
import { validateConfig } from "./validate";
import { generateCssFiles, emitDensityCss } from "../../generators/tokens/css-vars";
import {
  generateTsConfig,
  generateChangelog,
} from "../../generators/package/emitter";
import { reactAdapter, REACT_COMPONENTS } from "../../adapters/react/index";
import { isProUnlocked } from "../../lib/license";
import { applyPreset } from "../../presets/index";
import type { DesignSystemConfig, RulesConfig } from "../../types/index";

export interface GenerateOptions {
  watch?: boolean;
  only?: string;
  debug?: boolean;
}

function fatal(
  message: string,
  hint: string,
  err: unknown,
  debug: boolean,
): never {
  logger.error(`[dsforge] ${message} — ${hint}`);
  if (debug && err instanceof Error && err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
}

// ─── Output directory layout ─────────────────────────────────────────────────
//
//  <cwd>/
//  └── dist-ds/
//      ├── package.json
//      ├── tsconfig.json
//      ├── README.md
//      ├── CHANGELOG.md
//      ├── showcase.html
//      ├── src/
//      │   ├── index.ts
//      │   ├── Button.tsx
//      │   ├── Input.tsx
//      │   ├── Card.tsx
//      │   └── ThemeProvider.tsx
//      ├── tokens/
//      │   ├── base.css  ├── light.css  ├── dark.css
//      │   ├── tokens.js └── tailwind.js
//      └── metadata/   (Pro only)

const OUT_DIR = "dist-ds";

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function runGenerate(
  cwd: string,
  options: GenerateOptions,
): Promise<void> {
  logger.blank();
  logger.section("dsforge generate");

  // ── 1. Read config ──
  let config: DesignSystemConfig;
  let rules: RulesConfig;

  try {
    config = await readConfig(cwd);
    rules = await readRules(cwd);
  } catch (err) {
    fatal(
      "Could not read config",
      `Check that ${CONFIG_FILENAME} exists and is valid JSON — run "dsforge init" to create one`,
      err,
      options.debug ?? false,
    );
  }

  // If config.meta.preset is set, re-apply the preset's spacing/radius values
  // so that editing the preset field in the config JSON takes effect on the
  // next generate run — no need to re-run init.
  const presetValue = config!.meta.preset;
  if (presetValue === "compact" || presetValue === "comfortable" || presetValue === "spacious") {
    applyPreset(config!, presetValue);
  }

  // Ensure all known components have metadata and docs generated, even when
  // they are absent from design-system.rules.json.
  const fullRules: RulesConfig = Object.fromEntries(
    REACT_COMPONENTS.map((name) => [name, rules![name] ?? {}]),
  );

  // ── 2. Pre-flight validate ──
  logger.step("Running pre-flight validation...");
  const validation = validateConfig(config!, rules!);
  const errors = validation.issues.filter((i) => i.severity === "error");

  if (errors.length > 0) {
    logger.blank();
    logger.error(
      `Config has ${errors.length} error(s) — fix them before generating`,
    );
    logger.dim(`Run "dsforge validate" for the full report.`);
    logger.blank();
    for (const e of errors.slice(0, 3)) {
      logger.fail(`[${e.code}] ${e.message}`);
      if (e.suggestion) logger.dim(`   → ${e.suggestion}`);
    }
    if (errors.length > 3) logger.dim(`   ...and ${errors.length - 3} more`);
    logger.blank();
    process.exit(1);
  }

  if (validation.score < validation.maxScore) {
    logger.hint(
      `Config health: ${validation.score}/${validation.maxScore}`,
      `Run "dsforge validate" to improve your score.`,
    );
  }

  // ── 3. Resolve tokens ──
  logger.step("Resolving tokens...");
  let resolution: ReturnType<typeof resolveTokens>;
  try {
    resolution = resolveTokens(config!);
  } catch (err) {
    fatal(
      "Token resolution failed",
      "Check your config for circular references or missing token values",
      err,
      options.debug ?? false,
    );
  }

  for (const w of resolution.warnings) {
    logger.warn(w.message);
  }

  const tokenCount = Object.keys(resolution.tokens).length;
  logger.success(`${tokenCount} tokens resolved`);

  const outRoot = path.join(cwd, OUT_DIR);
  await ensureDir(outRoot);

  const only = options.only;

  // ── 4. Tokens ──
  if (!only || only === "tokens") {
    logger.step("Emitting token files...");
    const tokensDir = path.join(outRoot, "tokens");
    await ensureDir(tokensDir);

    // CSS custom properties — framework-agnostic
    const cssFiles = generateCssFiles(config, resolution);
    for (const { filename, content } of cssFiles) {
      await writeFile(path.join(tokensDir, filename), content);
      logger.dim(`  → tokens/${filename}`);
    }

    // density.css — Pro only: all three presets as [data-density] selectors
    if (isProUnlocked()) {
      await writeFile(
        path.join(tokensDir, "density.css"),
        emitDensityCss(config),
      );
      logger.dim(`  → tokens/density.css`);
    }

    // JS/Tailwind — adapter-owned
    const tokenFiles = reactAdapter.generateTokenFiles(config, resolution);
    for (const { filename, content } of tokenFiles) {
      await writeFile(path.join(tokensDir, filename), content);
      logger.dim(`  → tokens/${filename}`);
    }

    logger.success(`Token files written`);
  }

  // ── 5. Components ──
  if (!only || only === "components") {
    logger.step("Generating React components...");
    const componentsDir = path.join(outRoot, "components");
    await ensureDir(componentsDir);

    const generatedNames: string[] = [];
    const generatedComponentJsons: import("../../adapters/react/componentSchemas").ComponentJson[] = [];

    // Build CSS vars for component JSON (light + dark theme resolved values)
    const flatTokens: Record<string, string> = {};
    for (const [k, v] of Object.entries(resolution.tokens)) {
      flatTokens[`--${k.replace(/^(global|semantic|component)\./, "")}`] = v;
    }
    const lightOverrides = config.themes?.["light"] ?? {};
    const darkOverrides = config.themes?.["dark"] ?? {};
    const lightCssVars: Record<string, string> = {
      ...flatTokens,
      ...Object.fromEntries(Object.entries(lightOverrides).map(([k, v]) => [`--${k}`, String(v)])),
    };
    const darkCssVars: Record<string, string> = {
      ...flatTokens,
      ...Object.fromEntries(Object.entries(darkOverrides).map(([k, v]) => [`--${k}`, String(v)])),
    };
    const resolvedCssVars = { light: lightCssVars, dark: darkCssVars };

    const { generateComponentJson } = await import("../../adapters/react/generateComponentJson");
    const { generateComponentMetadata } = await import("../../adapters/react/generateComponentMetadata");

    for (const componentName of REACT_COMPONENTS) {
      const pascalName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
      try {
        const { filename, content } = reactAdapter.generateComponent(
          componentName,
          config,
          rules[componentName],
        );
        const componentSubDir = path.join(componentsDir, pascalName);
        await ensureDir(componentSubDir);
        await writeFile(path.join(componentSubDir, filename), content);
        logger.dim(`  → components/${pascalName}/${filename}`);
        generatedNames.push(pascalName);

        // Write Component.json (free tier)
        const componentJson = generateComponentJson(pascalName, resolvedCssVars);
        generatedComponentJsons.push(componentJson);
        await writeFile(
          path.join(componentSubDir, `${pascalName}.json`),
          JSON.stringify(componentJson, null, 2),
        );
        logger.dim(`  → components/${pascalName}/${pascalName}.json`);

        // Write Component.metadata.json (Pro only)
        if (isProUnlocked()) {
          const metadata = generateComponentMetadata(pascalName);
          await writeFile(
            path.join(componentSubDir, `${pascalName}.metadata.json`),
            JSON.stringify(metadata, null, 2),
          );
          logger.dim(`  → components/${pascalName}/${pascalName}.metadata.json`);
        }
      } catch (err) {
        logger.warn(
          `[dsforge] Could not generate ${componentName} — ${(err as Error).message}`,
        );
      }
    }

    // ThemeProvider — colocated in components/ThemeProvider/
    const { filename: tpFile, content: tpContent } =
      reactAdapter.generateThemeProvider(config);
    const tpDir = path.join(componentsDir, "ThemeProvider");
    await ensureDir(tpDir);
    await writeFile(path.join(tpDir, tpFile), tpContent);
    logger.dim(`  → components/ThemeProvider/${tpFile}`);

    // Write ThemeProvider.json (free tier)
    try {
      const tpJson = generateComponentJson("ThemeProvider", resolvedCssVars);
      generatedComponentJsons.push(tpJson);
      await writeFile(
        path.join(tpDir, "ThemeProvider.json"),
        JSON.stringify(tpJson, null, 2),
      );
      logger.dim(`  → components/ThemeProvider/ThemeProvider.json`);
      if (isProUnlocked()) {
        const tpMeta = generateComponentMetadata("ThemeProvider");
        await writeFile(
          path.join(tpDir, "ThemeProvider.metadata.json"),
          JSON.stringify(tpMeta, null, 2),
        );
        logger.dim(`  → components/ThemeProvider/ThemeProvider.metadata.json`);
      }
    } catch {
      // ThemeProvider definition may not exist — skip silently
    }

    // Barrel index at the package root
    const { filename: idxFile, content: idxContent } =
      reactAdapter.generateComponentIndex(config, generatedNames);
    await writeFile(path.join(outRoot, idxFile), idxContent);
    logger.dim(`  → ${idxFile}`);

    logger.success(`${generatedNames.length} components generated`);

    // Store for use in Pro outputs below
    (globalThis as Record<string, unknown>)["__dsforgGeneratedJsons"] = generatedComponentJsons;
  }

  // ── 8. Package files ──
  if (!only) {
    logger.step("Writing package files...");

    const componentNames = Object.keys(fullRules);

    const { filename: pkgFile, content: pkgContent } =
      reactAdapter.generatePackageManifest(config, componentNames);
    await writeFile(path.join(outRoot, pkgFile), pkgContent);
    logger.dim(`  → ${pkgFile}`);

    const tsConfig = generateTsConfig();
    await writeFile(path.join(outRoot, "tsconfig.json"), tsConfig);
    logger.dim(`  → tsconfig.json`);

    // README is framework-specific content — delegated to the adapter via
    // generatePackageManifest; a separate README call isn't in the interface.
    // Keep the pre-existing direct call for now until a generateReadme method
    // is added to the interface in a future task.
    const { generateReadme } = await import("../../generators/package/emitter");
    await writeFile(
      path.join(outRoot, "README.md"),
      generateReadme(config, componentNames),
    );
    logger.dim(`  → README.md`);

    // Only seed CHANGELOG if it doesn't already exist
    const changelogPath = path.join(outRoot, "CHANGELOG.md");
    const fsExtra = await import("fs-extra");
    const fsE = fsExtra.default ?? fsExtra;
    if (!(await fsE.pathExists(changelogPath))) {
      await writeFile(changelogPath, generateChangelog(config));
      logger.dim(`  → CHANGELOG.md (seeded)`);
    }

    logger.success(`Package files written`);
  }

  // ── 6. Pro outputs (registry.json, ai/) ──
  if (isProUnlocked() && (!only || only === "components")) {
    logger.step("Writing Pro outputs...");

    const generatedJsons = (
      (globalThis as Record<string, unknown>)["__dsforgGeneratedJsons"] ?? []
    ) as import("../../adapters/react/componentSchemas").ComponentJson[];

    const { generateRegistry } = await import("../../adapters/react/generateRegistry");
    const {
      generateSystemPrompt,
      generateComponentsJson,
      generateCursorContext,
      generateCopilotInstructions,
    } = await import("../../adapters/react/generateAiFolder");

    const systemName = config.meta.name;
    const version = config.meta.version;

    // registry.json
    const registry = generateRegistry(systemName, version, generatedJsons);
    await writeFile(path.join(outRoot, "registry.json"), JSON.stringify(registry, null, 2));
    logger.dim(`  → registry.json`);

    // Collect metadata for AI outputs (Pro: definitions always available)
    const { COMPONENT_METADATA_DEFINITIONS } = await import("../../adapters/react/componentDefinitions");
    const metadataList = generatedJsons
      .map((c) => COMPONENT_METADATA_DEFINITIONS[c.name])
      .filter((m): m is import("../../adapters/react/componentSchemas").ComponentMetadataJson => Boolean(m));

    // Build flat token map for system prompt
    const flatTokensForAi: Record<string, { light: string; dark: string }> = {};
    for (const [k, v] of Object.entries(resolution.tokens)) {
      const cssVar = `--${k.replace(/^(global|semantic|component)\./, "")}`;
      flatTokensForAi[cssVar] = {
        light: (config.themes?.["light"] as Record<string, string> | undefined)?.[cssVar.slice(2)] ?? v,
        dark: (config.themes?.["dark"] as Record<string, string> | undefined)?.[cssVar.slice(2)] ?? v,
      };
    }

    const aiDir = path.join(outRoot, "ai");
    await ensureDir(aiDir);
    const cursorDir = path.join(aiDir, ".cursor");
    await ensureDir(cursorDir);

    const componentNames = generatedJsons.map((c) => c.name);

    await writeFile(
      path.join(aiDir, "system-prompt.md"),
      generateSystemPrompt(systemName, flatTokensForAi, componentNames),
    );
    logger.dim(`  → ai/system-prompt.md`);

    await writeFile(
      path.join(aiDir, "components.json"),
      generateComponentsJson(systemName, generatedJsons, metadataList),
    );
    logger.dim(`  → ai/components.json`);

    await writeFile(
      path.join(cursorDir, "context.md"),
      generateCursorContext(systemName),
    );
    logger.dim(`  → ai/.cursor/context.md`);

    await writeFile(
      path.join(outRoot, "copilot-instructions.md"),
      generateCopilotInstructions(systemName),
    );
    logger.dim(`  → copilot-instructions.md`);

    logger.success(`Pro outputs written`);
  }

  // ── 9. Showcase ──
  logger.step("Generating showcase...");
  const { generateShowcase } = await import("../../generators/showcase/html");
  const showcaseHtml = generateShowcase(config!, resolution);
  await writeFile(path.join(outRoot, "showcase.html"), showcaseHtml);
  logger.dim(`  → showcase.html`);

  const fsExtraShowcase = await import("fs-extra");
  const fsE = fsExtraShowcase.default ?? fsExtraShowcase;
  const faviconSrc = path.join(cwd, "assets", "favicon.svg");
  const faviconDest = path.join(outRoot, "assets", "favicon.svg");
  if (await fsE.pathExists(faviconSrc)) {
    await fsE.ensureDir(path.dirname(faviconDest));
    await fsE.copy(faviconSrc, faviconDest, { overwrite: true });
  }
  logger.success("Showcase generated");

  // ── Summary ──
  logger.blank();
  logger.section("Output");
  logger.success(`Generated to: ./${OUT_DIR}/`);
  logger.blank();
  logger.dim("Next steps:");
  logger.dim(`  1. cd ${OUT_DIR}`);
  logger.dim(`  2. npm install && npm run build`);
  logger.dim(`  3. npm publish --access public`);
  logger.dim(
    `  4. Consumers: npm install ${config.meta.npmScope ?? "@myorg"}/${config.meta.name}`,
  );
  logger.blank();
}
