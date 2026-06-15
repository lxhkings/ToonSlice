import { useEffect } from "react";
import type { ChannelSpec } from "../channels/types";
import { Workspace } from "./Workspace";

// Landing page = tool pre-configured for one channel.
// Below the tool: spec reference (SEO deep content) + affiliate slot.
export function ChannelPage({ spec }: { spec: ChannelSpec }) {
  useEffect(() => {
    document.title = spec.seo.title;
    setMeta("description", spec.seo.description);
  }, [spec]);

  return (
    <main className="max-w-3xl mx-auto p-4 flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold">
          {spec.label} comic formatter & slicer
        </h1>
        <p className="text-gray-600">
          Slice and resize your comic to {spec.label}-ready panels — in your
          browser, no upload.
        </p>
      </header>

      <Workspace preset={spec} />

      {/* Spec reference: SEO deep content. Placeholder copy — expand to ≥300 words before launch. */}
      <section className="prose">
        <h2>{spec.label} image specs</h2>
        <ul>
          <li>Recommended width: {spec.canvasWidth}px</li>
          <li>Max panel height: {spec.maxSegmentHeight}px</li>
          <li>Format: PNG</li>
        </ul>
        <p>
          {spec.label} renders long-form comics as vertically stacked panels.
          ToonSlice aligns every image to {spec.canvasWidth}px wide and slices
          at gutter gaps so panels break cleanly. (Expand to a full guide before
          launch — see monetization spec §5.)
        </p>
      </section>

      {/* Affiliate slot — rel=sponsored nofollow + FTC disclosure */}
      {/* TODO(pre-launch): /go/* are placeholders; wire to real affiliate URLs
          (XP-Pen / Amazon) after account approval. Until then they fall through
          App.tsx "*" → redirect home. See delivery report "上线前必补". */}
      <aside className="text-sm text-gray-500 border-t pt-4">
        <p>Recommended gear for comic artists:</p>
        <a
          href="/go/xppen"
          rel="sponsored nofollow"
          className="underline"
        >
          XP-Pen drawing tablets
        </a>
        <p className="mt-2 italic">
          Disclosure: links above are affiliate links; we may earn a
          commission.
        </p>
      </aside>
    </main>
  );
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
