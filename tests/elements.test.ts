import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createGlassCircleElement,
  createGlassPillElement,
  createGradientRectangle,
  createImageElement,
  createTextElement,
  createTonearmElement,
  createVinylDiscElement,
  DEFAULT_GLASS_OPTIONS,
} from "@/rendering/elements.ts";

describe("Rendering Elements Builders", () => {
  it("should create text element with all fields preserved", () => {
    const el = createTextElement({
      text: "hello world",
      x: 10,
      y: 20,
      font: "24px sans-serif",
      fillStyle: "#ffffff",
      align: "center",
      vibrancy: "primary",
    });

    assert.equal(el.type, "text");
    assert.equal(el.text, "hello world");
    assert.equal(el.x, 10);
    assert.equal(el.y, 20);
    assert.equal(el.vibrancy, "primary");
  });

  it("should create image element with rotation and filter", () => {
    const el = createImageElement({
      src: "https://example.com/cover.jpg",
      x: 0,
      y: 0,
      width: 500,
      height: 500,
      objectFit: "cover",
      borderRadius: 10,
      rotation: -2.2,
      filter: "blur(50px)",
    });

    assert.equal(el.type, "image");
    assert.equal(el.src, "https://example.com/cover.jpg");
    assert.equal(el.rotation, -2.2);
    assert.equal(el.borderRadius, 10);
  });

  it("should create glass pill element with default options and auto height/2 borderRadius", () => {
    const pill = createGlassPillElement({
      x: 50,
      y: 60,
      width: 200,
      height: 40,
    });

    assert.equal(pill.type, "rectangle");
    assert.equal(pill.borderRadius, 20);
    assert.equal(pill.style?.type, "glass");
    assert.equal(pill.style?.options?.refraction, DEFAULT_GLASS_OPTIONS.refraction);
  });

  it("should create glass circle element", () => {
    const circle = createGlassCircleElement({
      cx: 100,
      cy: 150,
      diameter: 60,
    });

    assert.equal(circle.type, "circle");
    assert.equal(circle.x, 100);
    assert.equal(circle.y, 150);
    assert.equal(circle.width, 60);
    assert.equal(circle.height, 60);
    assert.equal(circle.style?.type, "glass");
  });

  it("should create gradient rectangle with default bottom stops", () => {
    const grad = createGradientRectangle({
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      gradientHeight: 100,
      direction: "bottom",
    });

    assert.equal(grad.type, "rectangle");
    assert.equal(grad.height, 100);
    assert.equal(grad.y, 200);
    assert.equal(typeof grad.fillStyle, "object");
  });

  it("should create vinyl disc element", () => {
    const vinyl = createVinylDiscElement({
      cx: 500,
      cy: 500,
      diameter: 480,
      labelTitle: "Album Title",
      labelSubtitle: "Artist Name",
    });

    assert.equal(vinyl.type, "vinylDisc");
    assert.equal(vinyl.cx, 500);
    assert.equal(vinyl.diameter, 480);
    assert.equal(vinyl.labelTitle, "Album Title");
  });

  it("should create tonearm element", () => {
    const arm = createTonearmElement({
      pivotX: 900,
      pivotY: 200,
      length: 350,
      angle: 2.2,
    });

    assert.equal(arm.type, "tonearm");
    assert.equal(arm.pivotX, 900);
    assert.equal(arm.length, 350);
  });
});

