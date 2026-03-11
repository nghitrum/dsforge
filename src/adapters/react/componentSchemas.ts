/**
 * componentSchemas.ts — type definitions for component JSON outputs.
 *
 * Single source of truth for the shape of:
 *   ComponentJson         → written to components/Name/Name.json        (free)
 *   ComponentMetadataJson → written to components/Name/Name.metadata.json (Pro)
 */

// ─── Free tier schema ─────────────────────────────────────────────────────────

export interface PropMeta {
  name: string;
  type: string;
  default: string; // use '—' if no default
  required: boolean;
  description: string;
}

export interface ExampleMeta {
  label: string; // e.g. 'Primary', 'Disabled', 'With icon'
  code: string;  // JSX string, copy-pasteable
}

export interface ComponentJson {
  name: string;
  description: string;
  props: PropMeta[];
  examples: ExampleMeta[];
  cssVars: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

// ─── Pro tier schema ──────────────────────────────────────────────────────────

export interface AccessibilityContract {
  keyboard: boolean;
  focusRing: "required" | "optional" | "none";
  ariaLabel: "required" | "required-for-icon-only" | "optional" | "none";
  roles: string[];   // e.g. ['button'], ['checkbox'], ['textbox']
  notes: string[];   // plain language a11y notes
}

export interface ComponentMetadataJson {
  name: string;
  role: string;      // e.g. 'action-trigger', 'text-input', 'feedback'
  hierarchyLevel: "primary" | "secondary" | "tertiary" | "utility";
  destructiveVariants: string[];
  variants: string[];
  accessibilityContract: AccessibilityContract;
  aiGuidance: string[]; // plain language rules for AI tools
}
