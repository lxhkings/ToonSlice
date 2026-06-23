const STEPS = [
  {
    n: "01",
    icon: "upload_file",
    title: "Upload",
    body: "Drag and drop your long vertically scrolling comic pages.",
  },
  {
    n: "02",
    icon: "settings_overscan",
    title: "Customize Slice",
    body: "Set target width (e.g., 800px) and max height for slices.",
  },
  {
    n: "03",
    icon: "folder_zip",
    title: "Download Zip",
    body: "Get a perfectly organized ZIP file ready for upload.",
  },
];

export function HowItWorks() {
  return (
    <section className="w-full flex flex-col items-center gap-8">
      <h2 className="font-headline-md text-headline-md text-on-surface">
        How it Works
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="bg-surface-container-lowest border border-outline-variant p-6 rounded-lg shadow-sm flex flex-col items-start gap-4 relative overflow-hidden"
          >
            <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center font-utility-mono text-utility-mono text-on-surface font-bold absolute top-6 right-6">
              {s.n}
            </div>
            <span className="material-symbols-outlined text-3xl text-secondary">
              {s.icon}
            </span>
            <h3 className="font-body-md text-body-md text-on-surface font-semibold">
              {s.title}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
