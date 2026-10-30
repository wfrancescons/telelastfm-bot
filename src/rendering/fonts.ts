import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { FontLibrary } from "skia-canvas";

let fontsRegistered = false;

export function ensureFontsRegistered() {
  if (fontsRegistered) return;

  try {
    const fontDir = resolve(process.cwd(), "src/rendering/fonts");
    for (const entry of readdirSync(fontDir, { withFileTypes: true })) {
      if (
        entry.isFile() &&
        (entry.name.endsWith(".ttf") || entry.name.endsWith(".otf"))
      ) {
        const filePath = resolve(fontDir, entry.name);
        const fontName = entry.name.replace(/\.(ttf|otf)$/, "");
        FontLibrary.use(fontName, [filePath]);
      }
    }
    fontsRegistered = true;
  } catch (error) {
    console.error("Error registering fonts with skia-canvas:", error);
  }
}

// Automatically register fonts on initial import of rendering system
ensureFontsRegistered();

