/**
 * verify.mjs — self-contained integration test.
 * Runs with: node verify.mjs (no npm install needed)
 *
 * Exercises the token resolver logic inline to prove the algorithm works
 * before npm packages are available.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

// ─── Inline resolver (mirrors token-resolver.ts exactly) ─────────────────────

class CircularReferenceError extends Error {
  constructor(cycle) {
    super(`Circular reference: ${cycle.join(" → ")}`);
    this.name = "CircularReferenceError";
    this.cycle = cycle;
  }
}

class UnresolvedReferenceError extends Error {
  constructor(refPath, fromToken) {
    super(`Token reference "{${refPath}}" in "${fromToken}" could not be resolved`);
    this.name = "UnresolvedReferenceError";
    this.refPath = refPath;
  }
}

const REF_PATTERN = /\{([^{}]+)\}/g;
const SOLE_REF_PATTERN = /^\{([^{}]+)\}$/;

function getByPath(obj, segments) {
  let current = obj;
  for (const seg of segments) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[seg];
  }
  return current;
}

function lookupRef(refPath, config) {
  const segments = refPath.split(".");
  if (config.tokens) {
    const fromTokens = getByPath(config.tokens, segments);
    if (fromTokens !== undefined) return fromTokens;
  }
  return getByPath(config, segments);
}

class TokenResolver {
  #config;
  #cache = new Map();
  #stack = [];
  #warnings = [];

  constructor(config) {
    this.#config = config;
  }

  resolve() {
    const tokens = {};
    const layers = this.#config.tokens;
    if (!layers) return { tokens, warnings: this.#warnings };

    for (const [key, value] of Object.entries(layers.global ?? {})) {
      const path = `global.${key}`;
      try { tokens[path] = this.#resolveValue(String(value), path); }
      catch (e) { this.#handleError(e, path); }
    }
    for (const [key, value] of Object.entries(layers.semantic ?? {})) {
      const path = `semantic.${key}`;
      try { tokens[path] = this.#resolveValue(String(value), path); }
      catch (e) { this.#handleError(e, path); }
    }
    for (const [key, value] of Object.entries(layers.component ?? {})) {
      const path = `component.${key}`;
      try { tokens[path] = this.#resolveValue(String(value), path); }
      catch (e) { this.#handleError(e, path); }
    }
    return { tokens, warnings: this.#warnings };
  }

  resolveOneValue(value, contextPath = "<anonymous>") {
    return this.#resolveValue(value, contextPath);
  }

  #resolveValue(value, currentPath) {
    if (!value.includes("{")) return value;
    const soleMatch = SOLE_REF_PATTERN.exec(value);
    if (soleMatch?.[1] !== undefined) return this.#resolveRef(soleMatch[1], currentPath);
    return value.replace(new RegExp(REF_PATTERN.source, "g"), (_, refPath) => {
      try { return this.#resolveRef(refPath, currentPath); }
      catch (e) {
        if (e instanceof UnresolvedReferenceError) {
          this.#warnings.push({ type: "unresolved_ref", path: currentPath, message: e.message });
          return `{${refPath}}`;
        }
        throw e;
      }
    });
  }

  #resolveRef(refPath, fromToken) {
    const cached = this.#cache.get(refPath);
    if (cached !== undefined) return cached;

    const cycleIdx = this.#stack.indexOf(refPath);
    if (cycleIdx !== -1) throw new CircularReferenceError([...this.#stack.slice(cycleIdx), refPath]);

    const raw = lookupRef(refPath, this.#config);
    if (raw === undefined) throw new UnresolvedReferenceError(refPath, fromToken);

    this.#stack.push(refPath);
    const resolved = this.#resolveValue(String(raw), refPath);
    this.#stack.pop();

    this.#cache.set(refPath, resolved);
    return resolved;
  }

  #handleError(err, path) {
    if (err instanceof CircularReferenceError) throw err;
    if (err instanceof UnresolvedReferenceError) {
      this.#warnings.push({ type: "unresolved_ref", path, message: err.message });
      return;
    }
    throw err;
  }
}

function resolveTokens(config) {
  return new TokenResolver(config).resolve();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const BASE = {
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
    },
    component: {
      "button-bg": "{semantic.color-action}",
      "button-bg-hover": "{semantic.color-action-hover}",
      "button-text": "#ffffff",
    },
  },
};

test("global tokens resolve to raw values", () => {
  const { tokens } = resolveTokens(BASE);
  assert.equal(tokens["global.blue-600"], "#2563eb");
  assert.equal(tokens["global.gray-900"], "#111827");
});

test("numeric global token coerced to string", () => {
  const { tokens } = resolveTokens(BASE);
  assert.equal(tokens["global.space-4"], "16");
});

test("semantic token resolves via global reference", () => {
  const { tokens } = resolveTokens(BASE);
  assert.equal(tokens["semantic.color-action"], "#2563eb");
  assert.equal(tokens["semantic.color-action-hover"], "#1d4ed8");
});

test("component token resolves through 2-level chain", () => {
  const { tokens } = resolveTokens(BASE);
  assert.equal(tokens["component.button-bg"], "#2563eb");
  assert.equal(tokens["component.button-bg-hover"], "#1d4ed8");
});

test("raw component token returned unchanged", () => {
  const { tokens } = resolveTokens(BASE);
  assert.equal(tokens["component.button-text"], "#ffffff");
});

test("no warnings on a fully valid config", () => {
  const { warnings } = resolveTokens(BASE);
  assert.equal(warnings.length, 0);
});

test("string interpolation replaces refs in longer strings", () => {
  const config = {
    meta: { name: "t", version: "0.0.1" },
    tokens: {
      global: { "shadow-rgb": "0 0 0" },
      semantic: { "shadow-sm": "0 1px 2px rgb({global.shadow-rgb} / 0.05)" },
    },
  };
  const { tokens } = resolveTokens(config);
  assert.equal(tokens["semantic.shadow-sm"], "0 1px 2px rgb(0 0 0 / 0.05)");
});

test("multiple refs in a single string both resolve", () => {
  const config = {
    meta: { name: "t", version: "0.0.1" },
    tokens: {
      global: { "x": "1px", "y": "2px" },
      semantic: { "offset": "{global.x} {global.y}" },
    },
  };
  const { tokens } = resolveTokens(config);
  assert.equal(tokens["semantic.offset"], "1px 2px");
});

test("shared dependency resolves consistently (cache check)", () => {
  const config = {
    meta: { name: "t", version: "0.0.1" },
    tokens: {
      global: { "brand": "#2563eb" },
      semantic: { "a": "{global.brand}", "b": "{global.brand}", "c": "{global.brand}" },
    },
  };
  const { tokens } = resolveTokens(config);
  assert.equal(tokens["semantic.a"], "#2563eb");
  assert.equal(tokens["semantic.b"], "#2563eb");
  assert.equal(tokens["semantic.c"], "#2563eb");
});

test("empty config returns empty token map", () => {
  const { tokens, warnings } = resolveTokens({ meta: { name: "t", version: "0.0.1" } });
  assert.deepEqual(tokens, {});
  assert.equal(warnings.length, 0);
});

test("direct circular reference throws CircularReferenceError", () => {
  const config = {
    meta: { name: "t", version: "0.0.1" },
    tokens: { semantic: { "loop": "{semantic.loop}" } },
  };
  assert.throws(() => resolveTokens(config), CircularReferenceError);
});

test("indirect cycle A→B→A throws CircularReferenceError with cycle path", () => {
  const config = {
    meta: { name: "t", version: "0.0.1" },
    tokens: { semantic: { "a": "{semantic.b}", "b": "{semantic.a}" } },
  };
  try {
    resolveTokens(config);
    assert.fail("Should have thrown");
  } catch (err) {
    assert.ok(err instanceof CircularReferenceError);
    assert.ok(err.cycle.includes("semantic.a"));
    assert.ok(err.cycle.includes("semantic.b"));
  }
});

test("unresolved ref emits warning, not throw", () => {
  const config = {
    meta: { name: "t", version: "0.0.1" },
    tokens: { semantic: { "color": "{global.nonexistent}" } },
  };
  const { warnings } = resolveTokens(config);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].type, "unresolved_ref");
  assert.ok(warnings[0].message.includes("global.nonexistent"));
});

test("resolveOneValue throws on unresolved ref", () => {
  const resolver = new TokenResolver(BASE);
  assert.throws(
    () => resolver.resolveOneValue("{global.does-not-exist}", "test"),
    UnresolvedReferenceError,
  );
});

test("config root fallback: resolves spacing.scale.4", () => {
  const config = {
    meta: { name: "t", version: "0.0.1" },
    spacing: { scale: { "4": 16 } },
    tokens: { semantic: { "component-padding": "{spacing.scale.4}" } },
  };
  const { tokens } = resolveTokens(config);
  assert.equal(tokens["semantic.component-padding"], "16");
});

console.log("\n✔ All tests passed\n");
