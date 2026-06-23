import { Link } from "react-router-dom";
import { channels } from "../channels";

export function Header({ activeChannelId }: { activeChannelId: string }) {
  return (
    <header className="bg-surface-container-lowest w-full h-toolbar-height border-b border-outline-variant flex justify-between items-center px-margin-page shrink-0 relative z-50">
      <div className="flex items-center gap-6">
        <span className="font-headline-md text-headline-md font-bold text-on-surface">
          ToonSlice
        </span>
        <nav className="hidden md:flex gap-6 items-center h-full">
          {Object.values(channels).map((c) => (
            <Link
              key={c.id}
              to={`/${c.id}`}
              className={
                c.id === activeChannelId
                  ? "font-body-md text-body-md text-primary border-b-2 border-primary pb-1 h-full flex items-center px-2"
                  : "font-body-md text-body-md text-secondary h-full flex items-center hover:bg-secondary-container/50 transition-colors px-2"
              }
            >
              {c.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
