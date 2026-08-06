import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hairlines, HudLabel } from "@/components/ui/primitives";
import { TOTAL_LESSONS } from "@/content/tracks";
import { COMPONENTS } from "@/content/components";

/** Étiquette HUD avec ligne de rappel, posée sur l'image du robot. */
function Annotation({
  label,
  className,
  side = "left"
}: {
  label: string;
  className?: string;
  side?: "left" | "right";
}) {
  return (
    <div className={`pointer-events-none absolute hidden lg:block ${className}`}>
      <div
        className={`flex items-center gap-2 ${
          side === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <span className="h-px w-12 bg-line2" />
        <span className="border-b border-line2 pb-1 font-display text-[9px] uppercase tracking-hud text-muted">
          {label}
        </span>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden">
      <Hairlines className="opacity-30" />

      {/* Lueur d'ambiance */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-0 h-[720px] w-[720px] rounded-full bg-accent/10 blur-[140px]"
      />

      <div className="relative mx-auto grid w-full max-w-[1600px] grid-cols-1 items-center gap-8 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:px-16 lg:py-0">
        {/* ─── Colonne texte ─── */}
        <div className="relative z-10 max-w-xl">
          <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
            <HudLabel side="right">Ici et maintenant</HudLabel>
          </div>

          <h1
            className="mega mt-5 animate-fade-up text-[15vw] leading-[0.85] sm:text-[11vw] lg:text-[7.5rem]"
            style={{ animationDelay: "160ms" }}
          >
            <span className="relative inline-block">
              <span
                aria-hidden
                className="absolute -left-[0.14em] -top-[0.08em] -z-10 h-[1.1em] w-[0.86em] bg-accent shadow-glow"
              />
              R
            </span>
            OBOT
          </h1>

          <p
            className="mt-8 max-w-md animate-fade-up border-l border-line2 pl-5 text-sm leading-relaxed text-muted"
            style={{ animationDelay: "260ms" }}
          >
            Ceux qui construisent des robots ne partent pas d&apos;une idée, mais
            d&apos;un composant, d&apos;un bus et d&apos;un repère.
            <br />
            Voici les deux.
          </p>

          <div
            className="mt-12 flex animate-fade-up flex-wrap items-center gap-4"
            style={{ animationDelay: "340ms" }}
          >
            <Link
              href="/academy"
              className="group inline-flex items-center gap-4 border border-line2 px-8 py-4 font-display text-[11px] uppercase tracking-hud text-ink transition-all duration-300 hover:border-accent2 hover:text-accent2"
            >
              Commencer
              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/forge"
              className="font-display text-[11px] uppercase tracking-hud text-muted transition-colors hover:text-ink"
            >
              Ou générer un projet
            </Link>
          </div>

          <div
            className="mt-16 flex animate-fade-up gap-10"
            style={{ animationDelay: "420ms" }}
          >
            {[
              ["Leçons", TOTAL_LESSONS],
              ["Composants", COMPONENTS.length],
              ["Distribution", "Jazzy"]
            ].map(([k, v]) => (
              <div key={String(k)}>
                <p className="font-display text-2xl text-ink">{v}</p>
                <p className="hud mt-1">{k}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Colonne robot ─── */}
        <div className="relative h-[420px] animate-fade-in lg:h-[calc(100vh-5rem)]">
          <div className="relative h-full w-full">
            <Image
              src="/placeholders/hero-robot.svg"
              alt=""
              fill
              priority
              className="object-contain object-bottom opacity-90"
            />
          </div>

          <Annotation label="Perception" className="right-4 top-[18%]" side="right" />
          <Annotation label="Node · /scan" className="left-2 top-[42%]" />
          <Annotation label="base_link" className="right-8 top-[62%]" side="right" />
          <Annotation label="12 V · 5 A" className="left-6 top-[78%]" />
        </div>
      </div>

      {/* Bandeau bas, comme les cartes de la référence */}
      <div className="absolute inset-x-0 bottom-0 hidden lg:block">
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-px border-t border-line bg-line lg:ml-auto lg:mr-16 lg:max-w-3xl">
          {[
            {
              t: "Comprendre",
              d: "Six parcours, du premier node à la navigation autonome.",
              href: "/academy"
            },
            {
              t: "Construire",
              d: "Câblage validé, graphe simulé, projet ROS 2 généré.",
              href: "/forge"
            }
          ].map((c) => (
            <Link
              key={c.t}
              href={c.href}
              className="group bg-panel/80 px-8 py-7 backdrop-blur-sm transition-colors hover:bg-panel2"
            >
              <p className="font-display text-xs uppercase tracking-hud text-ink transition-colors group-hover:text-accent2">
                {c.t}
              </p>
              <p className="mt-2.5 max-w-xs text-xs leading-relaxed text-muted">
                {c.d}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
