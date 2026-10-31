import { Canvas, type CanvasRenderingContext2D } from "skia-canvas";
import { withContextEffects } from "../effects/contextEffects.ts";
import { ensureFontsRegistered } from "../fonts.ts";
import type { TextElement, TextVibrancyMode } from "../types.ts";

let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D {
  if (!measureCtx) {
    ensureFontsRegistered();
    const measureCanvas = new Canvas(1, 1, { gpu: false });
    measureCtx = measureCanvas.getContext("2d");
  }
  return measureCtx;
}

export function measureText(
  text: string,
  font?: string,
): { width: number } {
  const ctx = getMeasureContext();
  if (font) ctx.font = font;
  const metrics = ctx.measureText(text);
  return { width: Math.ceil(metrics.width) };
}

export function getTextLines(
  text: string,
  maxWidth?: number,
  maxLines: number = 2,
  font?: string,
): string[] {
  const ctx = getMeasureContext();
  if (font) ctx.font = font;
  return wrapText(ctx, text, maxWidth, Math.min(maxLines, 2));
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth?: number,
  maxLines: number = 2,
): string[] {
  const effectiveMaxLines = Math.min(maxLines ?? 2, 2);
  if (!maxWidth) return [text];
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(" ").filter(Boolean);
    if (!words.length) continue;
    let currentLine = words[0];

    let wordIdx = 1;
    while (wordIdx < words.length) {
      if (effectiveMaxLines && lines.length === effectiveMaxLines - 1) {
        break;
      }
      const word = words[wordIdx];
      const testLine = currentLine + " " + word;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
        wordIdx++;
      } else {
        lines.push(currentLine);
        currentLine = word;
        wordIdx++;
      }
    }

    if (effectiveMaxLines && lines.length === effectiveMaxLines - 1) {
      let lastLine = currentLine;
      let hasOverflow = false;

      while (wordIdx < words.length) {
        const word = words[wordIdx];
        const testLine = lastLine ? lastLine + " " + word : word;
        if (ctx.measureText(testLine).width <= maxWidth) {
          lastLine = testLine;
          wordIdx++;
        } else {
          hasOverflow = true;
          break;
        }
      }

      if (hasOverflow || wordIdx < words.length) {
        while (
          lastLine.length > 0 &&
          ctx.measureText(lastLine + "...").width > maxWidth
        ) {
          const spaceIdx = lastLine.lastIndexOf(" ");
          if (spaceIdx > 0) {
            lastLine = lastLine.slice(0, spaceIdx);
          } else {
            lastLine = lastLine.slice(0, -1);
          }
        }
        lastLine = lastLine.replace(/[\s,.;:!?\-–—]+$/, "") + "...";
      }

      lines.push(lastLine);
      return lines;
    }

    lines.push(currentLine);
  }

  return effectiveMaxLines ? lines.slice(0, effectiveMaxLines) : lines;
}

function clamp(val: number, min: number, max: number): number {
  return val < min ? min : val > max ? max : val;
}

function parseFontSizePx(font?: string): number {
  if (!font) return 24;
  const match = font.match(/(\d+(?:\.\d+)?)px/);
  return match ? parseFloat(match[1]) : 24;
}

function drawVibrantText(
  ctx: CanvasRenderingContext2D,
  element: TextElement,
  mode: TextVibrancyMode,
): void {
  const font = element.font || "24px sans-serif";
  const fontSize = parseFontSizePx(font);
  const align = element.align || "left";
  const lineHeight = element.lineHeight || Math.round(fontSize * 1.15);

  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;

  const lines = wrapText(
    ctx,
    element.text,
    element.maxWidth,
    element.maxLines ?? 2,
  );
  if (!lines.length) {
    ctx.restore();
    return;
  }

  let maxLineWidth = 0;
  for (const line of lines) {
    const w = Math.ceil(ctx.measureText(line).width);
    if (w > maxLineWidth) maxLineWidth = w;
  }

  let leftX = element.x;
  if (align === "center") leftX = element.x - maxLineWidth / 2;
  else if (align === "right" || align === "end") {
    leftX = element.x - maxLineWidth;
  }

  const topBaselineY = element.y - (lines.length - 1) * lineHeight;
  const pad = Math.ceil(fontSize * 0.25) + 8;

  const canvasW = ctx.canvas.width;
  const canvasH = ctx.canvas.height;

  const boxX = clamp(Math.floor(leftX - pad), 0, canvasW - 1);
  const boxY = clamp(
    Math.floor(topBaselineY - fontSize * 1.05 - pad),
    0,
    canvasH - 1,
  );
  const boxW = clamp(
    Math.ceil(maxLineWidth + pad * 2),
    1,
    canvasW - boxX,
  );
  const boxH = clamp(
    Math.ceil((lines.length - 1) * lineHeight + fontSize * 1.35 + pad * 2),
    1,
    canvasH - boxY,
  );

  // 1. Sample the underlying blurred backdrop (smooth local color field, no 3D refraction)
  const backdropCanvas = new Canvas(boxW, boxH, { gpu: false });
  const bctx = backdropCanvas.getContext("2d");
  bctx.filter = "blur(10px) saturate(165%)";
  bctx.drawImage(
    ctx.canvas,
    boxX,
    boxY,
    boxW,
    boxH,
    0,
    0,
    boxW,
    boxH,
  );
  bctx.filter = "none";
  const backdropData = bctx.getImageData(0, 0, boxW, boxH).data;

  // 2. Render clean, flat anti-aliased glyph mask
  const maskCanvas = new Canvas(boxW, boxH, { gpu: false });
  const mctx = maskCanvas.getContext("2d");
  mctx.font = font;
  mctx.textAlign = align;
  mctx.fillStyle = "#ffffff";
  lines.forEach((line, i) => {
    const lineY = element.y - (lines.length - 1 - i) * lineHeight;
    mctx.fillText(line, element.x - boxX, lineY - boxY);
  });
  const maskData = mctx.getImageData(0, 0, boxW, boxH).data;

  // 3. Apply flat vibrancy effect color matrix + screen/plus-lighter blend per pixel
  const outCanvas = new Canvas(boxW, boxH, { gpu: false });
  const octx = outCanvas.getContext("2d");
  const outImg = octx.createImageData(boxW, boxH);
  const outData = outImg.data;

  for (let i = 0; i < maskData.length; i += 4) {
    const maskA = maskData[i + 3];
    if (maskA === 0) continue;

    const coverage = maskA / 255;
    const bgR = backdropData[i];
    const bgG = backdropData[i + 1];
    const bgB = backdropData[i + 2];

    const mean = (bgR + bgG + bgB) / 3;
    const dR = bgR - mean;
    const dG = bgG - mean;
    const dB = bgB - mean;

    // Limit extreme chroma excursions so vibrancy stays a clean pastel/translucent tint
    const maxChroma = Math.max(Math.abs(dR), Math.abs(dG), Math.abs(dB), 1);
    const chromaScale = maxChroma > 42 ? 42 / maxChroma : 1;
    const cR = dR * chromaScale;
    const cG = dG * chromaScale;
    const cB = dB * chromaScale;

    if (mode === "primary") {
      // Primary Vibrancy ("august"):
      // Bright, flat pastel vibrancy (high luminance + subtle local background chroma lift)
      const baseL = clamp(202 + mean * 0.26, 204, 240);
      const gain = 1.35;

      outData[i] = Math.round(clamp(baseL + cR * gain, 0, 255));
      outData[i + 1] = Math.round(clamp(baseL + cG * gain, 0, 255));
      outData[i + 2] = Math.round(clamp(baseL + cB * gain, 0, 255));
      outData[i + 3] = Math.round(clamp(coverage * 0.95 * 255, 0, 255));
    } else {
      // Secondary Vibrancy ("2026"):
      // Softer, translucent vibrancy blend (absorbs background luminance & hue without 3D borders)
      const baseL = clamp(128 + mean * 0.44, 132, 205);
      const gain = 1.25;

      outData[i] = Math.round(clamp(baseL + cR * gain, 0, 255));
      outData[i + 1] = Math.round(clamp(baseL + cG * gain, 0, 255));
      outData[i + 2] = Math.round(clamp(baseL + cB * gain, 0, 255));
      outData[i + 3] = Math.round(clamp(coverage * 0.64 * 255, 0, 255));
    }
  }

  octx.putImageData(outImg, 0, 0);
  ctx.drawImage(outCanvas, boxX, boxY);
  ctx.restore();
}

export async function drawText(
  ctx: CanvasRenderingContext2D,
  element: TextElement,
): Promise<void> {
  if (element.vibrancy) {
    drawVibrantText(ctx, element, element.vibrancy);
    return;
  }

  await withContextEffects(ctx, element, (c) => {
    c.font = element.font || "16px sans-serif";
    c.fillStyle = element.fillStyle || "black";
    c.textAlign = element.align || "left";

    const lines = wrapText(
      c,
      element.text,
      element.maxWidth,
      element.maxLines ?? 2,
    );
    const lineHeight = element.lineHeight || 20;

    lines.forEach((line, i) => {
      c.fillText(
        line,
        element.x,
        element.y - (lines.length - 1 - i) * lineHeight,
      );
    });
  });
}
