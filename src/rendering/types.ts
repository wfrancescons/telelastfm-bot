export type CanvasTextAlign = "left" | "right" | "center" | "start" | "end";

export type GlobalCompositeOperation =
  | "source-over"
  | "source-in"
  | "source-out"
  | "source-atop"
  | "destination-over"
  | "destination-in"
  | "destination-out"
  | "destination-atop"
  | "lighter"
  | "copy"
  | "xor"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity"
  | string;

export type ColorStop = {
  stop: number;
  color: string;
};

export type LinearGradientStyle = {
  type: "linearGradient";
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  colors: ColorStop[];
};

export type RadialGradientStyle = {
  type: "radialGradient";
  x0: number;
  y0: number;
  r0: number;
  x1: number;
  y1: number;
  r1: number;
  colors: ColorStop[];
};

export type ShadowStyle = {
  color?: string;
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  opacity?: number;
};

export type GlowStyle = {
  color?: string;
  intensity?: number;
  radius?: number;
  angle?: number;
};

export type GlassLightOptions = {
  /** Light incidence angle in degrees (default: -45, top-left to bottom-right) */
  angle?: number;
  /** Specular rim & surface light intensity (0 to 1, default: 0.8) */
  intensity?: number;
};

export type GlassTintOptions = {
  /** Translucent tint color (e.g., "#ffffff", "#000000") */
  color?: string;
  /** Tint opacity (0 to 1) */
  opacity?: number;
};

export type GlassEffectOptions = {
  /** Light control (angle and intensity for directional border & highlight) */
  light?: GlassLightOptions;
  /** Optical refraction intensity (0 to 2, default: 0.8) */
  refraction?: number;
  /** Lens depth / edge bevel curvature (1 to 50, default: 6) */
  depth?: number;
  /** Chromatic dispersion / RGB color splitting at edges (0 to 1, default: 0.05) */
  dispersion?: number;
  /** Frosted glass blur intensity (0 to 50, default: 0) */
  frost?: number;
  /** Translucent glass tint */
  tint?: GlassTintOptions;
  /** Drop shadow cast behind the glass */
  shadow?: ShadowStyle;
};

export type GlassOptions = GlassEffectOptions;

export type GlassElementStyle = {
  type: "glass";
  options?: GlassEffectOptions;
};

export type ElementEffects = {
  shadow?: ShadowStyle;
  glow?: GlowStyle;
  filter?: string;
  opacity?: number;
  composite?: GlobalCompositeOperation;
};

export type ImageElement = {
  type: "image" | "icon";
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  objectFit?: "fill" | "cover";
  borderRadius?: number;
  /** Optional rotation in degrees around the center of the image */
  rotation?: number;
  filter?: string;
  composite?: GlobalCompositeOperation;
  opacity?: number;
  shadow?: ShadowStyle;
  effects?: ElementEffects;
};

export type RectangleElement = {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  /** Corner border radius (0 for sharp rectangle) */
  borderRadius?: number;
  /** Optional rotation in degrees around the center of the rectangle */
  rotation?: number;
  fillStyle?: string | LinearGradientStyle | RadialGradientStyle;
  style?: GlassElementStyle;
  shadow?: ShadowStyle;
  effects?: ElementEffects;
};

export type CircleElement = {
  type: "circle";
  /** X coordinate (center by default, or top-left corner if anchor === 'top-left') */
  x: number;
  /** Y coordinate (center by default, or top-left corner if anchor === 'top-left') */
  y: number;
  width: number;
  height: number;
  /** Defines whether (x, y) represents the 'center' (default) or 'top-left' */
  anchor?: "center" | "top-left";
  fillStyle?: string | LinearGradientStyle | RadialGradientStyle;
  style?: GlassElementStyle;
  shadow?: ShadowStyle;
  effects?: ElementEffects;
};

export type MediaControlIconElement = {
  type: "mediaControlIcon";
  icon: "play" | "pause" | "prev" | "next" | "telegram";
  /** Center X coordinate */
  cx: number;
  /** Center Y coordinate */
  cy: number;
  /** Icon bounding size */
  size: number;
  fillStyle?: string;
  shadow?: ShadowStyle;
  effects?: ElementEffects;
};

export type TextVibrancyMode = "primary" | "secondary";

export type TextElement = {
  type: "text";
  text: string;
  x: number;
  y: number;
  font?: string;
  fillStyle?: string;
  shadow?: ShadowStyle;
  maxWidth?: number;
  lineHeight?: number;
  align?: CanvasTextAlign;
  maxLines?: number;
  vibrancy?: TextVibrancyMode;
  effects?: ElementEffects;
};

export type VinylDiscElement = {
  type: "vinylDisc";
  /** Center X coordinate */
  cx: number;
  /** Center Y coordinate */
  cy: number;
  /** Outer diameter of the vinyl record */
  diameter: number;
  /** Optional cover artwork image URL to render cropped in a circle on the center label */
  labelImage?: string;
  /** Primary title printed on the classic cream center label (when labelImage is not used) */
  labelTitle?: string;
  /** Secondary subtitle (artist) printed on the center label (when labelImage is not used) */
  labelSubtitle?: string;
  /** Rotation angle of the center label in degrees (default: -12) */
  labelRotation?: number;
  shadow?: ShadowStyle;
  effects?: ElementEffects;
};

export type TonearmElement = {
  type: "tonearm";
  /** Pivot center X coordinate */
  pivotX: number;
  /** Pivot center Y coordinate */
  pivotY: number;
  /** Overall vertical length of the tonearm assembly */
  length: number;
  /** Arm angle in degrees (0 = straight down, positive = angled toward the left/record) */
  angle?: number;
  glassOptions?: GlassEffectOptions;
  shadow?: ShadowStyle;
  effects?: ElementEffects;
};

export type CanvasElement =
  | ImageElement
  | RectangleElement
  | CircleElement
  | MediaControlIconElement
  | TextElement
  | VinylDiscElement
  | TonearmElement;

export type CanvasTemplateData = {
  type: string;
  width: number;
  height: number;
  background?: string;
  elements: CanvasElement[];
};

