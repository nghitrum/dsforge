/**
 * ThemeProvider + component barrel index generator.
 *
 * Generates:
 *   ThemeProvider.tsx — React context-based theme switcher
 *   index.ts          — barrel export of all components
 */

import type { DesignSystemConfig } from "../../types/index";
import { isProUnlocked } from "../../lib/license";

// ─── ThemeProvider ────────────────────────────────────────────────────────────

export function generateThemeProvider(config: DesignSystemConfig): string {
  const themeNames = Object.keys(config.themes ?? { light: {}, dark: {} });
  const defaultTheme = themeNames.includes("light")
    ? "light"
    : (themeNames[0] ?? "light");
  const themeType = themeNames.map((t) => `"${t}"`).join(" | ");
  const isPro = isProUnlocked();
  const defaultDensity = config.meta.preset ?? "comfortable";

  const densityImport = isPro ? `\nimport "../tokens/density.css";` : "";

  const densityTypes = isPro
    ? `\nexport type DensityName = "compact" | "comfortable" | "spacious";\n`
    : "";

  const densityContextTypes = isPro
    ? `\nexport interface DensityContextValue {
  density: DensityName;
  setDensity: (density: DensityName) => void;
}\n`
    : "";

  const densityContext = isPro
    ? `\nexport const DensityContext = React.createContext<DensityContextValue>({
  density: "${defaultDensity}",
  setDensity: () => undefined,
});

/**
 * Hook to read and change the current density.
 * Must be used inside a <ThemeProvider>.
 */
export function useDensity(): DensityContextValue {
  return React.useContext(DensityContext);
}\n`
    : "";

  const densityProp = isPro
    ? `\n  /** Component density. Requires density.css to be imported. Defaults to "${defaultDensity}". */\n  density?: DensityName;`
    : "";

  const densityOnChangeProp = isPro
    ? `\n  /** Called when setDensity is invoked. */\n  onDensityChange?: (density: DensityName) => void;`
    : "";

  const densityState = isPro
    ? `\n  const [density, setDensityState] = React.useState<DensityName>(initialDensity);\n
  React.useEffect(() => {
    setDensityState(initialDensity);
  }, [initialDensity]);\n
  const setDensity = React.useCallback(
    (next: DensityName) => {
      setDensityState(next);
      onDensityChange?.(next);
    },
    [onDensityChange],
  );\n`
    : "";

  const densityDestructure = isPro
    ? `,\n  density: initialDensity = "${defaultDensity}",\n  onDensityChange,`
    : "";

  const densityProviderOpen = isPro
    ? `\n      <DensityContext.Provider value={{ density, setDensity }}>`
    : "";

  const densityDataAttr = isPro ? ` data-density={density}` : "";

  const densityProviderClose = isPro
    ? `\n      </DensityContext.Provider>`
    : "";

  return `/**
 * ThemeProvider — ${config.meta.name}
 *
 * Applies the active theme by setting data-theme on the root element.
 * Consumers wrap their app (or a subtree) in ThemeProvider.
 *
 * Usage:
 *   import "@${config.meta.name}/tokens/base.css";
 *   import "@${config.meta.name}/tokens/light.css";  // or dark.css
 *   import { ThemeProvider } from "@${config.meta.name}";
 *
 *   <ThemeProvider theme="light"${isPro ? ` density="${defaultDensity}"` : ""}>
 *     <App />
 *   </ThemeProvider>
 */

import React from "react";${densityImport}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThemeName = ${themeType};
${densityTypes}
export interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}
${densityContextTypes}
export interface ThemeProviderProps {
  /** Initial theme. Defaults to "${defaultTheme}". */
  theme?: ThemeName;
  /** Called when setTheme is invoked — use to persist theme preference. */
  onThemeChange?: (theme: ThemeName) => void;${densityProp}${densityOnChangeProp}
  children: React.ReactNode;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const ThemeContext = React.createContext<ThemeContextValue>({
  theme: "${defaultTheme}",
  setTheme: () => undefined,
});

/**
 * Hook to read and change the current theme.
 * Must be used inside a <ThemeProvider>.
 */
export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}
${densityContext}
// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({
  theme: initialTheme = "${defaultTheme}",
  onThemeChange,${densityDestructure}
  children,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<ThemeName>(initialTheme);

  React.useEffect(() => {
    setThemeState(initialTheme);
  }, [initialTheme]);

  const setTheme = React.useCallback(
    (next: ThemeName) => {
      setThemeState(next);
      onThemeChange?.(next);
    },
    [onThemeChange],
  );
${densityState}
  return (${densityProviderOpen}
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <div data-theme={theme}${densityDataAttr} style={{ display: "contents" }}>
          {children}
        </div>
      </ThemeContext.Provider>${densityProviderClose}
  );
}
`;
}

// ─── Barrel index ─────────────────────────────────────────────────────────────

export function generateComponentIndex(
  config: DesignSystemConfig,
  componentNames: string[],
): string {
  const lines: string[] = [
    `/**`,
    ` * ${config.meta.name} — component library`,
    ` * Generated by dsforge v${config.meta.version}. Do not edit manually.`,
    ` *`,
    ` * Usage:`,
    ` *   import { Button, Input, Card, ThemeProvider } from "${config.meta.npmScope ?? "@myorg"}/${config.meta.name}";`,
    ` */`,
    "",
  ];

  // Re-export components
  for (const name of componentNames) {
    lines.push(`export * from "./components/${name}/${name}";`);
  }

  // Re-export ThemeProvider
  lines.push(`export * from "./components/ThemeProvider/ThemeProvider";`);
  lines.push("");

  return lines.join("\n");
}
