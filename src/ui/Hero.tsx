export function Hero({ label }: { label: string }) {
  return (
    <section className="text-center flex flex-col items-center gap-6 max-w-3xl">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">
        {label} comic formatter &amp; slicer
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
        Slice and resize your comic to {label}-ready panels — in your browser,
        no upload.
      </p>
    </section>
  );
}
