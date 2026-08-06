import { SOCIAL_RAIL } from "@/lib/nav";

/** Rail vertical de liens, à droite — signature du design de référence. */
export function VerticalRail() {
  return (
    <aside className="pointer-events-none fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-5 pr-5 xl:flex">
      {SOCIAL_RAIL.map((s) => (
        <a
          key={s.label}
          href={s.href}
          title={s.title}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto font-display text-[11px] uppercase tracking-widest text-muted transition-colors duration-300 hover:text-accent2"
        >
          {s.label}
        </a>
      ))}
      <span className="mt-2 h-16 w-px bg-gradient-to-b from-line2 to-transparent" />
    </aside>
  );
}

/** Compteur vertical à gauche, comme les points de la référence. */
export function LeftRail({ label }: { label: string }) {
  return (
    <aside className="pointer-events-none fixed left-0 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-4 pl-5 xl:flex">
      <span className="h-12 w-px bg-gradient-to-b from-transparent to-line2" />
      <span
        className="hud whitespace-nowrap"
        style={{ writingMode: "vertical-rl" }}
      >
        {label}
      </span>
      <span className="h-12 w-px bg-gradient-to-t from-transparent to-line2" />
    </aside>
  );
}
