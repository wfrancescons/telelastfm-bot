import type { CanvasRenderingContext2D } from "skia-canvas";
import { withContextEffects } from "../effects/contextEffects.ts";
import { renderGlassEffectShape } from "../effects/glassEffect.ts";
import type {
  CircleElement,
  LinearGradientStyle,
  MediaControlIconElement,
  RadialGradientStyle,
  RectangleElement,
} from "../types.ts";

function resolveFillStyle(
  ctx: CanvasRenderingContext2D,
  fillStyle?: string | LinearGradientStyle | RadialGradientStyle,
) {
  if (!fillStyle) return "black";
  if (typeof fillStyle === "string") return fillStyle;

  if (fillStyle.type === "linearGradient") {
    const grad = ctx.createLinearGradient(
      fillStyle.x0,
      fillStyle.y0,
      fillStyle.x1,
      fillStyle.y1,
    );
    for (const stop of fillStyle.colors) {
      grad.addColorStop(stop.stop, stop.color);
    }
    return grad;
  }

  if (fillStyle.type === "radialGradient") {
    const grad = ctx.createRadialGradient(
      fillStyle.x0,
      fillStyle.y0,
      fillStyle.r0,
      fillStyle.x1,
      fillStyle.y1,
      fillStyle.r1,
    );
    for (const stop of fillStyle.colors) {
      grad.addColorStop(stop.stop, stop.color);
    }
    return grad;
  }

  return "black";
}

export async function drawRect(
  ctx: CanvasRenderingContext2D,
  element: RectangleElement,
): Promise<void> {
  if (element.style?.type === "glass") {
    renderGlassEffectShape(
      ctx,
      {
        shape: "rectangle",
        cx: element.x + element.width / 2,
        cy: element.y + element.height / 2,
        width: element.width,
        height: element.height,
        borderRadius: element.borderRadius ?? 0,
      },
      element.style.options,
    );
    return;
  }

  await withContextEffects(ctx, element, (c) => {
    c.fillStyle = resolveFillStyle(c, element.fillStyle);
    const radius = element.borderRadius ?? 0;

    if (radius > 0 && typeof c.roundRect === "function") {
      c.beginPath();
      c.roundRect(element.x, element.y, element.width, element.height, radius);
      c.fill();
    } else {
      c.fillRect(element.x, element.y, element.width, element.height);
    }
  });
}

export async function drawCircle(
  ctx: CanvasRenderingContext2D,
  element: CircleElement,
): Promise<void> {
  const isTopLeft = element.anchor === "top-left";
  const cx = isTopLeft ? element.x + element.width / 2 : element.x;
  const cy = isTopLeft ? element.y + element.height / 2 : element.y;

  if (element.style?.type === "glass") {
    renderGlassEffectShape(
      ctx,
      {
        shape: "circle",
        cx,
        cy,
        width: element.width,
        height: element.height,
        borderRadius: Math.min(element.width, element.height) / 2,
      },
      element.style.options,
    );
    return;
  }

  await withContextEffects(ctx, element, (c) => {
    c.fillStyle = resolveFillStyle(c, element.fillStyle);
    const rx = element.width / 2;
    const ry = element.height / 2;

    c.beginPath();
    c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  });
}

function drawRoundedTriangle(
  ctx: CanvasRenderingContext2D,
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2);
  ctx.arcTo(p2[0], p2[1], p3[0], p3[1], radius);
  ctx.arcTo(p3[0], p3[1], p1[0], p1[1], radius);
  ctx.arcTo(p1[0], p1[1], p2[0], p2[1], radius);
  ctx.closePath();
  ctx.fill();
}

export async function drawMediaControlIcon(
  ctx: CanvasRenderingContext2D,
  element: MediaControlIconElement,
): Promise<void> {
  await withContextEffects(ctx, element, (c) => {
    c.fillStyle = element.fillStyle || "#ffffff";
    const { cx, cy, size, icon } = element;

    if (icon === "pause") {
      const barWidth = size * 0.24;
      const barHeight = size * 0.88;
      const gap = size * 0.22;
      const r = barWidth / 2;

      const leftX = cx - gap / 2 - barWidth;
      const rightX = cx + gap / 2;
      const topY = cy - barHeight / 2;

      c.beginPath();
      c.roundRect(leftX, topY, barWidth, barHeight, r);
      c.roundRect(rightX, topY, barWidth, barHeight, r);
      c.fill();
      return;
    }

    if (icon === "play") {
      const h = size * 0.86;
      const w = size * 0.76;
      const offsetX = size * 0.06;
      const p1: [number, number] = [cx - w / 2 + offsetX, cy - h / 2];
      const p2: [number, number] = [cx + w / 2 + offsetX, cy];
      const p3: [number, number] = [cx - w / 2 + offsetX, cy + h / 2];
      drawRoundedTriangle(c, p1, p2, p3, size * 0.08);
      return;
    }

    if (icon === "prev") {
      const totalW = size * 0.84;
      const h = size * 0.78;
      const barW = size * 0.15;
      const triW = totalW - barW - size * 0.05;

      const leftEdge = cx - totalW / 2;
      const rightEdge = cx + totalW / 2;

      // Vertical bar on the left
      c.beginPath();
      c.roundRect(leftEdge, cy - h / 2, barW, h, barW / 2);
      c.fill();

      // Triangle pointing left
      const p1: [number, number] = [rightEdge, cy - h / 2];
      const p2: [number, number] = [rightEdge - triW, cy];
      const p3: [number, number] = [rightEdge, cy + h / 2];
      drawRoundedTriangle(c, p1, p2, p3, size * 0.06);
      return;
    }

    if (icon === "next") {
      const totalW = size * 0.84;
      const h = size * 0.78;
      const barW = size * 0.15;
      const triW = totalW - barW - size * 0.05;

      const leftEdge = cx - totalW / 2;
      const rightEdge = cx + totalW / 2;

      // Triangle pointing right
      const p1: [number, number] = [leftEdge, cy - h / 2];
      const p2: [number, number] = [leftEdge + triW, cy];
      const p3: [number, number] = [leftEdge, cy + h / 2];
      drawRoundedTriangle(c, p1, p2, p3, size * 0.06);

      // Vertical bar on the right
      c.beginPath();
      c.roundRect(rightEdge - barW, cy - h / 2, barW, h, barW / 2);
      c.fill();
    }
  });
}

