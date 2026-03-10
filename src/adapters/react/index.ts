/**
 * src/adapters/react/index.ts
 *
 * ReactAdapter — the FrameworkAdapter implementation for React.
 *
 * All generation logic lives in sibling modules:
 *   components/button.ts    generateButton(config, rule)
 *   components/input.ts     generateInput(config, rule)
 *   components/card.ts      generateCard(config, rule)
 *   components/badge.ts     generateBadge(config, rule)
 *   components/checkbox.ts  generateCheckbox(config, rule)
 *   components/radio.ts     generateRadio(config, rule)
 *   components/select.ts    generateSelect(config, rule)
 *   components/toast.ts     generateToast(config, rule)
 *   components/spinner.ts   generateSpinner(config, rule)
 *   theme-provider.ts       generateThemeProvider(config)
 *                           generateComponentIndex(config, names)
 *   tokens/js-tokens.ts     emitJsTokens(config, resolution)
 *                           emitTailwindConfig(config)
 *   docs/mdx.ts             generateDocs(config, rules, metadataMap)
 */

import type { FrameworkAdapter, GeneratedFile } from "../types";
import type {
  DesignSystemConfig,
  RulesConfig,
  ComponentRule,
} from "../../types/index";
import type { ResolutionResult } from "../../core/token-resolver";
import type { ComponentMetadata } from "../../generators/metadata/generator";

import { generateButton } from "./components/button";
import { generateInput } from "./components/input";
import { generateCard } from "./components/card";
import { generateBadge } from "./components/badge";
import { generateCheckbox } from "./components/checkbox";
import { generateRadio } from "./components/radio";
import { generateSelect } from "./components/select";
import { generateToast } from "./components/toast";
import { generateSpinner } from "./components/spinner";
import {
  generateThemeProvider,
  generateComponentIndex,
} from "./theme-provider";
import { emitJsTokens, emitTailwindConfig } from "./tokens/js-tokens";
import { generateDocs } from "./docs/mdx";
import { generatePackageJson } from "../../generators/package/emitter";

// ─── Supported components ─────────────────────────────────────────────────────

/**
 * Ordered list of components this adapter can generate.
 * Not part of the FrameworkAdapter interface — used by generate.ts to drive
 * the component generation loop without hard-coding component names there.
 */
export const REACT_COMPONENTS = [
  "button",
  "input",
  "card",
  "badge",
  "checkbox",
  "radio",
  "select",
  "toast",
  "spinner",
] as const;
export type ReactComponentName = (typeof REACT_COMPONENTS)[number];

// ─── Adapter ──────────────────────────────────────────────────────────────────

export const reactAdapter: FrameworkAdapter = {
  // ── Identity ───────────────────────────────────────────────────────────────

  name: "react",
  componentExtension: ".tsx",

  // ── Component generation ───────────────────────────────────────────────────

  generateComponent(
    componentName: string,
    config: DesignSystemConfig,
    rule: ComponentRule | undefined,
  ): GeneratedFile {
    const pascalName =
      componentName.charAt(0).toUpperCase() + componentName.slice(1);
    const filename = `${pascalName}${reactAdapter.componentExtension}`;

    let content: string;
    switch (componentName.toLowerCase()) {
      case "button":
        content = generateButton(config, rule);
        break;
      case "input":
        content = generateInput(config, rule);
        break;
      case "card":
        content = generateCard(config, rule);
        break;
      case "badge":
        content = generateBadge(config, rule);
        break;
      case "checkbox":
        content = generateCheckbox(config, rule);
        break;
      case "radio":
        content = generateRadio(config, rule);
        break;
      case "select":
        content = generateSelect(config, rule);
        break;
      case "toast":
        content = generateToast(config, rule);
        break;
      case "spinner":
        content = generateSpinner(config, rule);
        break;
      default:
        throw new Error(
          `ReactAdapter.generateComponent: unsupported component "${componentName}". ` +
            `Supported: ${REACT_COMPONENTS.join(", ")}`,
        );
    }

    return { filename, content };
  },

  generateThemeProvider(config: DesignSystemConfig): GeneratedFile {
    return {
      filename: `ThemeProvider${reactAdapter.componentExtension}`,
      content: generateThemeProvider(config),
    };
  },

  generateComponentIndex(
    config: DesignSystemConfig,
    componentNames: string[],
  ): GeneratedFile {
    return {
      filename: "index.ts",
      content: generateComponentIndex(config, componentNames),
    };
  },

  // ── Token output ───────────────────────────────────────────────────────────

  generateTokenFiles(
    config: DesignSystemConfig,
    resolution: ResolutionResult,
  ): GeneratedFile[] {
    return [
      { filename: "tokens.js", content: emitJsTokens(config, resolution) },
      { filename: "tailwind.js", content: emitTailwindConfig(config) },
    ];
  },

  // ── Documentation ──────────────────────────────────────────────────────────

  generateDocs(
    config: DesignSystemConfig,
    rules: RulesConfig,
    metadataMap: Record<string, ComponentMetadata>,
  ): GeneratedFile[] {
    return generateDocs(config, rules, metadataMap);
  },

  // ── Package manifest ───────────────────────────────────────────────────────

  generatePackageManifest(
    config: DesignSystemConfig,
    componentNames: string[],
  ): GeneratedFile {
    return {
      filename: "package.json",
      content: generatePackageJson(config, componentNames),
    };
  },
};
