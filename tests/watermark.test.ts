import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createWatermarkElements } from "@/rendering/watermark.ts";

describe("Watermark", () => {
  it("should generate watermark elements centered at the bottom", () => {
    const canvasWidth = 1080;
    const canvasHeight = 1350;
    const elements = createWatermarkElements({
      canvasWidth,
      canvasHeight,
      bottomOffset: 40,
      customUsername: "telelastfmbot",
    });

    assert.equal(elements.length, 3);

    // Pill container
    const pill = elements[0];
    assert.equal(pill.type, "rectangle");
    assert.equal(pill.style?.type, "glass");

    // Telegram icon
    const icon = elements[1];
    assert.equal(icon.type, "mediaControlIcon");
    if (icon.type === "mediaControlIcon") {
      assert.equal(icon.icon, "telegram");
    }

    // Watermark text
    const text = elements[2];
    assert.equal(text.type, "text");
    if (text.type === "text") {
      assert.equal(text.text, "t.me/telelastfmbot");
    }
  });

  it("should strip leading @ from custom username", () => {
    const elements = createWatermarkElements({
      canvasWidth: 1080,
      canvasHeight: 1080,
      customUsername: "@mytestbot",
    });

    const text = elements[2];
    if (text.type === "text") {
      assert.equal(text.text, "t.me/mytestbot");
    }
  });
});

