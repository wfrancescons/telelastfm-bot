import { clamp } from "./colorUtils.ts";

export function applyFrostBlur(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  frostRadius: number,
): Uint8ClampedArray {
  if (frostRadius <= 0.05 || width <= 1 || height <= 1) {
    return new Uint8ClampedArray(source);
  }

  // Calibrated scale so frost produces balanced frosted glass without destroying background shapes
  const scaledFrost = frostRadius * 0.65;
  const r0 = Math.floor(scaledFrost);
  const r1 = r0 + 1;
  const frac = scaledFrost - r0;

  if (r0 === 0) {
    const blurred1 = runThreePassBoxBlur(source, width, height, 1);
    const t = clamp(frac, 0, 1);
    for (let i = 0; i < blurred1.length; i++) {
      blurred1[i] = Math.round(source[i] * (1 - t) + blurred1[i] * t);
    }
    return blurred1;
  }

  const blurred0 = runThreePassBoxBlur(source, width, height, r0);
  if (frac < 0.02) {
    return blurred0;
  }

  const blurred1 = runThreePassBoxBlur(source, width, height, r1);
  for (let i = 0; i < blurred0.length; i++) {
    blurred0[i] = Math.round(blurred0[i] * (1 - frac) + blurred1[i] * frac);
  }
  return blurred0;
}

function runThreePassBoxBlur(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): Uint8ClampedArray {
  const current = new Uint8ClampedArray(source);
  const temp = new Uint8ClampedArray(source.length);

  for (let pass = 0; pass < 3; pass++) {
    boxBlurHorizontal(current, temp, width, height, radius);
    boxBlurVertical(temp, current, width, height, radius);
  }

  return current;
}

function boxBlurHorizontal(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): void {
  const kernelSize = radius * 2 + 1;

  for (let y = 0; y < height; y++) {
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let aSum = 0;

    const rowOffset = y * width;

    // Initialize sliding accumulator window
    for (let k = -radius; k <= radius; k++) {
      const x = clamp(k, 0, width - 1);
      const idx = (rowOffset + x) * 4;
      rSum += src[idx];
      gSum += src[idx + 1];
      bSum += src[idx + 2];
      aSum += src[idx + 3];
    }

    for (let x = 0; x < width; x++) {
      const dstIdx = (rowOffset + x) * 4;
      dst[dstIdx] = (rSum / kernelSize) | 0;
      dst[dstIdx + 1] = (gSum / kernelSize) | 0;
      dst[dstIdx + 2] = (bSum / kernelSize) | 0;
      dst[dstIdx + 3] = (aSum / kernelSize) | 0;

      const leftX = clamp(x - radius, 0, width - 1);
      const rightX = clamp(x + radius + 1, 0, width - 1);

      const leftIdx = (rowOffset + leftX) * 4;
      const rightIdx = (rowOffset + rightX) * 4;

      rSum += src[rightIdx] - src[leftIdx];
      gSum += src[rightIdx + 1] - src[leftIdx + 1];
      bSum += src[rightIdx + 2] - src[leftIdx + 2];
      aSum += src[rightIdx + 3] - src[leftIdx + 3];
    }
  }
}

function boxBlurVertical(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): void {
  const kernelSize = radius * 2 + 1;

  for (let x = 0; x < width; x++) {
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let aSum = 0;

    for (let k = -radius; k <= radius; k++) {
      const y = clamp(k, 0, height - 1);
      const idx = (y * width + x) * 4;
      rSum += src[idx];
      gSum += src[idx + 1];
      bSum += src[idx + 2];
      aSum += src[idx + 3];
    }

    for (let y = 0; y < height; y++) {
      const dstIdx = (y * width + x) * 4;
      dst[dstIdx] = (rSum / kernelSize) | 0;
      dst[dstIdx + 1] = (gSum / kernelSize) | 0;
      dst[dstIdx + 2] = (bSum / kernelSize) | 0;
      dst[dstIdx + 3] = (aSum / kernelSize) | 0;

      const topY = clamp(y - radius, 0, height - 1);
      const bottomY = clamp(y + radius + 1, 0, height - 1);

      const topIdx = (topY * width + x) * 4;
      const bottomIdx = (bottomY * width + x) * 4;

      rSum += src[bottomIdx] - src[topIdx];
      gSum += src[bottomIdx + 1] - src[topIdx + 1];
      bSum += src[bottomIdx + 2] - src[topIdx + 2];
      aSum += src[bottomIdx + 3] - src[topIdx + 3];
    }
  }
}

