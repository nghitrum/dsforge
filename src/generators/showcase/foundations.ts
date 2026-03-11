import type { DesignSystemConfig } from "../../types/index";
import { esc, isHex, textOnColor } from "./types";

export function buildColorSection(
  config: DesignSystemConfig,
  tokens: Record<string, string>,
): string {
  const groups: Array<{
    title: string;
    items: Array<{ name: string; value: string }>;
  }> = [];

  const globalEntries = Object.entries(config.tokens?.global ?? {})
    .filter(([, v]) => isHex(String(v)))
    .map(([k, v]) => ({ name: k, value: String(v) }));
  if (globalEntries.length)
    groups.push({ title: "Global Palette", items: globalEntries });

  const semanticEntries = Object.entries(tokens)
    .filter(([k, v]) => k.startsWith("semantic.color") && isHex(v))
    .map(([k, v]) => ({ name: k.replace("semantic.", ""), value: v }));
  if (semanticEntries.length)
    groups.push({ title: "Semantic Colors", items: semanticEntries });

  return groups
    .map(
      ({ title, items }) => `
    <div class="section-block">
      <h3 class="group-title">${esc(title)}</h3>
      <div class="swatch-grid">
        ${items
          .map(
            ({ name, value }) => `
          <div class="swatch" style="background:${value};color:${textOnColor(value)}">
            <span class="swatch-name">${esc(name)}</span>
            <span class="swatch-value">${esc(value)}</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `,
    )
    .join("");
}

export function buildTypographySection(config: DesignSystemConfig): string {
  const roles = config.typography?.roles ?? {};
  const ff = config.typography?.fontFamily ?? "system-ui, sans-serif";

  return `
    <div class="section-block">
      <h3 class="group-title">Font Family</h3>
      <div class="type-family">${esc(ff)}</div>
    </div>
    <div class="section-block">
      <h3 class="group-title">Type Scale</h3>
      <div class="type-scale">
        ${Object.entries(roles)
          .map(([role, def]) => {
            const size =
              typeof def === "object" && def !== null
                ? (def as unknown as Record<string, unknown>)["size"]
                : 16;
            const weight =
              typeof def === "object" && def !== null
                ? (def as unknown as Record<string, unknown>)["weight"]
                : 400;
            const lh =
              typeof def === "object" && def !== null
                ? (def as unknown as Record<string, unknown>)["lineHeight"]
                : 1.5;
            return `
            <div class="type-row">
              <div class="type-meta">
                <span class="type-role">${esc(role)}</span>
                <span class="type-spec">${size}px / ${weight} / lh ${lh}</span>
              </div>
              <div class="type-sample" style="font-size:${size}px;font-weight:${weight};line-height:${lh};font-family:${esc(ff)}">
                The quick brown fox
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
  `;
}

export function buildSpacingSection(config: DesignSystemConfig): string {
  const scale = config.spacing?.scale ?? {};

  // Bars use CSS vars so they live-update when data-density changes.
  const scaleRow = (key: string) => `
    <div class="spacing-row">
      <span class="spacing-key">spacing-${esc(key)}</span>
      <div class="spacing-bar-wrap">
        <div class="spacing-bar" style="width:min(calc(var(--spacing-${esc(key)}) * 2), 320px)"></div>
      </div>
      <span class="spacing-val" data-spacing-var="--spacing-${esc(key)}"></span>
    </div>`;

  const semanticRow = (key: string) => `
    <div class="spacing-row">
      <span class="spacing-key">${esc(key)}</span>
      <div class="spacing-bar-wrap">
        <div class="spacing-bar" style="width:min(calc(var(--${esc(key)}) * 2), 320px)"></div>
      </div>
      <span class="spacing-val" data-spacing-var="--${esc(key)}"></span>
    </div>`;

  return `
    <div class="section-block">
      <h3 class="group-title">Scale</h3>
      <div class="spacing-list">
        ${Object.keys(scale).map((k) => scaleRow(k)).join("")}
      </div>
    </div>
    <div class="section-block">
      <h3 class="group-title">Semantic Spacing</h3>
      <div class="spacing-list">
        ${Object.keys(config.spacing?.semantic ?? {}).map((k) => semanticRow(k)).join("")}
      </div>
    </div>
  `;
}

export function buildRadiusSection(config: DesignSystemConfig): string {
  const radius = config.radius ?? {};
  return `
    <div class="section-block">
      <h3 class="group-title">Border Radius</h3>
      <div class="radius-grid">
        ${Object.keys(radius)
          .map(
            (key) => `
          <div class="radius-item">
            <div class="radius-box" style="border-radius:var(--radius-${esc(key)})"></div>
            <span class="radius-key">${esc(key)}</span>
            <span class="radius-val" data-spacing-var="--radius-${esc(key)}"></span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

export function buildElevationSection(config: DesignSystemConfig): string {
  const elevation = config.elevation ?? {};
  return `
    <div class="section-block">
      <h3 class="group-title">Elevation</h3>
      <div class="elevation-grid">
        ${Object.entries(elevation)
          .map(
            ([key, val]) => `
          <div class="elevation-item">
            <div class="elevation-box" style="box-shadow:${val === "none" ? "none" : val}"></div>
            <span class="elevation-key">Level ${esc(key)}</span>
            <span class="elevation-val">${esc(String(val))}</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

export function buildMotionSection(config: DesignSystemConfig): string {
  const duration = config.motion?.duration ?? {};
  const easing = config.motion?.easing ?? {};

  const dot = (transitionStyle: string, onclick: string) => `
    <div class="motion-track" onclick="${onclick}">
      <div class="motion-dot" style="transition:${transitionStyle}"></div>
    </div>`;

  return `
    <div class="section-block">
      <h3 class="group-title">Duration</h3>
      <div class="motion-grid">
        ${Object.entries(duration)
          .map(
            ([key, val]) => `
          <div class="motion-item" onclick="this.querySelector('.motion-dot').style.transform='translateX(120px)';setTimeout(()=>this.querySelector('.motion-dot').style.transform='',${val}+50)">
            ${dot(`transform ${val}ms linear`, "")}
            <span class="motion-key">${esc(key)}</span>
            <span class="motion-val">${val}ms</span>
            <span class="motion-hint">click to preview</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
    <div class="section-block">
      <h3 class="group-title">Easing</h3>
      <div class="motion-grid">
        ${Object.entries(easing)
          .map(
            ([key, val]) => `
          <div class="motion-item" onclick="this.querySelector('.motion-dot').style.transform='translateX(120px)';setTimeout(()=>this.querySelector('.motion-dot').style.transform='',500)">
            ${dot(`transform 500ms ${val}`, "")}
            <span class="motion-key">${esc(key)}</span>
            <span class="motion-val">${esc(String(val))}</span>
            <span class="motion-hint">click to preview</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}
