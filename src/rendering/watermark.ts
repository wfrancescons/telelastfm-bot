import config from "@/config.ts";
import type {
  CanvasElement,
  GlassEffectOptions,
  MediaControlIconElement,
  RectangleElement,
  TextElement,
} from "@/rendering/renderCanvas.ts";
import {
  createGlassPillElement,
  DEFAULT_GLASS_OPTIONS,
  measureText,
} from "@/rendering/renderCanvas.ts";

export type WatermarkOptions = {
  canvasWidth: number;
  canvasHeight: number;
  bottomOffset?: number;
  glassOptions?: GlassEffectOptions;
  customUsername?: string;
};

export function createWatermarkElements({
  canvasWidth,
  canvasHeight,
  bottomOffset = 36,
  glassOptions,
  customUsername,
}: WatermarkOptions): CanvasElement[] {
  const elements: CanvasElement[] = [];

  const rawUsername =
    customUsername || config.bot.username || "telelastfmbot";
  const cleanUsername = rawUsername.replace(/^@/, "");
  const watermarkText = `t.me/${cleanUsername}`;

  // Proportional sizing based on canvas scale (designed around 1080px base)
  const scale = Math.max(0.65, Math.min(2.0, canvasWidth / 1080));

  const pillHeight = Math.round(38 * scale);
  const fontSize = Math.round(17 * scale);
  const iconSize = Math.round(18 * scale);
  const iconTextGap = Math.round(10 * scale);
  const paddingX = Math.round(19 * scale);

  const font = `${fontSize}px "NotoSans-Medium", sans-serif`;
  const textWidth = measureText(watermarkText, font).width;

  const totalContentWidth = iconSize + iconTextGap + textWidth;
  const pillWidth = totalContentWidth + paddingX * 2;

  const pillX = Math.round((canvasWidth - pillWidth) / 2);
  const pillY = Math.round(canvasHeight - bottomOffset - pillHeight);
  const pillCenterY = pillY + pillHeight / 2;

  const effectiveGlassOptions: GlassEffectOptions = {
    ...DEFAULT_GLASS_OPTIONS,
    frost: 2.5,
    tint: {
      color: "#000000",
      opacity: 0.28,
    },
    shadow: {
      color: "rgba(0, 0, 0, 0.4)",
      opacity: 0.35,
      blur: 10,
      offsetX: 0,
      offsetY: 4,
    },
    ...glassOptions,
  };

  // 1. Glass pill container
  const pillElement: RectangleElement = createGlassPillElement({
    x: pillX,
    y: pillY,
    width: pillWidth,
    height: pillHeight,
    options: effectiveGlassOptions,
  });
  elements.push(pillElement);

  // 2. Telegram paper airplane logo icon
  const iconCenterX = Math.round(pillX + paddingX + iconSize / 2);
  const iconElement: MediaControlIconElement = {
    type: "mediaControlIcon",
    icon: "telegram",
    cx: iconCenterX,
    cy: pillCenterY,
    size: iconSize,
    fillStyle: "#ffffff",
    shadow: {
      color: "rgba(0, 0, 0, 0.5)",
      offsetX: 0,
      offsetY: 1,
      blur: 3,
    },
  };
  elements.push(iconElement);

  // 3. Text "t.me/telelastfmbot"
  const textStartX = Math.round(pillX + paddingX + iconSize + iconTextGap);
  const textElement: TextElement = {
    type: "text",
    text: watermarkText,
    x: textStartX,
    y: Math.round(pillCenterY + fontSize * 0.35),
    font,
    fillStyle: "#ffffff",
    align: "left",
    shadow: {
      color: "rgba(0, 0, 0, 0.6)",
      offsetX: 0,
      offsetY: 1,
      blur: 4,
    },
    maxWidth: textWidth + 10,
    maxLines: 1,
  };
  elements.push(textElement);

  return elements;
}

export default createWatermarkElements;

