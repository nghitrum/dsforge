/**
 * generate.ts — full generation pipeline
 *
 * Pipeline order:
 *   1. Read + validate config and rules
 *   2. Resolve all tokens
 *   3. Emit CSS custom property files (base.css + one per theme)
 *   4. Emit JS/TS token constants + Tailwind config
 *   5. Generate React components (Button, Input, Card, ThemeProvider)
 *   6. Generate AI-consumable metadata JSON
 *   7. Generate MDX documentation
 *   8. Emit package.json, tsconfig, README, CHANGELOG
 */

import path from "node:path";
import { readConfig, readRules, ensureDir, writeFile } from "../../utils/fs";
import { resolveTokens } from "../../core/token-resolver";
import { logger } from "../../utils/logger";
import { validateConfig } from "./validate";
import { generateCssFiles } from "../../generators/tokens/css-vars";
import {
  emitJsTokens,
  emitTailwindConfig,
} from "../../generators/tokens/js-tokens";
import { generateButton } from "../../generators/components/button";
import { generateInput } from "../../generators/components/input";
import { generateCard } from "../../generators/components/card";
import {
  generateThemeProvider,
  generateComponentIndex,
} from "../../generators/components/theme-provider";
import { generateMetadata } from "../../generators/metadata/generator";
import { generateDocs } from "../../generators/docs/mdx";
import {
  generatePackageJson,
  generateTsConfig,
  generateReadme,
  generateChangelog,
} from "../../generators/package/emitter";
import type { DesignSystemConfig, RulesConfig } from "../../types/index";

export interface GenerateOptions {
  watch?: boolean;
  only?: string;
}

// ─── Output directory layout ─────────────────────────────────────────────────
//
//  <cwd>/
//  └── dist-ds/                   ← root of the generated publishable package
//      ├── package.json
//      ├── tsconfig.json
//      ├── README.md
//      ├── CHANGELOG.md
//      ├── src/
//      │   ├── index.ts           ← barrel of all components
//      │   ├── Button.tsx
//      │   ├── Input.tsx
//      │   ├── Card.tsx
//      │   └── ThemeProvider.tsx
//      ├── tokens/
//      │   ├── base.css
//      │   ├── light.css
//      │   ├── dark.css
//      │   ├── tokens.js
//      │   └── tailwind.js
//      ├── metadata/
//      │   ├── index.json
//      │   ├── button.json
//      │   └── ...
//      └── docs/
//          ├── index.mdx
//          ├── button.mdx
//          └── ...

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

    const cssFiles = generateCssFiles(config, resolution);
    for (const { filename, content } of cssFiles) {
      await writeFile(path.join(tokensDir, filename), content);
      logger.dim(`  → tokens/${filename}`);
    }

    const jsTokens = emitJsTokens(config, resolution);
    await writeFile(path.join(tokensDir, "tokens.js"), jsTokens);
    logger.dim(`  → tokens/tokens.js`);

    const twConfig = emitTailwindConfig(config);
    await writeFile(path.join(tokensDir, "tailwind.js"), twConfig);
    logger.dim(`  → tokens/tailwind.js`);

    logger.success(`Token files written`);
  }

  // ── 5. Components ──
  if (!only || only === "components") {
    logger.step("Generating React components...");
    const srcDir = path.join(outRoot, "src");
    await ensureDir(srcDir);

    const componentGenerators: Array<{
      name: string;
      generate: () => string;
    }> = [
      {
        name: "Button",
        generate: () => generateButton(config, rules["button"]),
      },
      { name: "Input", generate: () => generateInput(config, rules["input"]) },
      { name: "Card", generate: () => generateCard(config, rules["card"]) },
    ];

    const generatedNames: string[] = [];

    for (const { name, generate } of componentGenerators) {
      try {
        const content = generate();
        await writeFile(path.join(srcDir, `${name}.tsx`), content);
        logger.dim(`  → src/${name}.tsx`);
        generatedNames.push(name);
      } catch (err) {
        logger.warn(`Could not generate ${name}: ${(err as Error).message}`);
      }
    }

    // ThemeProvider
    const themeProvider = generateThemeProvider(config);
    await writeFile(path.join(srcDir, "ThemeProvider.tsx"), themeProvider);
    logger.dim(`  → src/ThemeProvider.tsx`);

    // Barrel index
    const barrelIndex = generateComponentIndex(config, generatedNames);
    await writeFile(path.join(srcDir, "index.ts"), barrelIndex);
    logger.dim(`  → src/index.ts`);

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

    // Build metadata map for docs generator
    const metadataFiles = generateMetadata(config, rules, tokenCount);
    const metadataMap: Record<
      string,
      import("../../generators/metadata/generator.js").ComponentMetadata
    > = {};
    for (const { filename, content } of metadataFiles) {
      const name = filename.replace(".json", "");
      if (name !== "index") {
        metadataMap[name] = JSON.parse(
          content,
        ) as import("../../generators/metadata/generator.js").ComponentMetadata;
      }
    }

    const docFiles = generateDocs(config, rules, metadataMap);
    for (const { filename, content } of docFiles) {
      await writeFile(path.join(docsDir, filename), content);
      logger.dim(`  → docs/${filename}`);
    }

    logger.success(`Docs written (${docFiles.length} files)`);
  }

  // ── 8. Package manifest ──
  if (!only) {
    logger.step("Writing package manifest...");
    const componentNames = Object.keys(rules);

    const pkgJson = generatePackageJson(config, componentNames);
    await writeFile(path.join(outRoot, "package.json"), pkgJson);
    logger.dim(`  → package.json`);

    const tsConfig = generateTsConfig();
    await writeFile(path.join(outRoot, "tsconfig.json"), tsConfig);
    logger.dim(`  → tsconfig.json`);

    const readme = generateReadme(config, componentNames);
    await writeFile(path.join(outRoot, "README.md"), readme);
    logger.dim(`  → README.md`);

    // Only write CHANGELOG if it doesn't already exist (avoid overwriting)
    const changelogPath = path.join(outRoot, "CHANGELOG.md");
    const { default: fs } = await import("fs-extra");
    if (!(await fs.pathExists(changelogPath))) {
      await writeFile(changelogPath, generateChangelog(config));
      logger.dim(`  → CHANGELOG.md (seeded)`);
    }

    logger.success(`Package manifest written`);
  }

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
