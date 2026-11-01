import Bottleneck from "bottleneck";
import { Canvas } from "skia-canvas";
import { drawImage, preloadImages } from "./drawers/drawImage.ts";
import {
  drawCircle,
  drawMediaControlIcon,
  drawRect,
  drawTonearm,
  drawVinylDisc,
} from "./drawers/drawShape.ts";
import { drawText } from "./drawers/drawText.ts";
import { ensureFontsRegistered } from "./fonts.ts";
import type { CanvasTemplateData, ImageElement } from "./types.ts";

export * from "./drawers/drawText.ts";
export * from "./elements.ts";
export * from "./types.ts";

// Ensure fonts are registered before rendering
ensureFontsRegistered();

const limiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 10,
});

/**
 * Yields execution to the macrotask queue (timers / I/O callbacks) so incoming
 * Telegram updates and lightweight commands are never starved during heavy
 * synchronous Skia / pixel-buffer rendering passes.
 */
function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

function isHeavyElement(element: CanvasTemplateData["elements"][number]): boolean {
  if (element.type === "vinylDisc" || element.type === "tonearm") return true;
  if (element.type === "rectangle" && element.style?.type === "glass") {
    return true;
  }
  if (element.type === "circle" && element.style?.type === "glass") return true;
  if (element.type === "text" && element.vibrancy) return true;
  if (
    (element.type === "image" || element.type === "icon") &&
    element.filter &&
    element.filter !== "none"
  ) {
    return true;
  }
  return false;
}

async function renderCanvasInternal(
  data: CanvasTemplateData,
): Promise<Uint8Array> {
  await yieldToEventLoop();

  const canvas = new Canvas(data.width, data.height, { gpu: false });
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = data.background || "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Fetch every image in parallel up-front; drawing stays sequential (z-order)
  const imageSrcs: string[] = [];
  for (const el of data.elements) {
    if (el.type === "image" || el.type === "icon") {
      imageSrcs.push((el as ImageElement).src);
    } else if (el.type === "vinylDisc" && el.labelImage) {
      imageSrcs.push(el.labelImage);
    }
  }
  const preloaded = await preloadImages(imageSrcs);
  await yieldToEventLoop();

  let opsSinceLastYield = 0;

  for (const element of data.elements) {
    switch (element.type) {
      case "image":
      case "icon":
        await drawImage(ctx, element, preloaded);
        break;
      case "rectangle":
        await drawRect(ctx, element);
        break;
      case "circle":
        await drawCircle(ctx, element);
        break;
      case "mediaControlIcon":
        await drawMediaControlIcon(ctx, element);
        break;
      case "vinylDisc":
        await drawVinylDisc(ctx, element, preloaded);
        break;
      case "tonearm":
        await drawTonearm(ctx, element);
        break;
      case "text":
        await drawText(ctx, element);
        break;
    }

    opsSinceLastYield += isHeavyElement(element) ? 4 : 1;
    if (opsSinceLastYield >= 16) {
      opsSinceLastYield = 0;
      await yieldToEventLoop();
    }
  }

  await yieldToEventLoop();
  const format = data.format || "jpeg";
  const buffer = format === "png"
    ? await canvas.toBuffer("png")
    : await canvas.toBuffer("jpeg", { quality: 1.0 });
  return new Uint8Array(buffer);
}

export const renderCanvas = limiter.wrap(renderCanvasInternal);
export default renderCanvas;

