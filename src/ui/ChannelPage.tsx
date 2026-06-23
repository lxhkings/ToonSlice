import { useEffect } from "react";
import type { ChannelSpec } from "../channels/types";
import { Workspace } from "./Workspace";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { TrustBar } from "./TrustBar";
import { HowItWorks } from "./HowItWorks";
import { Footer } from "./Footer";

// Landing page = tool pre-configured for one channel.
// Below the tool: spec reference (SEO deep content) + affiliate slot.
export function ChannelPage({ spec }: { spec: ChannelSpec }) {
  useEffect(() => {
    document.title = spec.seo.title;
    setMeta("description", spec.seo.description);
  }, [spec]);

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <Header activeChannelId={spec.id} />

      <main className="flex-grow flex flex-col items-center justify-start pt-16 pb-24 px-margin-page w-full max-w-6xl mx-auto gap-16 relative z-10">
        <Hero label={spec.label} />

        <Workspace preset={spec} />

        <TrustBar />

        <HowItWorks />

        {/* Spec reference: SEO deep content. Placeholder copy — expand to ≥300 words before launch. */}
        <section className="prose w-full max-w-3xl">
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
        <aside className="text-sm text-on-surface-variant border-t border-outline-variant pt-4 w-full max-w-3xl">
          <p>Recommended gear for comic artists:</p>
          <a
            href="/go/xppen"
            rel="sponsored nofollow"
            className="underline text-primary"
          >
            XP-Pen drawing tablets
          </a>
          <p className="mt-2 italic">
            Disclosure: links above are affiliate links; we may earn a
            commission.
          </p>
        </aside>
      </main>

      <Footer />
    </div>
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
