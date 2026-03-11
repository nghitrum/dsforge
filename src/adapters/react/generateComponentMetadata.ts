import { COMPONENT_METADATA_DEFINITIONS } from "./componentDefinitions";
import type { ComponentMetadataJson } from "./componentSchemas";

export function generateComponentMetadata(name: string): ComponentMetadataJson {
  const definition = COMPONENT_METADATA_DEFINITIONS[name];
  if (!definition) throw new Error(`No metadata definition found for component: ${name}`);
  return definition;
}
