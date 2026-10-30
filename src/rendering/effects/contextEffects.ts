import type { CanvasRenderingContext2D } from "skia-canvas";
import type { ElementEffects, GlowStyle, ShadowStyle } from "../types.ts";

export type ContextEffectInput = {
  filter?: string;
  composite?: string;
  opacity?: number;
  shadow?: ShadowStyle;
  glow?: GlowStyle;
  effects?: ElementEffects;
};

export async function withContextEffects(
  ctx: CanvasRenderingContext2D,
  element: ContextEffectInput,
  renderFn: (ctx: CanvasRenderingContext2D) => Promise<void> | void,
): Promise<void> {
  ctx.save();

  try {
    const effects = element.effects ?? {};
    const filter = effects.filter ?? element.filter ?? "none";
    const composite = effects.composite ?? element.composite ?? "source-over";
    const opacity = effects.opacity ?? element.opacity ?? 1;
    const shadow = effects.shadow ?? element.shadow;
    const glow = effects.glow ?? element.glow;

    ctx.filter = filter;
    ctx.globalCompositeOperation =
      composite as CanvasRenderingContext2D["globalCompositeOperation"];
    ctx.globalAlpha = opacity;

    if (glow && (glow.intensity ?? 0) > 0) {
      ctx.shadowColor = glow.color ?? "rgba(255, 255, 255, 0.7)";
      ctx.shadowBlur = glow.radius ?? 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else if (shadow) {
      ctx.shadowColor = shadow.color ?? "transparent";
      ctx.shadowBlur = shadow.blur ?? 0;
      ctx.shadowOffsetX = shadow.offsetX ?? 0;
      ctx.shadowOffsetY = shadow.offsetY ?? 0;
    }

    await renderFn(ctx);
  } finally {
    ctx.restore();
  }
}

