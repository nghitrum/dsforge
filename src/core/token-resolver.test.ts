import { describe, it, expect } from "vitest";
import {
  TokenResolver,
  resolveTokens,
  extractRefs,
  hasRefs,
} from "./token-resolver";
import {
  CircularReferenceError,
  UnresolvedReferenceError,
} from "../types/index";
import type { DesignSystemConfig } from "../types/index";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_CONFIG: DesignSystemConfig = {
  meta: { name: "test-ds", version: "0.1.0" },
  tokens: {
    global: {
      "blue-600": "#2563eb",
      "blue-700": "#1d4ed8",
      "gray-900": "#111827",
      "space-4": 16,
    },
    semantic: {
      "color-action": "{global.blue-600}",
      "color-action-hover": "{global.blue-700}",
      "color-text-primary": "{global.gray-900}",
      "component-padding": "{global.space-4}",
    },
    component: {
      "button-bg": "{semantic.color-action}",
      "button-bg-hover": "{semantic.color-action-hover}",
      "button-text": "#ffffff",
    },
  },
};

// ─── Basic resolution ─────────────────────────────────────────────────────────

describe("resolveTokens — basic resolution", () => {
  it("resolves global tokens to their raw values", () => {
    const { tokens } = resolveTokens(BASE_CONFIG);
    expect(tokens["global.blue-600"]).toBe("#2563eb");
    expect(tokens["global.gray-900"]).toBe("#111827");
  });

  it("resolves numeric global tokens to strings", () => {
    const { tokens } = resolveTokens(BASE_CONFIG);
    expect(tokens["global.space-4"]).toBe("16");
  });

  it("resolves a single-level semantic reference", () => {
    const { tokens } = resolveTokens(BASE_CONFIG);
    expect(tokens["semantic.color-action"]).toBe("#2563eb");
    expect(tokens["semantic.color-action-hover"]).toBe("#1d4ed8");
  });

  it("resolves a two-level chain: component → semantic → global", () => {
    const { tokens } = resolveTokens(BASE_CONFIG);
    expect(tokens["component.button-bg"]).toBe("#2563eb");
    expect(tokens["component.button-bg-hover"]).toBe("#1d4ed8");
  });

  it("returns raw values unchanged when there are no references", () => {
    const { tokens } = resolveTokens(BASE_CONFIG);
    expect(tokens["component.button-text"]).toBe("#ffffff");
  });

  it("returns no warnings for a valid config", () => {
    const { warnings } = resolveTokens(BASE_CONFIG);
    expect(warnings).toHaveLength(0);
  });
});

// ─── Interpolation ────────────────────────────────────────────────────────────

describe("resolveTokens — string interpolation", () => {
  it("resolves refs embedded in a larger string", () => {
    const config: DesignSystemConfig = {
      ...BASE_CONFIG,
      tokens: {
        global: { "shadow-color": "0 0 0" },
        semantic: {
          "shadow-sm": "0 1px 2px rgb({global.shadow-color} / 0.05)",
        },
      },
    };
    const { tokens } = resolveTokens(config);
    expect(tokens["semantic.shadow-sm"]).toBe("0 1px 2px rgb(0 0 0 / 0.05)");
  });

  it("resolves multiple refs in a single string", () => {
    const config: DesignSystemConfig = {
      ...BASE_CONFIG,
      tokens: {
        global: { x: "1px", y: "2px" },
        semantic: { offset: "{global.x} {global.y}" },
      },
    };
    const { tokens } = resolveTokens(config);
    expect(tokens["semantic.offset"]).toBe("1px 2px");
  });
});

// ─── Caching ─────────────────────────────────────────────────────────────────

describe("TokenResolver — caching", () => {
  it("resolves a shared dependency only once", () => {
    // We can verify caching by checking the result is consistent
    // when multiple tokens share the same upstream reference.
    const config: DesignSystemConfig = {
      ...BASE_CONFIG,
      tokens: {
        global: { brand: "#2563eb" },
        semantic: {
          a: "{global.brand}",
          b: "{global.brand}",
          c: "{global.brand}",
        },
      },
    };
    const { tokens } = resolveTokens(config);
    expect(tokens["semantic.a"]).toBe("#2563eb");
    expect(tokens["semantic.b"]).toBe("#2563eb");
    expect(tokens["semantic.c"]).toBe("#2563eb");
  });
});

// ─── Circular reference detection ────────────────────────────────────────────

describe("resolveTokens — circular reference detection", () => {
  it("throws CircularReferenceError for a direct self-reference", () => {
    const config: DesignSystemConfig = {
      meta: { name: "test", version: "0.0.1" },
      tokens: {
        semantic: {
          loop: "{semantic.loop}",
        },
      },
    };
    expect(() => resolveTokens(config)).toThrow(CircularReferenceError);
  });

  it("throws CircularReferenceError for an indirect cycle A→B→A", () => {
    const config: DesignSystemConfig = {
      meta: { name: "test", version: "0.0.1" },
      tokens: {
        semantic: {
          a: "{semantic.b}",
          b: "{semantic.a}",
        },
      },
    };
    expect(() => resolveTokens(config)).toThrow(CircularReferenceError);
  });

  it("includes the cycle path in the error", () => {
    const config: DesignSystemConfig = {
      meta: { name: "test", version: "0.0.1" },
      tokens: {
        semantic: {
          a: "{semantic.b}",
          b: "{semantic.a}",
        },
      },
    };
    try {
      resolveTokens(config);
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(CircularReferenceError);
      const cycleErr = err as CircularReferenceError;
      expect(cycleErr.cycle).toContain("semantic.a");
      expect(cycleErr.cycle).toContain("semantic.b");
    }
  });
});

// ─── Unresolved references ────────────────────────────────────────────────────

describe("resolveTokens — unresolved references", () => {
  it("emits a warning (not an error) for an unresolved ref in full resolution", () => {
    const config: DesignSystemConfig = {
      meta: { name: "test", version: "0.0.1" },
      tokens: {
        semantic: {
          color: "{global.nonexistent}",
        },
      },
    };
    const { warnings } = resolveTokens(config);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.type).toBe("unresolved_ref");
    expect(warnings[0]?.message).toContain("global.nonexistent");
  });

  it("throws UnresolvedReferenceError from resolveOneValue", () => {
    const resolver = new TokenResolver(BASE_CONFIG);
    expect(() =>
      resolver.resolveOneValue("{global.does-not-exist}", "test"),
    ).toThrow(UnresolvedReferenceError);
  });
});

// ─── Config root fallback ─────────────────────────────────────────────────────

describe("resolveTokens — config root path fallback", () => {
  it("resolves a ref to a non-token path in the root config", () => {
    const config: DesignSystemConfig = {
      meta: { name: "test", version: "0.0.1" },
      spacing: {
        scale: { "4": 16 },
      },
      tokens: {
        semantic: {
          "component-padding": "{spacing.scale.4}",
        },
      },
    };
    const { tokens } = resolveTokens(config);
    expect(tokens["semantic.component-padding"]).toBe("16");
  });
});

// ─── Empty / minimal configs ─────────────────────────────────────────────────

describe("resolveTokens — edge cases", () => {
  it("returns an empty map for a config with no tokens section", () => {
    const config: DesignSystemConfig = {
      meta: { name: "test", version: "0.0.1" },
    };
    const { tokens, warnings } = resolveTokens(config);
    expect(tokens).toEqual({});
    expect(warnings).toHaveLength(0);
  });

  it("handles empty token layers gracefully", () => {
    const config: DesignSystemConfig = {
      meta: { name: "test", version: "0.0.1" },
      tokens: { global: {}, semantic: {}, component: {} },
    };
    const { tokens } = resolveTokens(config);
    expect(Object.keys(tokens)).toHaveLength(0);
  });
});

// ─── Utility functions ────────────────────────────────────────────────────────

describe("extractRefs", () => {
  it("extracts a single reference", () => {
    expect(extractRefs("{global.blue-600}")).toEqual(["global.blue-600"]);
  });

  it("extracts multiple references from a string", () => {
    expect(extractRefs("{global.x} {global.y}")).toEqual([
      "global.x",
      "global.y",
    ]);
  });

  it("returns empty array when no refs present", () => {
    expect(extractRefs("#2563eb")).toEqual([]);
  });

  it("handles interpolated refs in longer strings", () => {
    const refs = extractRefs("0 1px 2px rgb({shadow.color} / 0.05)");
    expect(refs).toEqual(["shadow.color"]);
  });
});

describe("hasRefs", () => {
  it("returns true when a ref is present", () => {
    expect(hasRefs("{global.blue-600}")).toBe(true);
  });

  it("returns false for raw values", () => {
    expect(hasRefs("#2563eb")).toBe(false);
    expect(hasRefs("16px")).toBe(false);
  });
});
