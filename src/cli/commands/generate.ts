/**
 * generate.ts — full generation pipeline
 *
 * Pipeline order:
 *   1. Read + validate config and rules
 *   2. Resolve all tokens
 *   3. Emit CSS custom property files (base.css + one per theme)
 *   4. Emit JS/TS token constants + Tailwind config  [via adapter]
 *   5. Generate React components (Button, Input, Card, ThemeProvider) [via adapter]
 *   6. Generate AI-consumable metadata JSON
 *   7. Generate MDX documentation                    [via adapter]
 *   8. Emit package.json, tsconfig, README, CHANGELOG [via adapter]
 *   9. Generate showcase.html
 */

import path from "node:path";
import { readConfig, readRules, ensureDir, writeFile } from "../../utils/fs";
import { resolveTokens } from "../../core/token-resolver";
import { logger } from "../../utils/logger";
import { validateConfig } from "./validate";
import { generateCssFiles } from "../../generators/tokens/css-vars";
import { generateMetadata } from "../../generators/metadata/generator";
import {
  generateTsConfig,
  generateChangelog,
} from "../../generators/package/emitter";
import { reactAdapter, REACT_COMPONENTS } from "../../adapters/react/index";
import type { DesignSystemConfig, RulesConfig } from "../../types/index";

export interface GenerateOptions {
  watch?: boolean;
  only?: string;
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
//      ├── metadata/
//      └── docs/

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
    logger.error((err as Error).message);
    process.exit(1);
    return;
  }

  // ── 2. Pre-flight validate ──
  logger.step("Running pre-flight validation...");
  const validation = validateConfig(config!, rules!);
  const errors = validation.issues.filter((i) => i.severity === "error");

  if (errors.length > 0) {
    logger.blank();
    logger.error(
      `Config has ${errors.length} error(s). Fix them before generating.`,
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
  const resolution = resolveTokens(config);

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
    const srcDir = path.join(outRoot, "src");
    await ensureDir(srcDir);

    const generatedNames: string[] = [];

    for (const componentName of REACT_COMPONENTS) {
      try {
        const { filename, content } = reactAdapter.generateComponent(
          componentName,
          config,
          rules[componentName],
        );
        await writeFile(path.join(srcDir, filename), content);
        logger.dim(`  → src/${filename}`);
        generatedNames.push(
          componentName.charAt(0).toUpperCase() + componentName.slice(1),
        );
      } catch (err) {
        logger.warn(
          `Could not generate ${componentName}: ${(err as Error).message}`,
        );
      }
    }

    // ThemeProvider
    const { filename: tpFile, content: tpContent } =
      reactAdapter.generateThemeProvider(config);
    await writeFile(path.join(srcDir, tpFile), tpContent);
    logger.dim(`  → src/${tpFile}`);

    // Barrel index
    const { filename: idxFile, content: idxContent } =
      reactAdapter.generateComponentIndex(config, generatedNames);
    await writeFile(path.join(srcDir, idxFile), idxContent);
    logger.dim(`  → src/${idxFile}`);

    logger.success(`${generatedNames.length} components generated`);
  }

  // ── 6. Metadata ──
  if (!only || only === "metadata") {
    logger.step("Writing AI metadata...");
    const metaDir = path.join(outRoot, "metadata");
    await ensureDir(metaDir);

    const metaFiles = generateMetadata(config, rules, tokenCount);
    for (const { filename, content } of metaFiles) {
      await writeFile(path.join(metaDir, filename), content);
      logger.dim(`  → metadata/${filename}`);
    }

    logger.success(`Metadata written (${metaFiles.length} files)`);
  }

  // ── 7. Docs ──
  if (!only || only === "docs") {
    logger.step("Generating docs...");
    const docsDir = path.join(outRoot, "docs");
    await ensureDir(docsDir);

    const metadataFiles = generateMetadata(config, rules, tokenCount);
    const metadataMap: Record<
      string,
      import("../../generators/metadata/generator").ComponentMetadata
    > = {};
    for (const { filename, content } of metadataFiles) {
      const name = filename.replace(".json", "");
      if (name !== "index") {
        metadataMap[name] = JSON.parse(
          content,
        ) as import("../../generators/metadata/generator").ComponentMetadata;
      }
    }

    const docFiles = reactAdapter.generateDocs(config, rules, metadataMap);
    for (const { filename, content } of docFiles) {
      await writeFile(path.join(docsDir, filename), content);
      logger.dim(`  → docs/${filename}`);
    }

    logger.success(`Docs written (${docFiles.length} files)`);
  }

  // ── 8. Package files ──
  if (!only) {
    logger.step("Writing package files...");

    const componentNames = Object.keys(rules);

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

  // ── 9. Showcase ──
  logger.step("Generating showcase...");
  const { generateShowcase } = await import("../../generators/showcase/html");
  const showcaseHtml = generateShowcase(config!, resolution);
  await writeFile(path.join(outRoot, "showcase.html"), showcaseHtml);
  logger.dim(`  → showcase.html`);

  const fsExtra = await import("fs-extra");
  const fsE = fsExtra.default ?? fsExtra;
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
