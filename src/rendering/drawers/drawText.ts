import { Canvas, type CanvasRenderingContext2D } from "skia-canvas";
import { withContextEffects } from "../effects/contextEffects.ts";
import { ensureFontsRegistered } from "../fonts.ts";
import type { TextElement, TextVibrancyMode } from "../types.ts";

let measureCtx: CanvasRenderingContext2D | null = null;
let vibrancyMaskCanvas: Canvas | null = null;
let vibrancyMaskCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D {
  if (!measureCtx) {
    ensureFontsRegistered();
    const measureCanvas = new Canvas(1, 1, { gpu: false });
    measureCtx = measureCanvas.getContext("2d");
  }
  return measureCtx;
}

function getVibrancyMaskContext(
  width: number,
  height: number,
): CanvasRenderingContext2D {
  if (!vibrancyMaskCanvas || !vibrancyMaskCtx) {
    ensureFontsRegistered();
    vibrancyMaskCanvas = new Canvas(
      Math.max(width, 256),
      Math.max(height, 128),
      { gpu: false },
    );
    vibrancyMaskCtx = vibrancyMaskCanvas.getContext("2d");
  } else if (
    vibrancyMaskCanvas.width < width ||
    vibrancyMaskCanvas.height < height
  ) {
    vibrancyMaskCanvas.width = Math.max(vibrancyMaskCanvas.width, width);
    vibrancyMaskCanvas.height = Math.max(vibrancyMaskCanvas.height, height);
  }
  vibrancyMaskCtx.clearRect(0, 0, width, height);
  return vibrancyMaskCtx;
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

  // 1. Read backdrop pixels directly from the bounding box (avoids full-canvas snapshot & CPU blur pass)
  const backdropImg = ctx.getImageData(boxX, boxY, boxW, boxH);
  const outData = backdropImg.data;
  const srcData = new Uint8ClampedArray(outData);

  // 2. Render clean, flat anti-aliased glyph mask on a reusable scratch canvas
  const mctx = getVibrancyMaskContext(boxW, boxH);
  mctx.save();
  mctx.font = font;
  mctx.textAlign = align;
  mctx.fillStyle = "#ffffff";
  for (let i = 0; i < lines.length; i++) {
    const lineY = element.y - (lines.length - 1 - i) * lineHeight;
    mctx.fillText(lines[i], element.x - boxX, lineY - boxY);
  }
  mctx.restore();
  const maskData = mctx.getImageData(0, 0, boxW, boxH).data;

  // 3. Apply flat vibrancy color matrix + alpha blend directly into backdropImg.data
  const maxX = boxW - 1;
  const maxY = boxH - 1;
  const sampleRadius = 4;

  for (let py = 0; py < boxH; py++) {
    const rowOffset = py * boxW;
    const yUp = (py > sampleRadius ? py - sampleRadius : 0) * boxW;
    const yDown = (py + sampleRadius < maxY ? py + sampleRadius : maxY) * boxW;

    for (let px = 0; px < boxW; px++) {
      const idx = (rowOffset + px) * 4;
      const maskA = maskData[idx + 3];
      if (maskA === 0) continue;

      const coverage = maskA / 255;

      // Fast 5-point neighborhood sample for smooth local color field
      const xLeft = px > sampleRadius ? px - sampleRadius : 0;
      const xRight = px + sampleRadius < maxX ? px + sampleRadius : maxX;

      const iL = (rowOffset + xLeft) * 4;
      const iR = (rowOffset + xRight) * 4;
      const iU = (yUp + px) * 4;
      const iD = (yDown + px) * 4;

      const sR =
        (srcData[idx] * 2 +
          srcData[iL] +
          srcData[iR] +
          srcData[iU] +
          srcData[iD]) /
        6;
      const sG =
        (srcData[idx + 1] * 2 +
          srcData[iL + 1] +
          srcData[iR + 1] +
          srcData[iU + 1] +
          srcData[iD + 1]) /
        6;
      const sB =
        (srcData[idx + 2] * 2 +
          srcData[iL + 2] +
          srcData[iR + 2] +
          srcData[iU + 2] +
          srcData[iD + 2]) /
        6;

      const mean = (sR + sG + sB) / 3;
      // Apply 1.65x saturation boost (matching original saturate(165%)) before clamping chroma
      const dR = (sR - mean) * 1.65;
      const dG = (sG - mean) * 1.65;
      const dB = (sB - mean) * 1.65;

      // Limit extreme chroma excursions so vibrancy stays a clean pastel/translucent tint
      const maxChroma = Math.max(Math.abs(dR), Math.abs(dG), Math.abs(dB), 1);
      const chromaScale = maxChroma > 42 ? 42 / maxChroma : 1;
      const cR = dR * chromaScale;
      const cG = dG * chromaScale;
      const cB = dB * chromaScale;

      let fgR: number;
      let fgG: number;
      let fgB: number;
      let alpha: number;

      if (mode === "primary") {
        // Primary Vibrancy ("august"):
        // Bright, flat pastel vibrancy (high luminance + subtle local background chroma lift)
        const baseL = clamp(202 + mean * 0.26, 204, 240);
        const gain = 1.35;

        fgR = clamp(baseL + cR * gain, 0, 255);
        fgG = clamp(baseL + cG * gain, 0, 255);
        fgB = clamp(baseL + cB * gain, 0, 255);
        alpha = clamp(coverage * 0.95, 0, 1);
      } else {
        // Secondary Vibrancy ("2026"):
        // Softer, translucent vibrancy blend (absorbs background luminance & hue without 3D borders)
        const baseL = clamp(128 + mean * 0.44, 132, 205);
        const gain = 1.25;

        fgR = clamp(baseL + cR * gain, 0, 255);
        fgG = clamp(baseL + cG * gain, 0, 255);
        fgB = clamp(baseL + cB * gain, 0, 255);
        alpha = clamp(coverage * 0.64, 0, 1);
      }

      const invAlpha = 1 - alpha;
      outData[idx] = Math.round(srcData[idx] * invAlpha + fgR * alpha);
      outData[idx + 1] = Math.round(srcData[idx + 1] * invAlpha + fgG * alpha);
      outData[idx + 2] = Math.round(srcData[idx + 2] * invAlpha + fgB * alpha);
      outData[idx + 3] = 255;
    }
  }

  ctx.putImageData(backdropImg, boxX, boxY);
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
