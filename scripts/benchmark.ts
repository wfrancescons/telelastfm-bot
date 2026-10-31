import renderCanvas from "@/rendering/renderCanvas.ts";
import gridlfTemplate from "@/commands/templates/gridlfTemplate.ts";
import calendarlfTemplate from "@/commands/templates/calendarlfTemplate.ts";
import vinyllfTemplate from "@/commands/templates/vinyllfTemplate.ts";
import type { TopGridItem } from "@/services/lastfm/index.ts";

function generateMockGridData(count: number): TopGridItem[] {
  return Array.from({ length: count }, (_, i) => ({
    album: { name: `Test Album ${i + 1}`, artist: `Artist ${i + 1}` },
    scrobbles: 100 - i,
    rank: i + 1,
    image: "./docs/assets/logo.jpg",
  }));
}

type BenchResult = {
  template: string;
  dimension: string;
  format: "jpeg (q100)" | "png";
  renderMs: number;
  sizeKb: number;
};

async function benchmarkCase(
  name: string,
  // deno-lint-ignore no-explicit-any
  templateFn: (format: "jpeg" | "png") => any,
  dimension: string,
): Promise<BenchResult[]> {
  const results: BenchResult[] = [];

  for (const fmt of ["jpeg", "png"] as const) {
    const tpl = templateFn(fmt);
    tpl.format = fmt;

    // Warmup
    await renderCanvas(tpl);

    const start = performance.now();
    const buffer = await renderCanvas(tpl);
    const duration = performance.now() - start;

    results.push({
      template: name,
      dimension,
      format: fmt === "jpeg" ? "jpeg (q100)" : "png",
      renderMs: Math.round(duration),
      sizeKb: Math.round(buffer.byteLength / 1024),
    });
  }

  return results;
}

async function runBenchmark() {
  console.log("\n========================================================");
  console.log("   BENCHMARKING DE RENDERIZACAO: JPEG (q1.0) vs PNG     ");
  console.log("========================================================\n");

  const cases: BenchResult[] = [];

  // 1. Grid 3x3
  const grid3x3 = generateMockGridData(9);
  const res3x3 = await benchmarkCase(
    "Grid 3x3",
    (fmt) => ({
      ...gridlfTemplate({
        lastfm_data: grid3x3,
        columns: 3,
        rows: 3,
        media_type: "albums",
      }),
      format: fmt,
    }),
    "1260x1260",
  );
  cases.push(...res3x3);

  // 2. Grid 5x5
  const grid5x5 = generateMockGridData(25);
  const res5x5 = await benchmarkCase(
    "Grid 5x5",
    (fmt) => ({
      ...gridlfTemplate({
        lastfm_data: grid5x5,
        columns: 5,
        rows: 5,
        media_type: "albums",
      }),
      format: fmt,
    }),
    "1800x1800",
  );
  cases.push(...res5x5);

  // 3. Grid 10x10
  const grid10x10 = generateMockGridData(100);
  const res10x10 = await benchmarkCase(
    "Grid 10x10",
    (fmt) => ({
      ...gridlfTemplate({
        lastfm_data: grid10x10,
        columns: 10,
        rows: 10,
        media_type: "albums",
      }),
      format: fmt,
    }),
    "1800x1800",
  );
  cases.push(...res10x10);

  // 4. Calendario
  const resCalendar = await benchmarkCase(
    "Calendar",
    (fmt) => ({
      ...calendarlfTemplate({
        year: 2026,
        monthIndex: 7,
        media_type: "albums",
        daysData: new Map(),
      }),
      format: fmt,
    }),
    "1080x1350",
  );
  cases.push(...resCalendar);

  // 5. Vinil
  const resVinyl = await benchmarkCase(
    "Vinyl",
    (fmt) => ({
      ...vinyllfTemplate({
        lastfm_data: {
          track: "Song Title",
          album: "Album Title",
          artist: "Artist Name",
          userplaycount: 42,
          image: "./docs/assets/logo.jpg",
          isNowPlaying: true,
        },
        media_type: "tracks",
      }),
      format: fmt,
    }),
    "1080x1080",
  );
  cases.push(...resVinyl);

  console.table(cases);

  console.log("\n--- ANALISE COMPARATIVA ---");
  for (let i = 0; i < cases.length; i += 2) {
    const jpg = cases[i];
    const png = cases[i + 1];
    const speedRatio = (png.renderMs / jpg.renderMs).toFixed(2);
    const sizeRatio = (png.sizeKb / jpg.sizeKb).toFixed(2);
    console.log(
      `* ${jpg.template} (${jpg.dimension}): JPG levou ${jpg.renderMs}ms (${jpg.sizeKb}KB) vs PNG ${png.renderMs}ms (${png.sizeKb}KB) -> JPG e ${speedRatio}x mais rapido e ${sizeRatio}x menor`,
    );
  }
}

if (import.meta.main) {
  runBenchmark();
}
