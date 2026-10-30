import Bottleneck from "bottleneck";
import { Canvas } from "skia-canvas";
import { drawImage } from "./drawers/drawImage.ts";
import {
  drawCircle,
  drawMediaControlIcon,
  drawRect,
} from "./drawers/drawShape.ts";
import { drawText } from "./drawers/drawText.ts";
import { ensureFontsRegistered } from "./fonts.ts";
import type { CanvasTemplateData } from "./types.ts";

export * from "./drawers/drawText.ts";
export * from "./types.ts";

// Ensure fonts are registered before rendering
ensureFontsRegistered();

const limiter = new Bottleneck({
  maxConcurrent: 4,
  minTime: 0,
});

async function renderCanvasInternal(
  data: CanvasTemplateData,
): Promise<Uint8Array> {
  const canvas = new Canvas(data.width, data.height, { gpu: false });
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = data.background || "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const element of data.elements) {
    switch (element.type) {
      case "image":
      case "icon":
        await drawImage(ctx, element);
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
      case "text":
        await drawText(ctx, element);
        break;
    }
  }

  const buffer = await canvas.toBuffer("jpeg", { quality: 0.95 });
  return new Uint8Array(buffer);
}

export const renderCanvas = limiter.wrap(renderCanvasInternal);
export default renderCanvas;

