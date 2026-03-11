import { COMPONENT_JSON_DEFINITIONS } from "./componentDefinitions";
import type { ComponentJson } from "./componentSchemas";

export function generateComponentJson(
  name: string,
  resolvedCssVars: { light: Record<string, string>; dark: Record<string, string> },
): ComponentJson {
  const definition = COMPONENT_JSON_DEFINITIONS[name];
  if (!definition) throw new Error(`No JSON definition found for component: ${name}`);

  return {
    ...definition,
    cssVars: resolvedCssVars,
  };
}
