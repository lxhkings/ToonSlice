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
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const carouselComingSoon = spec.exporter === "carouselPage";

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
    if (items.length === 0 || carouselComingSoon) return;
    setStatus({ kind: "working" });
    try {
      const buf = await runExport(
        items,
        spec,
        gutter,
        watermark,
        browserCanvasFactory
      );
      downloadZip(buf, `toonslice-${spec.id}.zip`);
      setStatus({ kind: "done" });
    } catch (e) {
      setStatus({ kind: "error", msg: (e as Error).message });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Channel selector */}
      <select
        className="border rounded p-2 w-48"
        value={spec.id}
        onChange={(e) => setSpec(channels[e.target.value])}
      >
        {Object.values(channels).map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      {/* Drag / upload */}
      <div
        className="border-2 border-dashed rounded p-8 text-center text-gray-500"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
      >
        {items.length === 0
          ? "Drag comic panels here"
          : `${items.length} image(s)`}
        <div className="mt-2">
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Gutter + watermark */}
      <label>
        Gutter: {gutter}px
        <input
          type="range"
          min={0}
          max={400}
          value={gutter}
          onChange={(e) => setGutter(Number(e.target.value))}
          className="w-full"
        />
      </label>
      <label className="flex gap-2 items-center">
        <input
          type="checkbox"
          checked={watermark}
          onChange={(e) => setWatermark(e.target.checked)}
        />
        Viral watermark
      </label>

      {/* CSS preview */}
      <div
        className="border rounded p-2 max-h-96 overflow-auto bg-gray-50"
        style={{ width: 240 }}
      >
        <div className="flex flex-col items-center">
          {items.map((it, i) => (
            <img
              key={i}
              src={it.url}
              alt=""
              style={{
                width: "100%",
                marginBottom:
                  i < items.length - 1 ? gutter / 4 : 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Export */}
      <button
        disabled={
          items.length === 0 ||
          carouselComingSoon ||
          status.kind === "working"
        }
        onClick={onExport}
        className="bg-black text-white rounded p-3 disabled:opacity-40"
      >
        {carouselComingSoon
          ? "Carousel export — coming soon"
          : status.kind === "working"
            ? "Exporting…"
            : "Export ZIP"}
      </button>

      {status.kind === "error" && (
        <p className="text-red-600">{status.msg}</p>
      )}
      {status.kind === "done" && <SuccessPanel spec={spec} />}
    </div>
  );
}

function SuccessPanel({ spec }: { spec: ChannelSpec }) {
  return (
    <div className="border rounded p-4 bg-green-50 flex flex-col gap-2">
      <p className="font-semibold">
        Done! Your {spec.label} panels are downloading.
      </p>
      <a
        className="underline"
        href="https://ko-fi.com/toonslice"
        target="_blank"
        rel="noopener"
      >
        ☕ Found this useful? Buy me a coffee
      </a>
      <a
        className="underline"
        href="/go/clip-studio"
        rel="sponsored nofollow"
      >
        🎨 Next: color your comic with Clip Studio Paint
      </a>
      <p className="text-sm">
        Also posting to Instagram? Try the IG version (coming soon).
      </p>
    </div>
  );
}
