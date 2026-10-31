import type {
  CircleElement,
  GlassEffectOptions,
  ImageElement,
  MediaControlIconElement,
  RectangleElement,
  TextElement,
  TonearmElement,
  VinylDiscElement,
} from "./types.ts";

export const DEFAULT_GLASS_OPTIONS: GlassEffectOptions = {
  light: {
    angle: -45,
    intensity: 0.55,
  },
  refraction: 2.5,
  depth: 5,
  dispersion: 0.5,
  frost: 1,
  tint: {
    color: "#000000",
    opacity: 0.15,
  },
  shadow: {
    color: "#000000",
    opacity: 0.1,
    blur: 10,
    offsetX: 2,
    offsetY: 2,
  },
};

export type CreateImageElementParams = Omit<ImageElement, "type">;

export function createImageElement(
  params: CreateImageElementParams,
): ImageElement {
  return {
    type: "image",
    ...params,
  };
}

export type CreateRectangleElementParams = Omit<RectangleElement, "type">;

export function createRectangleElement(
  params: CreateRectangleElementParams,
): RectangleElement {
  return {
    type: "rectangle",
    ...params,
  };
}

export type CreateCircleElementParams = Omit<CircleElement, "type">;

export function createCircleElement(
  params: CreateCircleElementParams,
): CircleElement {
  return {
    type: "circle",
    ...params,
  };
}

export type CreateTextElementParams = Omit<TextElement, "type">;

export function createTextElement(
  params: CreateTextElementParams,
): TextElement {
  return {
    type: "text",
    ...params,
  };
}

export type CreateMediaControlIconParams = Omit<
  MediaControlIconElement,
  "type"
>;

export function createMediaControlIcon(
  params: CreateMediaControlIconParams,
): MediaControlIconElement {
  return {
    type: "mediaControlIcon",
    ...params,
    fillStyle: params.fillStyle ?? "#ffffff",
  };
}

export type CreateVinylDiscParams = Omit<VinylDiscElement, "type">;

export function createVinylDiscElement(
  params: CreateVinylDiscParams,
): VinylDiscElement {
  return {
    type: "vinylDisc",
    ...params,
  };
}

export type CreateTonearmParams = Omit<TonearmElement, "type">;

export function createTonearmElement(
  params: CreateTonearmParams,
): TonearmElement {
  return {
    type: "tonearm",
    ...params,
  };
}

export type CreateGlassCircleParams = {

  cx: number;
  cy: number;
  diameter: number;
  options?: GlassEffectOptions;
  shadow?: CircleElement["shadow"];
  effects?: CircleElement["effects"];
};

export function createGlassCircleElement({
  cx,
  cy,
  diameter,
  options,
  shadow,
  effects,
}: CreateGlassCircleParams): CircleElement {
  return {
    type: "circle",
    x: cx,
    y: cy,
    width: diameter,
    height: diameter,
    style: {
      type: "glass",
      options: {
        ...DEFAULT_GLASS_OPTIONS,
        ...options,
      },
    },
    shadow,
    effects,
  };
}

export type CreateGlassPillParams = {
  x: number;
  y: number;
  width: number;
  height: number;
  options?: GlassEffectOptions;
  borderRadius?: number;
  shadow?: RectangleElement["shadow"];
  effects?: RectangleElement["effects"];
};

export function createGlassPillElement({
  x,
  y,
  width,
  height,
  options,
  borderRadius,
  shadow,
  effects,
}: CreateGlassPillParams): RectangleElement {
  return {
    type: "rectangle",
    x,
    y,
    width,
    height,
    borderRadius: borderRadius ?? height / 2,
    style: {
      type: "glass",
      options: {
        ...DEFAULT_GLASS_OPTIONS,
        ...options,
      },
    },
    shadow,
    effects,
  };
}

export type CreateGradientRectangleParams = {
  x: number;
  y: number;
  width: number;
  height: number;
  gradientHeight: number;
  direction?: "bottom" | "top";
  borderRadius?: number;
  colors?: Array<{ stop: number; color: string }>;
};

export function createGradientRectangle({
  x,
  y,
  width,
  height,
  gradientHeight,
  direction = "bottom",
  borderRadius,
  colors,
}: CreateGradientRectangleParams): RectangleElement {
  const isBottom = direction === "bottom";
  const startY = isBottom ? y + height - gradientHeight : y;
  const endY = isBottom ? y + height : y + gradientHeight;

  const defaultColors = isBottom
    ? [
      { stop: 0, color: "rgba(14, 14, 14, 0)" },
      { stop: 0.4, color: "rgba(14, 14, 14, 0.25)" },
      { stop: 0.75, color: "rgba(14, 14, 14, 0.5)" },
      { stop: 1, color: "rgba(14, 14, 14, 0.75)" },
    ]
    : [
      { stop: 0, color: "rgba(14, 14, 14, 0.75)" },
      { stop: 0.25, color: "rgba(14, 14, 14, 0.5)" },
      { stop: 0.6, color: "rgba(14, 14, 14, 0.25)" },
      { stop: 1, color: "rgba(14, 14, 14, 0)" },
    ];

  return createRectangleElement({
    x,
    y: startY,
    width,
    height: gradientHeight,
    borderRadius,
    fillStyle: {
      type: "linearGradient",
      x0: x,
      y0: startY,
      x1: x,
      y1: endY,
      colors: colors ?? defaultColors,
    },
  });
}
