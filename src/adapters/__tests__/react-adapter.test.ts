/**
 * src/adapters/__tests__/react-adapter.test.ts
 *
 * Validates that the React adapter correctly satisfies the FrameworkAdapter
 * interface contract defined in src/adapters/types.ts.
 *
 * This file is the living specification for what every adapter must produce.
 * A new adapter (Vue, Svelte, etc.) can be validated by running the same
 * assertions against its instance.
 */

import { describe, it, expect } from "vitest";
import { reactAdapter, REACT_COMPONENTS } from "../react/index";
import type { FrameworkAdapter, GeneratedFile } from "../types";
import type { DesignSystemConfig, RulesConfig } from "../../types/index";
import type { ResolutionResult } from "../../core/token-resolver";

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const MINIMAL_CONFIG: DesignSystemConfig = {
  meta: {
    name: "test-ds",
    version: "0.1.0",
    npmScope: "@test",
  },
  themes: {
    light: { "color-action": "#2563eb" },
    dark: { "color-action": "#3b82f6" },
  },
  typography: { fontFamily: "system-ui, sans-serif" },
  radius: { none: 0, sm: 2, md: 4, lg: 8, full: 9999 },
};

const MINIMAL_RULES: RulesConfig = {
  button: {
    allowedVariants: ["primary", "secondary", "danger", "ghost"],
    requiredProps: ["aria-label"],
    a11y: { keyboard: true, focusRing: true, ariaLabel: "required" },
  },
  input: {
    allowedVariants: ["default", "error"],
  },
  card: {
    allowedVariants: ["default", "elevated", "outlined"],
  },
};

const MINIMAL_RESOLUTION: ResolutionResult = {
  tokens: {
    "semantic.color-action": "#2563eb",
    "semantic.color-bg-default": "#ffffff",
    "semantic.color-text-primary": "#0f172a",
  },
  warnings: [],
};

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Asserts that a value is a valid GeneratedFile:
 *   { filename: non-empty string, content: non-empty string }
 */
function expectGeneratedFile(
  file: unknown,
  expectedFilename?: string,
): asserts file is GeneratedFile {
  expect(file).toBeTypeOf("object");
  expect(file).not.toBeNull();
  const f = file as GeneratedFile;
  expect(f.filename).toBeTypeOf("string");
  expect(f.filename.length).toBeGreaterThan(0);
  expect(f.content).toBeTypeOf("string");
  expect(f.content.length).toBeGreaterThan(0);
  if (expectedFilename !== undefined) {
    expect(f.filename).toBe(expectedFilename);
  }
}

// ─── Contract tests ───────────────────────────────────────────────────────────

describe("reactAdapter satisfies FrameworkAdapter", () => {
  // ── Type-level check ───────────────────────────────────────────────────────
  // This assignment will produce a TypeScript compile error if the adapter
  // fails to implement the full interface — no runtime assertion needed.
  const _typeCheck: FrameworkAdapter = reactAdapter;
  void _typeCheck;

  // ── Identity ───────────────────────────────────────────────────────────────

  describe("identity", () => {
    it("name is 'react'", () => {
      expect(reactAdapter.name).toBe("react");
    });

    it("componentExtension starts with a dot", () => {
      expect(reactAdapter.componentExtension).toMatch(/^\./);
    });

    it("componentExtension is '.tsx'", () => {
      expect(reactAdapter.componentExtension).toBe(".tsx");
    });
  });

  // ── generateComponent ──────────────────────────────────────────────────────

  describe("generateComponent", () => {
    for (const componentName of REACT_COMPONENTS) {
      it(`returns a GeneratedFile for "${componentName}"`, () => {
        const file = reactAdapter.generateComponent(
          componentName,
          MINIMAL_CONFIG,
          MINIMAL_RULES[componentName],
        );
        const pascalName =
          componentName.charAt(0).toUpperCase() + componentName.slice(1);
        expectGeneratedFile(
          file,
          `${pascalName}${reactAdapter.componentExtension}`,
        );
      });

      it(`"${componentName}" content contains 'export'`, () => {
        const { content } = reactAdapter.generateComponent(
          componentName,
          MINIMAL_CONFIG,
          MINIMAL_RULES[componentName],
        );
        expect(content).toContain("export");
      });

      it(`"${componentName}" honours allowedVariants from rule`, () => {
        const rule = MINIMAL_RULES[componentName];
        const { content } = reactAdapter.generateComponent(
          componentName,
          MINIMAL_CONFIG,
          rule,
        );
        for (const variant of rule?.allowedVariants ?? []) {
          expect(content).toContain(variant);
        }
      });

      it(`"${componentName}" uses undefined rule without throwing (safe defaults)`, () => {
        expect(() =>
          reactAdapter.generateComponent(
            componentName,
            MINIMAL_CONFIG,
            undefined,
          ),
        ).not.toThrow();
      });
    }

    it("throws on unsupported component name", () => {
      expect(() =>
        reactAdapter.generateComponent("tooltip", MINIMAL_CONFIG, undefined),
      ).toThrow();
    });
  });

  // ── generateThemeProvider ──────────────────────────────────────────────────

  describe("generateThemeProvider", () => {
    it("returns a GeneratedFile named ThemeProvider.tsx", () => {
      const file = reactAdapter.generateThemeProvider(MINIMAL_CONFIG);
      expectGeneratedFile(
        file,
        `ThemeProvider${reactAdapter.componentExtension}`,
      );
    });

    it("content references all theme names from config", () => {
      const { content } = reactAdapter.generateThemeProvider(MINIMAL_CONFIG);
      for (const themeName of Object.keys(MINIMAL_CONFIG.themes ?? {})) {
        expect(content).toContain(themeName);
      }
    });

    it("content exports ThemeProvider", () => {
      const { content } = reactAdapter.generateThemeProvider(MINIMAL_CONFIG);
      expect(content).toContain("ThemeProvider");
    });
  });

  // ── generateComponentIndex ─────────────────────────────────────────────────

  describe("generateComponentIndex", () => {
    it("returns a GeneratedFile named index.ts", () => {
      const file = reactAdapter.generateComponentIndex(MINIMAL_CONFIG, [
        "Button",
        "Input",
      ]);
      expectGeneratedFile(file, "index.ts");
    });

    it("re-exports all provided component names", () => {
      const names = ["Button", "Input", "Card"];
      const { content } = reactAdapter.generateComponentIndex(
        MINIMAL_CONFIG,
        names,
      );
      for (const name of names) {
        expect(content).toContain(name);
      }
    });

    it("re-exports ThemeProvider", () => {
      const { content } = reactAdapter.generateComponentIndex(
        MINIMAL_CONFIG,
        [],
      );
      expect(content).toContain("ThemeProvider");
    });

    it("contains no implementation logic — only re-exports", () => {
      const { content } = reactAdapter.generateComponentIndex(MINIMAL_CONFIG, [
        "Button",
      ]);
      // Should not contain function declarations, class, or const with logic
      expect(content).not.toMatch(/^(function|class)\s/m);
      expect(content).toContain("export");
    });
  });

  // ── generateTokenFiles ─────────────────────────────────────────────────────

  describe("generateTokenFiles", () => {
    it("returns an array", () => {
      const files = reactAdapter.generateTokenFiles(
        MINIMAL_CONFIG,
        MINIMAL_RESOLUTION,
      );
      expect(Array.isArray(files)).toBe(true);
    });

    it("returns at least one file", () => {
      const files = reactAdapter.generateTokenFiles(
        MINIMAL_CONFIG,
        MINIMAL_RESOLUTION,
      );
      expect(files.length).toBeGreaterThan(0);
    });

    it("every entry is a valid GeneratedFile", () => {
      const files = reactAdapter.generateTokenFiles(
        MINIMAL_CONFIG,
        MINIMAL_RESOLUTION,
      );
      for (const file of files) {
        expectGeneratedFile(file);
      }
    });

    it("includes tokens.js", () => {
      const files = reactAdapter.generateTokenFiles(
        MINIMAL_CONFIG,
        MINIMAL_RESOLUTION,
      );
      const names = files.map((f) => f.filename);
      expect(names).toContain("tokens.js");
    });

    it("includes tailwind.js", () => {
      const files = reactAdapter.generateTokenFiles(
        MINIMAL_CONFIG,
        MINIMAL_RESOLUTION,
      );
      const names = files.map((f) => f.filename);
      expect(names).toContain("tailwind.js");
    });

    it("tokens.js content contains resolved token values", () => {
      const files = reactAdapter.generateTokenFiles(
        MINIMAL_CONFIG,
        MINIMAL_RESOLUTION,
      );
      const tokensFile = files.find((f) => f.filename === "tokens.js")!;
      expect(tokensFile.content).toContain("#2563eb");
    });
  });

  // ── generateDocs ───────────────────────────────────────────────────────────

  describe("generateDocs", () => {
    const metadataMap = {
      button: {
        component: "Button",
        version: "0.1.0",
        description: "A button.",
        role: "action-trigger",
        hierarchyLevel: "primary" as const,
        interactionModel: "synchronous" as const,
        layoutImpact: "inline" as const,
        destructive: false,
        allowedVariants: ["primary", "secondary"],
        defaultVariant: "primary",
        requiredProps: ["aria-label"],
        optionalProps: [],
        tokens: {},
        accessibilityContract: {
          keyboard: true,
          focusRing: true,
          ariaLabel: "required" as const,
        },
        governanceRules: {},
      },
    };

    it("returns an array", () => {
      const files = reactAdapter.generateDocs(
        MINIMAL_CONFIG,
        MINIMAL_RULES,
        metadataMap,
      );
      expect(Array.isArray(files)).toBe(true);
    });

    it("every entry is a valid GeneratedFile", () => {
      const files = reactAdapter.generateDocs(
        MINIMAL_CONFIG,
        MINIMAL_RULES,
        metadataMap,
      );
      for (const file of files) {
        expectGeneratedFile(file);
      }
    });
  });

  // ── generatePackageManifest ────────────────────────────────────────────────

  describe("generatePackageManifest", () => {
    it("returns a GeneratedFile named package.json", () => {
      const file = reactAdapter.generatePackageManifest(MINIMAL_CONFIG, [
        "Button",
      ]);
      expectGeneratedFile(file, "package.json");
    });

    it("content is valid JSON", () => {
      const { content } = reactAdapter.generatePackageManifest(MINIMAL_CONFIG, [
        "Button",
      ]);
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it("name field matches config meta", () => {
      const { content } = reactAdapter.generatePackageManifest(MINIMAL_CONFIG, [
        "Button",
      ]);
      const pkg = JSON.parse(content);
      expect(pkg.name).toBe(
        `${MINIMAL_CONFIG.meta.npmScope}/${MINIMAL_CONFIG.meta.name}`,
      );
    });

    it("version field matches config meta", () => {
      const { content } = reactAdapter.generatePackageManifest(MINIMAL_CONFIG, [
        "Button",
      ]);
      const pkg = JSON.parse(content);
      expect(pkg.version).toBe(MINIMAL_CONFIG.meta.version);
    });
  });
});
