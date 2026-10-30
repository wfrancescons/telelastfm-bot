export type RGBAColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export function parseColor(colorStr?: string, defaultAlpha = 1): RGBAColor {
  if (!colorStr) {
    return { r: 255, g: 255, b: 255, a: defaultAlpha };
  }

  const trimmed = colorStr.trim().toLowerCase();

  if (trimmed === "white") return { r: 255, g: 255, b: 255, a: defaultAlpha };
  if (trimmed === "black") return { r: 0, g: 0, b: 0, a: defaultAlpha };
  if (trimmed === "transparent") return { r: 0, g: 0, b: 0, a: 0 };

  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b, a: defaultAlpha };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b, a: defaultAlpha };
    }
    if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return { r, g, b, a: a * defaultAlpha };
    }
  }

  const rgbaMatch = trimmed.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/,
  );
  if (rgbaMatch) {
    const r = Number(rgbaMatch[1]);
    const g = Number(rgbaMatch[2]);
    const b = Number(rgbaMatch[3]);
    const a = rgbaMatch[4] !== undefined ? Number(rgbaMatch[4]) : defaultAlpha;
    return { r, g, b, a };
  }

  return { r: 255, g: 255, b: 255, a: defaultAlpha };
}

export function clamp(val: number, min: number, max: number): number {
  return val < min ? min : val > max ? max : val;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
}

