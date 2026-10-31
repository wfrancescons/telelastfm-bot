import { type CanvasRenderingContext2D, type Image, Path2D } from "skia-canvas";
import { withContextEffects } from "../effects/contextEffects.ts";
import { renderGlassEffectShape } from "../effects/glassEffect.ts";
import type {
  CircleElement,
  LinearGradientStyle,
  MediaControlIconElement,
  RadialGradientStyle,
  RectangleElement,
  TonearmElement,
  VinylDiscElement,
} from "../types.ts";
import { wrapText } from "./drawText.ts";

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
    if (element.rotation) {
      const cx = element.x + element.width / 2;
      const cy = element.y + element.height / 2;
      c.translate(cx, cy);
      c.rotate((element.rotation * Math.PI) / 180);
      c.translate(-cx, -cy);
    }

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
      return;
    }

    if (icon === "telegram") {
      // Official Telegram paper plane glyph (from https://www.svgrepo.com/show/336237/telegram.svg)
      // ViewBox: 48x48. Actual path bounds: X: 3..44, Y: 7..41 (center ~ [23.5, 24], span: 41x34)
      c.save();
      const scale = size / 48;
      c.translate(cx, cy);
      c.scale(scale, scale);
      c.translate(-23.5, -24);
      c.fillStyle = element.fillStyle || "#ffffff";
      const path = new Path2D(
        "M41.4193 7.30899C41.4193 7.30899 45.3046 5.79399 44.9808 9.47328C44.8729 10.9883 43.9016 16.2908 43.1461 22.0262L40.5559 39.0159C40.5559 39.0159 40.3401 41.5048 38.3974 41.9377C36.4547 42.3705 33.5408 40.4227 33.0011 39.9898C32.5694 39.6652 24.9068 34.7955 22.2086 32.4148C21.4531 31.7655 20.5897 30.4669 22.3165 28.9519L33.6487 18.1305C34.9438 16.8319 36.2389 13.8019 30.8426 17.4812L15.7331 27.7616C15.7331 27.7616 14.0063 28.8437 10.7686 27.8698L3.75342 25.7055C3.75342 25.7055 1.16321 24.0823 5.58815 22.459C16.3807 17.3729 29.6555 12.1786 41.4193 7.30899Z"
      );
      c.fill(path);
      c.restore();
      return;
    }
  });
}

export async function drawVinylDisc(
  ctx: CanvasRenderingContext2D,
  element: VinylDiscElement,
  preloaded?: Map<string, Image | Error>,
): Promise<void> {
  await withContextEffects(ctx, element, (c) => {
    const { cx, cy, diameter } = element;
    const radius = diameter / 2;

    // 1. Deep ambient drop shadow beneath the vinyl platter
    c.save();
    c.shadowColor = element.shadow?.color ?? "rgba(0, 0, 0, 0.72)";
    c.shadowBlur = element.shadow?.blur ?? 48;
    c.shadowOffsetX = element.shadow?.offsetX ?? 8;
    c.shadowOffsetY = element.shadow?.offsetY ?? 20;
    c.fillStyle = "#0a0a0b";
    c.beginPath();
    c.arc(cx, cy, radius, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // 2. Vinyl body & anisotropic conic reflections
    c.save();
    c.beginPath();
    c.arc(cx, cy, radius, 0, Math.PI * 2);
    c.clip();

    // Base rich vinyl black
    c.fillStyle = "#0B0B0D";
    c.fillRect(cx - radius, cy - radius, diameter, diameter);

    // Primary diagonal bow-tie light reflection
    if (typeof c.createConicGradient === "function") {
      const conic1 = c.createConicGradient((-38 * Math.PI) / 180, cx, cy);
      conic1.addColorStop(0.0, "rgba(255, 255, 255, 0.15)");
      conic1.addColorStop(0.06, "rgba(255, 255, 255, 0.04)");
      conic1.addColorStop(0.16, "rgba(255, 255, 255, 0.0)");
      conic1.addColorStop(0.34, "rgba(255, 255, 255, 0.0)");
      conic1.addColorStop(0.44, "rgba(255, 255, 255, 0.04)");
      conic1.addColorStop(0.5, "rgba(255, 255, 255, 0.14)");
      conic1.addColorStop(0.56, "rgba(255, 255, 255, 0.04)");
      conic1.addColorStop(0.66, "rgba(255, 255, 255, 0.0)");
      conic1.addColorStop(0.84, "rgba(255, 255, 255, 0.0)");
      conic1.addColorStop(0.94, "rgba(255, 255, 255, 0.04)");
      conic1.addColorStop(1.0, "rgba(255, 255, 255, 0.15)");
      c.fillStyle = conic1;
      c.fillRect(cx - radius, cy - radius, diameter, diameter);

      // Secondary subtle sheen at a complementary angle
      const conic2 = c.createConicGradient((42 * Math.PI) / 180, cx, cy);
      conic2.addColorStop(0.0, "rgba(255, 255, 255, 0.05)");
      conic2.addColorStop(0.12, "rgba(255, 255, 255, 0.0)");
      conic2.addColorStop(0.38, "rgba(255, 255, 255, 0.0)");
      conic2.addColorStop(0.5, "rgba(255, 255, 255, 0.05)");
      conic2.addColorStop(0.62, "rgba(255, 255, 255, 0.0)");
      conic2.addColorStop(0.88, "rgba(255, 255, 255, 0.0)");
      conic2.addColorStop(1.0, "rgba(255, 255, 255, 0.05)");
      c.fillStyle = conic2;
      c.fillRect(cx - radius, cy - radius, diameter, diameter);
    }

    // 3. Concentric micro-grooves & track separation bands
    const grooveStart = radius * 0.39;
    const grooveEnd = radius * 0.965;
    let ringIdx = 0;
    for (let r = grooveStart; r <= grooveEnd; r += 2.6) {
      ringIdx++;
      const t = (r - grooveStart) / (grooveEnd - grooveStart);
      // Darker track separation gaps at ~28%, ~58%, ~82%
      const isTrackGap =
        Math.abs(t - 0.28) < 0.016 ||
        Math.abs(t - 0.58) < 0.016 ||
        Math.abs(t - 0.82) < 0.014;

      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      if (isTrackGap) {
        c.strokeStyle = "rgba(0, 0, 0, 0.65)";
        c.lineWidth = 1.8;
      } else {
        const alpha = 0.022 + ((ringIdx * 7) % 5) * 0.01;
        c.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        c.lineWidth = ringIdx % 3 === 0 ? 1.0 : 0.65;
      }
      c.stroke();
    }

    // Run-out inner groove ring
    c.beginPath();
    c.arc(cx, cy, radius * 0.372, 0, Math.PI * 2);
    c.strokeStyle = "rgba(255, 255, 255, 0.07)";
    c.lineWidth = 1;
    c.stroke();

    // Outer edge bevel highlight
    c.beginPath();
    c.arc(cx, cy, radius - 1.2, 0, Math.PI * 2);
    c.strokeStyle = "rgba(255, 255, 255, 0.22)";
    c.lineWidth = 1.6;
    c.stroke();

    // 4. Vinyl Center Label (Circular album artwork OR Classic Cream Paper Label)
    const labelRadius = radius * 0.345;
    const preImg = element.labelImage
      ? preloaded?.get(element.labelImage)
      : undefined;
    const hasLabelImage = preImg && !(preImg instanceof Error);

    c.save();
    c.beginPath();
    c.arc(cx, cy, labelRadius, 0, Math.PI * 2);
    c.clip();

    if (hasLabelImage) {
      const rotDeg = element.labelRotation ?? 0;
      c.save();
      c.translate(cx, cy);
      if (rotDeg) {
        c.rotate((rotDeg * Math.PI) / 180);
      }

      // Draw circular cover image (object-fit: cover)
      const imgW = preImg.width;
      const imgH = preImg.height;
      const side = Math.min(imgW, imgH);
      const sx = (imgW - side) / 2;
      const sy = (imgH - side) / 2;
      c.drawImage(
        preImg,
        sx,
        sy,
        side,
        side,
        -labelRadius,
        -labelRadius,
        labelRadius * 2,
        labelRadius * 2,
      );
      c.restore();

      // Subtle inner stamper ring & outer rim over the artwork label
      c.beginPath();
      c.arc(cx, cy, labelRadius * 0.72, 0, Math.PI * 2);
      c.strokeStyle = "rgba(0, 0, 0, 0.22)";
      c.lineWidth = 1.4;
      c.stroke();

      c.beginPath();
      c.arc(cx, cy, labelRadius * 0.72 - 1.4, 0, Math.PI * 2);
      c.strokeStyle = "rgba(255, 255, 255, 0.22)";
      c.lineWidth = 0.9;
      c.stroke();

      c.beginPath();
      c.arc(cx, cy, labelRadius - 0.8, 0, Math.PI * 2);
      c.strokeStyle = "rgba(0, 0, 0, 0.45)";
      c.lineWidth = 1.6;
      c.stroke();
    } else {
      const labelGrad = c.createRadialGradient(
        cx - labelRadius * 0.2,
        cy - labelRadius * 0.2,
        labelRadius * 0.05,
        cx,
        cy,
        labelRadius,
      );
      labelGrad.addColorStop(0, "#F7F4EC");
      labelGrad.addColorStop(0.75, "#EFEAE0");
      labelGrad.addColorStop(1, "#E2DBD0");
      c.fillStyle = labelGrad;
      c.fill();

      // Pressed stamper ring on paper label
      c.beginPath();
      c.arc(cx, cy, labelRadius * 0.78, 0, Math.PI * 2);
      c.strokeStyle = "rgba(0, 0, 0, 0.08)";
      c.lineWidth = 1.4;
      c.stroke();

      c.beginPath();
      c.arc(cx, cy, labelRadius * 0.78 - 1.5, 0, Math.PI * 2);
      c.strokeStyle = "rgba(255, 255, 255, 0.55)";
      c.lineWidth = 1.0;
      c.stroke();

      // Outer thin border ring on paper label
      c.beginPath();
      c.arc(cx, cy, labelRadius * 0.92, 0, Math.PI * 2);
      c.strokeStyle = "rgba(30, 28, 25, 0.14)";
      c.lineWidth = 1.0;
      c.stroke();

      // Label typography (slightly angled like the reference record)
      const rotDeg = element.labelRotation ?? -10;
      c.save();
      c.translate(cx, cy);
      c.rotate((rotDeg * Math.PI) / 180);
      c.textAlign = "center";

      // Top micro metadata
      const rpmFontSize = Math.max(7, Math.round(labelRadius * 0.09));
      c.font = `${rpmFontSize}px "NotoSans-Medium", sans-serif`;
      c.fillStyle = "rgba(35, 32, 29, 0.45)";
      c.fillText("33 ⅓ RPM  •  STEREO", 0, -labelRadius * 0.52);

      // Subtitle (Artist) above spindle hole
      if (element.labelSubtitle) {
        const subFontSize = Math.max(9, Math.round(labelRadius * 0.135));
        c.font = `${subFontSize}px "NotoSans-Regular", sans-serif`;
        c.fillStyle = "rgba(28, 26, 24, 0.82)";
        const subLines = wrapText(
          c,
          element.labelSubtitle,
          labelRadius * 1.35,
          1,
        );
        if (subLines[0]) {
          c.fillText(subLines[0], 0, -labelRadius * 0.25);
        }
      }

      // Primary Title (Track / Album) below spindle hole
      if (element.labelTitle) {
        const titleFontSize = Math.max(11, Math.round(labelRadius * 0.175));
        c.font = `${titleFontSize}px "NotoSans-Bold", sans-serif`;
        c.fillStyle = "#171614";
        const titleLines = wrapText(
          c,
          element.labelTitle,
          labelRadius * 1.42,
          2,
        );
        const lineGap = titleFontSize * 1.15;
        titleLines.forEach((line, idx) => {
          c.fillText(line, 0, labelRadius * 0.34 + idx * lineGap);
        });
      }

      c.restore();
    }
    c.restore();

    // 5. Center spindle hole
    const holeRadius = radius * 0.04;
    c.beginPath();
    c.arc(cx, cy, holeRadius + 1.2, 0, Math.PI * 2);
    c.fillStyle = "rgba(0, 0, 0, 0.18)";
    c.fill();

    c.beginPath();
    c.arc(cx, cy, holeRadius, 0, Math.PI * 2);
    c.fillStyle = "#141416";
    c.fill();
    c.strokeStyle = "rgba(255, 255, 255, 0.25)";
    c.lineWidth = 0.8;
    c.stroke();

    c.restore();
  });
}

export async function drawTonearm(
  ctx: CanvasRenderingContext2D,
  element: TonearmElement,
): Promise<void> {
  const { pivotX, pivotY, length } = element;
  const armAngleDeg = element.angle ?? 2.2;

  // 1. Pill-shaped glass base beneath the tonearm pivot assembly (matches reference)
  const baseWidth = 84;
  const baseHeight = 132;
  renderGlassEffectShape(
    ctx,
    {
      shape: "rectangle",
      cx: pivotX,
      cy: pivotY + 12,
      width: baseWidth,
      height: baseHeight,
      borderRadius: baseWidth / 2,
    },
    {
      light: { angle: -45, intensity: 0.55 },
      refraction: 1.8,
      depth: 5,
      dispersion: 0.3,
      frost: 3,
      tint: { color: "#ffffff", opacity: 0.08 },
      shadow: {
        color: "rgba(0, 0, 0, 0.35)",
        opacity: 0.35,
        blur: 18,
        offsetX: 0,
        offsetY: 6,
      },
      ...element.glassOptions,
    },
  );

  await withContextEffects(ctx, element, (c) => {
    c.save();
    c.translate(pivotX, pivotY);
    c.rotate((armAngleDeg * Math.PI) / 180);

    // 2. Soft drop shadow for the entire tonearm assembly
    c.save();
    c.shadowColor = "rgba(0, 0, 0, 0.52)";
    c.shadowBlur = 18;
    c.shadowOffsetX = -6;
    c.shadowOffsetY = 10;

    // Counterweight block (top)
    c.fillStyle = "#141518";
    c.beginPath();
    c.roundRect(-21, -36, 42, 26, 4);
    c.fill();

    // Gimbal / Pivot housing block
    c.fillStyle = "#1B1C20";
    c.beginPath();
    c.roundRect(-26, -8, 52, 50, 6);
    c.fill();

    // Cueing lever detail on the right side of pivot
    c.fillStyle = "#2A2C32";
    c.beginPath();
    c.roundRect(24, 4, 8, 34, 3);
    c.fill();

    // 3. Brushed silver metallic tonearm tube
    const rodWidth = 14;
    const rodTopY = 38;
    const rodHeight = Math.max(120, length - 85);
    const rodGrad = c.createLinearGradient(-rodWidth / 2, 0, rodWidth / 2, 0);
    rodGrad.addColorStop(0.0, "#7A8086");
    rodGrad.addColorStop(0.28, "#E6EBF0");
    rodGrad.addColorStop(0.52, "#FFFFFF");
    rodGrad.addColorStop(0.78, "#AEB4BC");
    rodGrad.addColorStop(1.0, "#686E74");

    c.fillStyle = rodGrad;
    c.beginPath();
    c.roundRect(-rodWidth / 2, rodTopY, rodWidth, rodHeight, 3);
    c.fill();

    // 4. Angled Headshell & Cartridge at the bottom tip
    const headY = rodTopY + rodHeight - 4;
    c.save();
    c.translate(0, headY);
    c.rotate((18 * Math.PI) / 180); // Angled inward toward the record grooves

    // Headshell collar
    c.fillStyle = "#26282D";
    c.beginPath();
    c.roundRect(-9, -2, 18, 14, 3);
    c.fill();

    // Finger-lift wire on the right side
    c.strokeStyle = "#D8DEE4";
    c.lineWidth = 2.4;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(8, 10);
    c.quadraticCurveTo(20, 12, 22, 22);
    c.stroke();

    // Main cartridge body
    c.fillStyle = "#121316";
    c.beginPath();
    c.roundRect(-11, 8, 22, 42, 4);
    c.fill();

    // Subtle top highlight on headshell
    c.fillStyle = "rgba(255, 255, 255, 0.14)";
    c.beginPath();
    c.roundRect(-6, 12, 12, 26, 2);
    c.fill();

    c.restore();
    c.restore();

    // Subtle top specular rim on counterweight & pivot housing
    c.strokeStyle = "rgba(255, 255, 255, 0.14)";
    c.lineWidth = 1;
    c.beginPath();
    c.roundRect(-26, -8, 52, 50, 6);
    c.stroke();

    c.restore();
  });
}

