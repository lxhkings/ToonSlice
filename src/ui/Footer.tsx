import { Link } from "react-router-dom";
import { channels } from "../channels";

export function Footer() {
  return (
    <footer className="bg-surface-container-low w-full py-8 border-t border-outline-variant shrink-0 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-center px-margin-page w-full max-w-7xl mx-auto gap-4">
        <div className="flex items-center gap-6">
          {Object.values(channels).map((c) => (
            <Link
              key={c.id}
              to={`/${c.id}`}
              className="font-label-caps text-label-caps text-on-surface hover:text-primary transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-6 justify-center">
          <span className="font-utility-mono text-utility-mono text-on-surface-variant">
            100% Client-side Processing
          </span>
        </div>
      </div>
      <div className="px-margin-page w-full max-w-7xl mx-auto text-center md:text-left">
        <span className="font-utility-mono text-utility-mono text-on-surface-variant">
          © ToonSlice
        </span>
      </div>
    </footer>
  );
}
