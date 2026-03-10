/**
 * Showcase component registry.
 *
 * Single registration point for all components in the showcase.
 * To add a new component:
 *   1. Create src/generators/showcase/components/{name}.ts
 *   2. Add one entry here.
 *
 * html.ts auto-derives componentItems, sections, and page descriptions
 * from this registry — no further changes required there.
 */

import type { DesignSystemConfig } from "../../types/index";
import type { ComponentDef } from "./types";

import { buttonDef } from "./components/button";
import { inputDef } from "./components/input";
import { cardDef } from "./components/card";
import { badgeDef } from "./components/badge";
import { checkboxDef } from "./components/checkbox";
import { radioDef } from "./components/radio";
import { selectDef } from "./components/select";
import { toastDef } from "./components/toast";
import { spinnerDef } from "./components/spinner";

// ─── Registry entry ───────────────────────────────────────────────────────────

export interface ShowcaseEntry {
  /** Matches the component name used in REACT_COMPONENTS and rules.json */
  id: string;
  /** Display label in the sidebar */
  label: string;
  /** Short description shown under the page title */
  pageDescription: string;
  /** Factory that produces the full ComponentDef for the showcase page */
  def: (config: DesignSystemConfig, tokens: Record<string, string>) => ComponentDef;
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const SHOWCASE_COMPONENTS: ShowcaseEntry[] = [
  {
    id: "button",
    label: "Button",
    pageDescription:
      "Triggers an action or event. Supports multiple variants, sizes, and loading state.",
    def: buttonDef,
  },
  {
    id: "input",
    label: "Input",
    pageDescription:
      "Single-line text field with label, helper text, and validation states.",
    def: inputDef,
  },
  {
    id: "card",
    label: "Card",
    pageDescription:
      "Surface that groups related content. Supports header, body, and footer slots.",
    def: cardDef,
  },
  {
    id: "badge",
    label: "Badge",
    pageDescription:
      "Compact label for status, categories, or counts. Display-only — not interactive.",
    def: badgeDef,
  },
  {
    id: "checkbox",
    label: "Checkbox",
    pageDescription:
      "Binary toggle for boolean values. Supports indeterminate state for partial selections.",
    def: checkboxDef,
  },
  {
    id: "radio",
    label: "Radio",
    pageDescription:
      "Single selection within a mutually exclusive group. Always use inside RadioGroup.",
    def: radioDef,
  },
  {
    id: "select",
    label: "Select",
    pageDescription:
      "Dropdown picker for selecting from a list of options. Wraps native <select> for full accessibility.",
    def: selectDef,
  },
  {
    id: "toast",
    label: "Toast / Alert",
    pageDescription:
      "Feedback messages for user actions. Alert is inline; Toast is an overlay with auto-dismiss.",
    def: toastDef,
  },
  {
    id: "spinner",
    label: "Spinner",
    pageDescription:
      "Loading indicator for async operations. Includes a visually hidden status label for screen readers.",
    def: spinnerDef,
  },
];
