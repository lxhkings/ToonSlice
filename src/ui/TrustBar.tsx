export function TrustBar() {
  return (
    <section className="w-full flex flex-wrap justify-center gap-12 border-t border-b border-outline-variant py-8 bg-surface-container-lowest">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">lock</span>
        <div className="flex flex-col">
          <span className="font-label-caps text-label-caps text-on-surface font-semibold">
            Private &amp; Secure
          </span>
          <span className="font-utility-mono text-utility-mono text-on-surface-variant">
            No server uploads
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">bolt</span>
        <div className="flex flex-col">
          <span className="font-label-caps text-label-caps text-on-surface font-semibold">
            Fast Processing
          </span>
          <span className="font-utility-mono text-utility-mono text-on-surface-variant">
            Instant browser slicing
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">
          check_circle
        </span>
        <div className="flex flex-col">
          <span className="font-label-caps text-label-caps text-on-surface font-semibold">
            Webtoon Ready
          </span>
          <span className="font-utility-mono text-utility-mono text-on-surface-variant">
            Perfect for Tapas/Webtoon
          </span>
        </div>
      </div>
    </section>
  );
}
