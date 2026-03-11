/**
 * componentDefinitions.ts — static authored content for all components.
 *
 * Holds descriptions, props, examples, and AI guidance for all 9 components
 * plus ThemeProvider. Dynamic parts (cssVars with real token values) are
 * injected at generate time by generateComponentJson.ts.
 */

import type { ComponentJson, ComponentMetadataJson } from "./componentSchemas";

type StaticComponentJson = Omit<ComponentJson, "cssVars">;

// ─── Free tier definitions ────────────────────────────────────────────────────

export const COMPONENT_JSON_DEFINITIONS: Record<string, StaticComponentJson> = {
  Button: {
    name: "Button",
    description:
      "A clickable element that triggers an action. Supports multiple visual variants and sizes, inheriting all design tokens automatically.",
    props: [
      { name: "variant", type: "'primary' | 'secondary' | 'destructive' | 'ghost'", default: "'primary'", required: false, description: "Visual style variant" },
      { name: "size", type: "'sm' | 'md' | 'lg'", default: "'md'", required: false, description: "Size of the button" },
      { name: "disabled", type: "boolean", default: "false", required: false, description: "Disables interaction and applies muted styling" },
      { name: "onClick", type: "() => void", default: "—", required: false, description: "Click handler" },
      { name: "children", type: "ReactNode", default: "—", required: true, description: "Button label or content" },
    ],
    examples: [
      { label: "Primary", code: '<Button variant="primary">Save changes</Button>' },
      { label: "Secondary", code: '<Button variant="secondary">Cancel</Button>' },
      { label: "Destructive", code: '<Button variant="destructive">Delete account</Button>' },
      { label: "Ghost", code: '<Button variant="ghost">Learn more</Button>' },
      { label: "Disabled", code: '<Button variant="primary" disabled>Processing...</Button>' },
      { label: "Small", code: '<Button variant="primary" size="sm">Confirm</Button>' },
      { label: "Large", code: '<Button variant="primary" size="lg">Get started</Button>' },
    ],
  },

  Input: {
    name: "Input",
    description:
      "A text input field with support for label, placeholder, error state, and disabled state. Styled consistently with design tokens.",
    props: [
      { name: "label", type: "string", default: "—", required: false, description: "Label displayed above the input" },
      { name: "placeholder", type: "string", default: "—", required: false, description: "Placeholder text" },
      { name: "value", type: "string", default: "—", required: true, description: "Controlled input value" },
      { name: "onChange", type: "(e: React.ChangeEvent<HTMLInputElement>) => void", default: "—", required: true, description: "Change handler" },
      { name: "error", type: "string", default: "—", required: false, description: "Error message displayed below the input" },
      { name: "disabled", type: "boolean", default: "false", required: false, description: "Disables the input" },
    ],
    examples: [
      { label: "Default", code: '<Input label="Email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />' },
      { label: "With error", code: '<Input label="Email" value={email} onChange={e => setEmail(e.target.value)} error="Please enter a valid email address" />' },
      { label: "Disabled", code: '<Input label="Email" value="user@example.com" onChange={() => {}} disabled />' },
      { label: "No label", code: '<Input placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} />' },
    ],
  },

  Card: {
    name: "Card",
    description:
      "A surface container for grouping related content. Applies background, border, and shadow tokens consistently.",
    props: [
      { name: "children", type: "ReactNode", default: "—", required: true, description: "Card content" },
      { name: "padding", type: "'sm' | 'md' | 'lg'", default: "'md'", required: false, description: "Inner padding size" },
      { name: "shadow", type: "boolean", default: "true", required: false, description: "Applies elevation shadow" },
    ],
    examples: [
      { label: "Default", code: "<Card>\n  <h2>Card title</h2>\n  <p>Card content goes here.</p>\n</Card>" },
      { label: "No shadow", code: "<Card shadow={false}>\n  <p>Flat card, no elevation.</p>\n</Card>" },
      { label: "Large padding", code: "<Card padding=\"lg\">\n  <p>Spacious card layout.</p>\n</Card>" },
    ],
  },

  ThemeProvider: {
    name: "ThemeProvider",
    description:
      "Wraps the application and injects CSS custom properties from your design tokens. Required at the root of any app using this design system.",
    props: [
      { name: "theme", type: "'light' | 'dark'", default: "'light'", required: false, description: "Active theme" },
      { name: "children", type: "ReactNode", default: "—", required: true, description: "Application content" },
    ],
    examples: [
      { label: "Light theme", code: '<ThemeProvider theme="light">\n  <App />\n</ThemeProvider>' },
      { label: "Dark theme", code: '<ThemeProvider theme="dark">\n  <App />\n</ThemeProvider>' },
    ],
  },

  Badge: {
    name: "Badge",
    description:
      "A small label used to highlight status, category, or count. Supports semantic colour variants mapped to your token palette.",
    props: [
      { name: "variant", type: "'default' | 'success' | 'warning' | 'error' | 'info'", default: "'default'", required: false, description: "Semantic colour variant" },
      { name: "children", type: "ReactNode", default: "—", required: true, description: "Badge label" },
    ],
    examples: [
      { label: "Default", code: "<Badge>New</Badge>" },
      { label: "Success", code: '<Badge variant="success">Active</Badge>' },
      { label: "Warning", code: '<Badge variant="warning">Pending</Badge>' },
      { label: "Error", code: '<Badge variant="error">Failed</Badge>' },
      { label: "Info", code: '<Badge variant="info">In review</Badge>' },
    ],
  },

  Checkbox: {
    name: "Checkbox",
    description:
      "A boolean input for toggling an option on or off. Supports label, checked state, indeterminate state, and disabled.",
    props: [
      { name: "label", type: "string", default: "—", required: false, description: "Label displayed beside the checkbox" },
      { name: "checked", type: "boolean", default: "false", required: true, description: "Controlled checked state" },
      { name: "onChange", type: "(e: React.ChangeEvent<HTMLInputElement>) => void", default: "—", required: true, description: "Change handler" },
      { name: "indeterminate", type: "boolean", default: "false", required: false, description: "Indeterminate visual state (used in select-all patterns)" },
      { name: "disabled", type: "boolean", default: "false", required: false, description: "Disables interaction" },
    ],
    examples: [
      { label: "Default", code: '<Checkbox label="Accept terms" checked={accepted} onChange={e => setAccepted(e.target.checked)} />' },
      { label: "Checked", code: '<Checkbox label="Notifications enabled" checked={true} onChange={() => {}} />' },
      { label: "Indeterminate", code: '<Checkbox label="Select all" checked={false} indeterminate onChange={() => {}} />' },
      { label: "Disabled", code: '<Checkbox label="Unavailable option" checked={false} disabled onChange={() => {}} />' },
    ],
  },

  Radio: {
    name: "Radio",
    description:
      "A single-select input within a group of options. Use multiple Radio components sharing a name to form a group.",
    props: [
      { name: "label", type: "string", default: "—", required: false, description: "Label displayed beside the radio button" },
      { name: "value", type: "string", default: "—", required: true, description: "Value for this option" },
      { name: "checked", type: "boolean", default: "false", required: true, description: "Whether this option is selected" },
      { name: "onChange", type: "(e: React.ChangeEvent<HTMLInputElement>) => void", default: "—", required: true, description: "Change handler" },
      { name: "name", type: "string", default: "—", required: true, description: "Group name — shared across all options in a group" },
      { name: "disabled", type: "boolean", default: "false", required: false, description: "Disables this option" },
    ],
    examples: [
      {
        label: "Radio group",
        code: "<Radio label=\"Option A\" name=\"choice\" value=\"a\" checked={choice === 'a'} onChange={() => setChoice('a')} />\n<Radio label=\"Option B\" name=\"choice\" value=\"b\" checked={choice === 'b'} onChange={() => setChoice('b')} />\n<Radio label=\"Option C\" name=\"choice\" value=\"c\" checked={choice === 'c'} onChange={() => setChoice('c')} />",
      },
      { label: "Disabled option", code: '<Radio label="Unavailable" name="choice" value="x" checked={false} disabled onChange={() => {}} />' },
    ],
  },

  Select: {
    name: "Select",
    description:
      "A dropdown input for choosing one option from a list. Accepts an options array and handles label, placeholder, and error state.",
    props: [
      { name: "label", type: "string", default: "—", required: false, description: "Label displayed above the select" },
      { name: "options", type: "Array<{ label: string; value: string }>", default: "—", required: true, description: "List of options" },
      { name: "value", type: "string", default: "—", required: true, description: "Controlled selected value" },
      { name: "onChange", type: "(e: React.ChangeEvent<HTMLSelectElement>) => void", default: "—", required: true, description: "Change handler" },
      { name: "placeholder", type: "string", default: "—", required: false, description: "Placeholder option shown when no value is selected" },
      { name: "error", type: "string", default: "—", required: false, description: "Error message displayed below the select" },
      { name: "disabled", type: "boolean", default: "false", required: false, description: "Disables the select" },
    ],
    examples: [
      {
        label: "Default",
        code: "<Select\n  label=\"Country\"\n  options={[{ label: 'Norway', value: 'no' }, { label: 'Sweden', value: 'se' }]}\n  value={country}\n  onChange={e => setCountry(e.target.value)}\n/>",
      },
      {
        label: "With placeholder",
        code: "<Select\n  label=\"Country\"\n  placeholder=\"Select a country\"\n  options={[{ label: 'Norway', value: 'no' }]}\n  value={country}\n  onChange={e => setCountry(e.target.value)}\n/>",
      },
      {
        label: "With error",
        code: "<Select\n  label=\"Country\"\n  options={[{ label: 'Norway', value: 'no' }]}\n  value={country}\n  onChange={e => setCountry(e.target.value)}\n  error=\"Please select a country\"\n/>",
      },
    ],
  },

  Toast: {
    name: "Toast",
    description:
      "A brief, auto-dismissing notification. Use for confirmations, errors, and non-blocking alerts.",
    props: [
      { name: "message", type: "string", default: "—", required: true, description: "Notification message" },
      { name: "variant", type: "'info' | 'success' | 'warning' | 'error'", default: "'info'", required: false, description: "Semantic variant" },
      { name: "duration", type: "number", default: "3000", required: false, description: "Auto-dismiss duration in milliseconds" },
      { name: "onDismiss", type: "() => void", default: "—", required: false, description: "Called when the toast is dismissed" },
    ],
    examples: [
      { label: "Success", code: '<Toast message="Changes saved successfully" variant="success" onDismiss={() => setToast(null)} />' },
      { label: "Error", code: '<Toast message="Something went wrong. Please try again." variant="error" onDismiss={() => setToast(null)} />' },
      { label: "Warning", code: '<Toast message="Your session will expire in 5 minutes." variant="warning" onDismiss={() => setToast(null)} />' },
      { label: "Custom duration", code: '<Toast message="Copied to clipboard" variant="success" duration={1500} onDismiss={() => setToast(null)} />' },
    ],
  },

  Spinner: {
    name: "Spinner",
    description:
      "An animated loading indicator. Use when an async operation is in progress and the duration is unknown.",
    props: [
      { name: "size", type: "'sm' | 'md' | 'lg'", default: "'md'", required: false, description: "Size of the spinner" },
      { name: "label", type: "string", default: "'Loading…'", required: false, description: "Accessible label used as aria-label" },
    ],
    examples: [
      { label: "Default", code: "<Spinner />" },
      { label: "Small", code: '<Spinner size="sm" />' },
      { label: "Large", code: '<Spinner size="lg" />' },
      { label: "Custom label", code: '<Spinner size="md" label="Saving your changes" />' },
    ],
  },
};

// ─── Pro tier definitions ─────────────────────────────────────────────────────

export const COMPONENT_METADATA_DEFINITIONS: Record<string, ComponentMetadataJson> = {
  Button: {
    name: "Button",
    role: "action-trigger",
    hierarchyLevel: "primary",
    destructiveVariants: ["destructive"],
    variants: ["primary", "secondary", "destructive", "ghost"],
    accessibilityContract: {
      keyboard: true,
      focusRing: "required",
      ariaLabel: "required-for-icon-only",
      roles: ["button"],
      notes: [
        "Must have visible focus ring — never remove outline without replacement",
        "Icon-only buttons must have an aria-label",
        "Disabled buttons should still be focusable for screen reader awareness",
      ],
    },
    aiGuidance: [
      "Use primary for the single most important action on a page or in a section",
      "Never place two primary buttons side by side — only one primary action per context",
      "Use destructive only for irreversible actions — always pair with a confirmation dialog",
      "Use ghost for tertiary actions that should not compete visually with primary and secondary",
      "Never use a button for navigation — use a link instead",
    ],
  },

  Input: {
    name: "Input",
    role: "text-input",
    hierarchyLevel: "utility",
    destructiveVariants: [],
    variants: ["default", "error", "disabled"],
    accessibilityContract: {
      keyboard: true,
      focusRing: "required",
      ariaLabel: "optional",
      roles: ["textbox"],
      notes: [
        "Always associate label with input — never use placeholder as a replacement for label",
        "Error messages must be connected via aria-describedby",
        "Disabled inputs should use the disabled attribute, not just visual styling",
      ],
    },
    aiGuidance: [
      "Always provide a label — placeholder text alone is not accessible",
      "Error prop should describe what went wrong, not just that something went wrong",
      "Use controlled inputs — always provide value and onChange together",
      "Do not use Input for multiline text — use a Textarea component instead",
    ],
  },

  Card: {
    name: "Card",
    role: "surface-container",
    hierarchyLevel: "utility",
    destructiveVariants: [],
    variants: ["default"],
    accessibilityContract: {
      keyboard: false,
      focusRing: "none",
      ariaLabel: "optional",
      roles: ["region"],
      notes: [
        "If a card is interactive (clickable), wrap in a button or anchor — never use onClick on a div",
        "Add aria-label or aria-labelledby if the card represents a distinct region of the page",
      ],
    },
    aiGuidance: [
      "Card is a layout container — do not put interaction on the Card itself",
      "Use padding=\"lg\" for content-heavy cards, padding=\"sm\" for compact UI like sidebars",
      "Disable shadow when cards are on a surface that already has elevation",
    ],
  },

  ThemeProvider: {
    name: "ThemeProvider",
    role: "theme-context",
    hierarchyLevel: "utility",
    destructiveVariants: [],
    variants: ["light", "dark"],
    accessibilityContract: {
      keyboard: false,
      focusRing: "none",
      ariaLabel: "none",
      roles: [],
      notes: [
        "Ensure colour contrast meets WCAG AA in both light and dark themes",
        "Do not rely on colour alone to convey meaning",
      ],
    },
    aiGuidance: [
      "ThemeProvider must wrap the entire application at the root — not individual components",
      "Never nest ThemeProviders — use one at the root",
      "Theme value should come from user preference (prefers-color-scheme) or an explicit user toggle",
    ],
  },

  Badge: {
    name: "Badge",
    role: "status-indicator",
    hierarchyLevel: "tertiary",
    destructiveVariants: ["error"],
    variants: ["default", "success", "warning", "error", "info"],
    accessibilityContract: {
      keyboard: false,
      focusRing: "none",
      ariaLabel: "optional",
      roles: ["status"],
      notes: [
        "Do not rely on colour alone — badge text must convey the meaning",
        "For dynamic status changes, wrap in an aria-live region",
      ],
    },
    aiGuidance: [
      "Use Badge for status, categories, or counts — not for actions",
      "Badge text should be short — one or two words maximum",
      "Use error variant sparingly — only for genuine failure states",
      "Do not use Badge as a button or interactive element",
    ],
  },

  Checkbox: {
    name: "Checkbox",
    role: "boolean-input",
    hierarchyLevel: "utility",
    destructiveVariants: [],
    variants: ["default", "checked", "indeterminate", "disabled"],
    accessibilityContract: {
      keyboard: true,
      focusRing: "required",
      ariaLabel: "optional",
      roles: ["checkbox"],
      notes: [
        "Always associate a label — either via label prop or aria-label",
        "Indeterminate state must be set via the indeterminate DOM property, not just visually",
        "Group related checkboxes in a fieldset with a legend",
      ],
    },
    aiGuidance: [
      "Use Checkbox for independent boolean options — not for mutually exclusive choices (use Radio for that)",
      "Indeterminate state is for parent checkboxes in a select-all pattern only",
      "Always use controlled state — provide checked and onChange together",
    ],
  },

  Radio: {
    name: "Radio",
    role: "single-select-input",
    hierarchyLevel: "utility",
    destructiveVariants: [],
    variants: ["default", "checked", "disabled"],
    accessibilityContract: {
      keyboard: true,
      focusRing: "required",
      ariaLabel: "optional",
      roles: ["radio"],
      notes: [
        "All Radio components in a group must share the same name prop",
        "Group in a fieldset with a legend describing the group question",
        "Arrow keys should navigate between options within the group",
      ],
    },
    aiGuidance: [
      "Use Radio for mutually exclusive choices — not for independent toggles (use Checkbox for that)",
      "Always render the full group — never a single Radio in isolation",
      "All options in a group must share the same name prop",
      "Pre-select the most common or safest option — never leave a radio group with no selection",
    ],
  },

  Select: {
    name: "Select",
    role: "dropdown-input",
    hierarchyLevel: "utility",
    destructiveVariants: [],
    variants: ["default", "error", "disabled"],
    accessibilityContract: {
      keyboard: true,
      focusRing: "required",
      ariaLabel: "optional",
      roles: ["combobox", "listbox"],
      notes: [
        "Always provide a label — never rely on placeholder alone",
        "Error messages must be connected via aria-describedby",
        "Use a placeholder option with an empty value to represent the unselected state",
      ],
    },
    aiGuidance: [
      "Use Select when there are 5 or more options — use Radio for fewer options",
      "Always provide a label separate from placeholder",
      "Placeholder should say what the field is for, not just \"Select...\"",
      "Always use controlled state — provide value and onChange together",
    ],
  },

  Toast: {
    name: "Toast",
    role: "feedback",
    hierarchyLevel: "utility",
    destructiveVariants: [],
    variants: ["info", "success", "warning", "error"],
    accessibilityContract: {
      keyboard: false,
      focusRing: "none",
      ariaLabel: "none",
      roles: ["alert", "status"],
      notes: [
        "Toast container must be an aria-live region — role=\"status\" for non-urgent, role=\"alert\" for errors",
        "Do not auto-dismiss error toasts — errors require user acknowledgement",
        "Ensure toast is readable before it dismisses — minimum 3000ms for average message length",
      ],
    },
    aiGuidance: [
      "Use Toast for non-blocking feedback only — never for critical errors that block the user",
      "Error toasts should not auto-dismiss — set duration={0} or a very long duration",
      "Never stack more than 3 toasts — dismiss older ones when new ones appear",
      "Toast message should describe what happened, not just that it happened",
    ],
  },

  Spinner: {
    name: "Spinner",
    role: "loading-indicator",
    hierarchyLevel: "utility",
    destructiveVariants: [],
    variants: ["sm", "md", "lg"],
    accessibilityContract: {
      keyboard: false,
      focusRing: "none",
      ariaLabel: "required",
      roles: ["status"],
      notes: [
        "Must always have an aria-label describing what is loading",
        "Wrap in an aria-live region so screen readers announce the loading state",
        "Remove from DOM when loading is complete — do not just hide visually",
      ],
    },
    aiGuidance: [
      "Always provide a descriptive label — never use the default \"Loading…\" in production",
      "Use size=\"sm\" inline with content, size=\"lg\" for full-page loading states",
      "Remove the spinner from the DOM when loading completes — do not hide with CSS",
      "Pair with a disabled state on the triggering button so users cannot re-submit",
    ],
  },
};
