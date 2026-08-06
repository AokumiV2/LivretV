import Link from "next/link";
import type { ReactNode } from "react";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export { cx };

/* ─────────────── Libellé HUD avec ligne de rappel ─────────────── */

export function HudLabel({
  children,
  side = "right",
  className
}: {
  children: ReactNode;
  side?: "left" | "right";
  className?: string;
}) {
  return (
    <span className={cx("inline-flex items-center gap-3", className)}>
      {side === "left" && <span className="h-px w-10 bg-line2" />}
      <span className="hud whitespace-nowrap">{children}</span>
      {side === "right" && <span className="h-px w-10 bg-line2" />}
    </span>
  );
}

/* ─────────────── Crochets d'angle ─────────────── */

export function CornerFrame({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("relative", className)}>
      <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-line2" />
      <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-line2" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-line2" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-line2" />
      {children}
    </div>
  );
}

/* ─────────────── Titre de section ─────────────── */

export function SectionTitle({
  kicker,
  title,
  accentFirst = false,
  className
}: {
  kicker?: string;
  title: string;
  accentFirst?: boolean;
  className?: string;
}) {
  const first = title.charAt(0);
  const rest = title.slice(1);

  return (
    <div className={cx("relative", className)}>
      {kicker && (
        <div className="mb-4">
          <HudLabel side="left">{kicker}</HudLabel>
        </div>
      )}
      <h2 className="mega text-4xl sm:text-5xl lg:text-6xl">
        {accentFirst ? (
          <>
            <span className="relative inline-block">
              <span className="absolute -left-2 -top-1 -z-10 h-[1.15em] w-[0.9em] bg-accent" />
              {first}
            </span>
            {rest}
          </>
        ) : (
          title
        )}
      </h2>
    </div>
  );
}

/* ─────────────── Bloc d'accent bleu ─────────────── */

export function AccentBlock({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cx("absolute -z-10 bg-accent shadow-glow", className)}
    />
  );
}

/* ─────────────── Panneau ─────────────── */

export function Panel({
  children,
  className,
  hover = false
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cx(
        "border border-line bg-panel/70 backdrop-blur-sm",
        hover &&
          "transition-colors duration-300 hover:border-line2 hover:bg-panel2/70",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─────────────── Bouton / lien bouton ─────────────── */

type BtnProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "outline" | "solid" | "ghost";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
};

export function Btn({
  children,
  href,
  onClick,
  variant = "outline",
  size = "md",
  className,
  disabled,
  type = "button"
}: BtnProps) {
  const base = cx(
    "group relative inline-flex items-center justify-center gap-3 font-display uppercase tracking-hud transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40",
    size === "sm" ? "px-5 py-2.5 text-[10px]" : "px-8 py-4 text-[11px]",
    variant === "outline" &&
      "border border-line2 text-ink hover:border-accent2 hover:text-accent2",
    variant === "solid" && "bg-accent text-white hover:bg-accent/85",
    variant === "ghost" && "text-muted hover:text-ink",
    className
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base}>
      {children}
    </button>
  );
}

/* ─────────────── Étiquette ─────────────── */

export function Tag({
  children,
  tone = "neutral",
  className
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "good" | "warn" | "bad";
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center border px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest",
        tone === "neutral" && "border-line2 text-muted",
        tone === "accent" && "border-accent2/40 bg-accent2/5 text-accent2",
        tone === "good" && "border-good/40 bg-good/5 text-good",
        tone === "warn" && "border-warn/40 bg-warn/5 text-warn",
        tone === "bad" && "border-bad/40 bg-bad/5 text-bad",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ─────────────── Overlays d'ambiance ─────────────── */

export function Scanlines() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035] noise mix-blend-overlay"
    />
  );
}

export function Hairlines({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx(
        "pointer-events-none absolute inset-0 hairlines opacity-40",
        className
      )}
    />
  );
}

/* ─────────────── Barre de progression ─────────────── */

export function Meter({
  value,
  max = 100,
  tone = "accent",
  className
}: {
  value: number;
  max?: number;
  tone?: "accent" | "good" | "warn" | "bad";
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={cx("h-1 w-full bg-line", className)}>
      <div
        className={cx(
          "h-full transition-[width] duration-700",
          tone === "accent" && "bg-accent2",
          tone === "good" && "bg-good",
          tone === "warn" && "bg-warn",
          tone === "bad" && "bg-bad"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ─────────────── En-tête de page interne ─────────────── */

export function PageHeader({
  kicker,
  title,
  intro,
  right
}: {
  kicker: string;
  title: string;
  intro?: string;
  right?: ReactNode;
}) {
  return (
    <header className="relative border-b border-line px-6 py-16 lg:px-16 lg:py-24">
      <Hairlines className="opacity-25" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <HudLabel side="left">{kicker}</HudLabel>
          <h1 className="mega mt-5 text-4xl sm:text-5xl lg:text-6xl">{title}</h1>
          {intro && (
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">
              {intro}
            </p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </header>
  );
}
