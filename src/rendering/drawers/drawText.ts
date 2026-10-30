import { Canvas, type CanvasRenderingContext2D } from "skia-canvas";
import { withContextEffects } from "../effects/contextEffects.ts";
import { ensureFontsRegistered } from "../fonts.ts";
import type { TextElement } from "../types.ts";

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

export async function drawText(
  ctx: CanvasRenderingContext2D,
  element: TextElement,
): Promise<void> {
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
