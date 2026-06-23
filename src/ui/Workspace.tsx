import { useState } from "react";
import type { ChannelSpec } from "../channels/types";
import { channels } from "../channels";
import {
  loadImage,
  validateFile,
  type LoadedImage,
} from "../platform/loadImage";
import { browserCanvasFactory } from "../platform/browserCanvas";
import { runExport } from "./useExport";
import { downloadZip } from "../pack/download";
import { computeLayout } from "../core/layout";
import { sliceSegments } from "../core/slice";
import { checkTotalHeight, checkCarouselPages } from "../core/limits";
import {
  pageHeightFor,
  type CarouselAspect,
} from "../exporters/carouselSlice";

type Status =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "done" }
  | { kind: "error"; msg: string };

export function Workspace({ preset }: { preset: ChannelSpec }) {
  const [spec, setSpec] = useState<ChannelSpec>(preset);
  const [items, setItems] = useState<LoadedImage[]>([]);
  const [gutter, setGutter] = useState(40);
  const [watermark, setWatermark] = useState(true);
  const [aspect, setAspect] = useState<CarouselAspect>("4:5");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const isCarousel = spec.exporter === "carouselPage";

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const next: LoadedImage[] = [];
    for (const f of Array.from(files)) {
      const err = validateFile(f, spec.maxFileSize);
      if (err) {
        setStatus({ kind: "error", msg: `${f.name}: ${err}` });
        continue;
      }
      try {
        next.push(await loadImage(f));
      } catch {
        setStatus({ kind: "error", msg: `${f.name}: DECODE_FAILED` });
      }
    }
    setItems((prev) => [...prev, ...next].slice(0, 30));
  }

  async function onExport() {
    if (items.length === 0) return;
    // pre-check total height before running expensive canvas pipeline
    const layout = computeLayout(
      items.map((it) => it.size),
      spec.canvasWidth,
      gutter,
      watermark
    );
    const tooTall = checkTotalHeight(layout.totalHeight);
    if (tooTall) {
      setStatus({ kind: "error", msg: "TOO_TALL: reduce images" });
      return;
    }
    if (isCarousel) {
      const pageHeight = pageHeightFor(spec.canvasWidth, aspect);
      const segments = sliceSegments(layout.totalHeight, layout.gutters, pageHeight);
      const tooMany = checkCarouselPages(segments.length);
      if (tooMany) {
        setStatus({
          kind: "error",
          msg: "TOO_MANY_SLIDES: reduce images or raise gutter",
        });
        return;
      }
    }
    setStatus({ kind: "working" });
    try {
      const buf = await runExport(
        items,
        spec,
        gutter,
        watermark,
        browserCanvasFactory,
        aspect
      );
      downloadZip(buf, `toonslice-${spec.id}.zip`);
      setStatus({ kind: "done" });
    } catch (e) {
      setStatus({ kind: "error", msg: (e as Error).message });
    }
  }

  return (
    <section className="w-full flex flex-col lg:flex-row gap-8 items-stretch relative">
      {/* Left: Drop zone */}
      <div className="flex-grow w-full lg:w-2/3">
        <div className="h-full min-h-0 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-8 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
          <div
            className="w-full h-full min-h-[400px] border-2 border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center p-8 gap-4 bg-surface transition-colors duration-200 cursor-pointer hover:border-primary relative z-10"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
          >
            {items.length === 0 ? (
              <>
                <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-2 shadow-sm">
                  <span className="material-symbols-outlined text-4xl">
                    cut
                  </span>
                </div>
                <div className="text-center flex flex-col gap-2">
                  <p className="font-headline-md text-body-md text-on-surface font-semibold">
                    Drag &amp; Drop Comic Pages Here
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    or click to browse files (JPG, PNG, WebP)
                  </p>
                </div>
              </>
            ) : (
              <div className="w-full max-h-[500px] overflow-auto flex flex-col items-center gap-2 px-4">
                {items.map((it, i) => (
                  <div
                    key={i}
                    className="w-full flex flex-col items-center"
                  >
                    <img
                      src={it.url}
                      alt=""
                      className="w-full rounded border border-outline-variant"
                    />
                    <span className="font-utility-mono text-utility-mono text-on-surface-variant mt-1">
                      panel-{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <label className="mt-4 px-6 py-2 bg-primary text-on-primary rounded font-label-caps text-label-caps shadow-sm hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer">
              Select Files
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Right: Sidebar */}
      <aside className="w-full lg:w-1/3 flex flex-col gap-6 shrink-0">
        {/* Slicing Controls */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm flex flex-col gap-5">
          <h3 className="font-headline-md text-lg text-on-surface font-semibold border-b border-outline-variant pb-3">
            Slicing Controls
          </h3>

          <label className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              Channel
            </span>
            <select
              className="border border-outline-variant rounded p-2 bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              value={spec.id}
              onChange={(e) => setSpec(channels[e.target.value])}
            >
              {Object.values(channels).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-3">
            <label className="font-label-caps text-label-caps text-on-surface-variant flex justify-between items-center">
              Gutter Adjustment
              <span className="font-utility-mono text-primary font-bold bg-primary-fixed/50 px-2 py-0.5 rounded">
                {gutter}px
              </span>
            </label>
            <input
              className="w-full accent-primary"
              max={400}
              min={0}
              type="range"
              value={gutter}
              onChange={(e) => setGutter(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-3 mt-2">
            <input
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
              id="watermark"
              type="checkbox"
              checked={watermark}
              onChange={(e) => setWatermark(e.target.checked)}
            />
            <label
              className="font-body-sm text-on-surface cursor-pointer select-none"
              htmlFor="watermark"
            >
              Viral watermark
            </label>
          </div>

          {isCarousel && (
            <label className="flex flex-col gap-1">
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                Card Aspect
              </span>
              <select
                className="border border-outline-variant rounded p-2 bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                value={aspect}
                onChange={(e) => setAspect(e.target.value as CarouselAspect)}
              >
                <option value="4:5">4:5 (1080×1350)</option>
                <option value="1:1">1:1 (1080×1080)</option>
              </select>
            </label>
          )}

          <button
            disabled={items.length === 0 || status.kind === "working"}
            onClick={onExport}
            className="w-full mt-4 bg-primary text-on-primary px-4 py-3 rounded font-label-caps text-label-caps flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm active:scale-[0.98] disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-lg">
              folder_zip
            </span>
            {status.kind === "working" ? "Exporting…" : "Export ZIP"}
          </button>

          {status.kind === "error" && (
            <p className="text-error font-body-sm text-body-sm">
              {status.msg}
            </p>
          )}
          {status.kind === "done" && <SuccessPanel spec={spec} />}
        </div>

        {/* Tech Specs Info Box */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm flex flex-col gap-4">
          <h3 className="font-headline-md text-lg text-on-surface font-semibold flex items-center gap-2 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary text-xl">
              info
            </span>
            {spec.label} Image Specs
          </h3>
          <ul className="flex flex-col gap-3 font-body-sm text-body-sm text-on-surface-variant">
            <li className="flex justify-between border-b border-outline-variant/30 pb-2">
              <span>Recommended Width</span>
              <span className="font-utility-mono font-semibold text-on-surface">
                {spec.canvasWidth}px
              </span>
            </li>
            <li className="flex justify-between border-b border-outline-variant/30 pb-2">
              <span>Max Panel Height</span>
              <span className="font-utility-mono font-semibold text-on-surface">
                {spec.maxSegmentHeight}px
              </span>
            </li>
            <li className="flex justify-between pb-1">
              <span>Format</span>
              <span className="font-utility-mono font-semibold text-on-surface">
                {spec.format.split("/")[1].toUpperCase()}
              </span>
            </li>
          </ul>
        </div>

        {/* Functional Context */}
        <div className="bg-secondary-fixed border border-outline-variant/50 p-5 rounded-lg shadow-sm">
          <p className="font-body-sm text-body-sm text-on-secondary-container leading-relaxed">
            {spec.label} renders long-form comics as vertically stacked
            panels. ToonSlice aligns every image to {spec.canvasWidth}px wide
            and slices at gutter gaps so panels break cleanly.
          </p>
        </div>
      </aside>
    </section>
  );
}

function SuccessPanel({ spec }: { spec: ChannelSpec }) {
  return (
    <div className="border border-outline-variant rounded-lg p-4 bg-surface-container-low flex flex-col gap-2">
      <p className="font-body-sm text-body-sm text-on-surface font-semibold">
        Done! Your {spec.label} panels are downloading.
      </p>
      <a
        className="font-body-sm text-body-sm text-primary underline"
        href="https://ko-fi.com/toonslice"
        target="_blank"
        rel="noopener"
      >
        ☕ Found this useful? Buy me a coffee
      </a>
    </div>
  );
}
