import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Hero } from "@/components/home/hero";
import {
  Hairlines,
  HudLabel,
  SectionTitle,
  Tag
} from "@/components/ui/primitives";
import { TRACKS } from "@/content/tracks";
import { ARCHETYPES } from "@/content/archetypes";
import { CATEGORY_LABEL, countByCategory } from "@/content/components";

const OUTILS = [
  {
    n: "01",
    titre: "Wiring Lab",
    href: "/lab/wiring",
    desc: "Pose tes composants, relie les broches. L'application détecte les conflits de tension, les adresses I2C en double et les budgets de courant dépassés avant que la fumée ne sorte.",
    tags: ["Validation", "Budget d'énergie", "Export BOM"]
  },
  {
    n: "02",
    titre: "Node Graph",
    href: "/lab/graph",
    desc: "Construis un graphe de nodes et de topics. Types de messages vérifiés, compatibilité QoS contrôlée, et un flux animé avec un ros2 topic echo simulé.",
    tags: ["QoS", "Types de messages", "Lecture animée"]
  },
  {
    n: "03",
    titre: "Robot Forge",
    href: "/forge",
    desc: "Choisis un archétype, ajuste la stack, et récupère un projet ROS 2 complet : package, launch files, URDF, configuration Nav2, BOM et schéma de câblage.",
    tags: ["Génération", "URDF", "Archive .zip"]
  }
];

export default function Home() {
  const counts = countByCategory();

  return (
    <>
      <Hero />

      {/* ─────────── Parcours ─────────── */}
      <section className="relative border-t border-line px-6 py-24 lg:px-16 lg:py-32">
        <Hairlines className="opacity-20" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionTitle kicker="Academy" title="Parcours" accentFirst />
            <p className="max-w-md text-sm leading-relaxed text-muted">
              Six parcours qui s&apos;enchaînent. Chaque leçon contient du code
              Python et C++, les commandes à taper, et surtout les pièges qui
              coûtent un week-end quand personne ne les a signalés.
            </p>
          </div>

          <div className="mt-16 grid gap-px bg-line md:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((t) => (
              <Link
                key={t.slug}
                href={`/academy/${t.slug}`}
                className="group relative overflow-hidden bg-bg p-8 transition-colors duration-300 hover:bg-panel"
              >
                {/* Vignette en fond : elle se révèle au survol, sans jamais
                    passer devant le texte. */}
                <Image
                  src={`/images/tracks/${t.slug}.png`}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover opacity-[0.14] transition-opacity duration-500 group-hover:opacity-[0.3]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-bg via-bg/85 to-bg/45 transition-colors duration-500 group-hover:from-bg group-hover:via-bg/75"
                />
                <span
                  aria-hidden
                  className="absolute left-0 top-0 h-px w-0 transition-all duration-500 group-hover:w-full"
                  style={{ backgroundColor: t.color }}
                />
                <div className="relative flex items-start justify-between">
                  <span
                    className="font-display text-3xl font-light"
                    style={{ color: t.color }}
                  >
                    {String(t.index).padStart(2, "0")}
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                  />
                </div>

                <h3 className="mega relative mt-8 text-xl text-ink lg:text-2xl">
                  {t.title}
                </h3>
                <p className="relative mt-3 text-sm leading-relaxed text-muted">
                  {t.tagline}
                </p>

                <div className="relative mt-8 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  <span>{t.lessons.length} leçons</span>
                  <span className="h-px w-4 bg-line2" />
                  <span>
                    {t.lessons.reduce((n, l) => n + l.minutes, 0)} min
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Outils ─────────── */}
      <section className="relative border-t border-line bg-panel/20 px-6 py-24 lg:px-16 lg:py-32">
        <div className="relative mx-auto max-w-7xl">
          <SectionTitle kicker="Laboratoires" title="Outils" accentFirst />

          <div className="mt-16 space-y-px bg-line">
            {OUTILS.map((o) => (
              <Link
                key={o.titre}
                href={o.href}
                className="group grid gap-6 bg-bg p-8 transition-colors duration-300 hover:bg-panel lg:grid-cols-[80px_1fr_auto] lg:items-center lg:gap-10 lg:p-10"
              >
                <span className="font-display text-4xl font-light text-line2 transition-colors duration-300 group-hover:text-accent">
                  {o.n}
                </span>

                <div>
                  <h3 className="mega text-2xl text-ink transition-colors group-hover:text-accent2 lg:text-3xl">
                    {o.titre}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                    {o.desc}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {o.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </div>

                <ArrowUpRight
                  size={22}
                  className="hidden text-muted transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent2 lg:block"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Codex ─────────── */}
      <section className="relative border-t border-line px-6 py-24 lg:px-16 lg:py-32">
        <Hairlines className="opacity-20" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <SectionTitle kicker="Matériel" title="Codex" accentFirst />
              <p className="mt-8 max-w-md text-sm leading-relaxed text-muted">
                Chaque fiche donne la tension, le courant, le brochage, le paquet
                ROS 2 associé, le prix — et les pièges. Parce que savoir qu&apos;un
                encodeur sort en 5 V évite de griller un Raspberry Pi à 85 €.
              </p>
              <Link
                href="/codex"
                className="mt-10 inline-flex items-center gap-4 border border-line2 px-8 py-4 font-display text-[11px] uppercase tracking-hud transition-colors hover:border-accent2 hover:text-accent2"
              >
                Ouvrir le catalogue
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3">
              {Object.entries(counts).map(([cat, n]) => (
                <Link
                  key={cat}
                  href={`/codex?cat=${cat}`}
                  className="group bg-bg px-5 py-7 transition-colors hover:bg-panel"
                >
                  <p className="font-display text-2xl text-ink transition-colors group-hover:text-accent2">
                    {String(n).padStart(2, "0")}
                  </p>
                  <p className="hud mt-2">
                    {CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL]}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Archétypes ─────────── */}
      <section className="relative border-t border-line bg-panel/20 px-6 py-24 lg:px-16 lg:py-32">
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionTitle kicker="Forge" title="Archétypes" accentFirst />
            <p className="max-w-md text-sm leading-relaxed text-muted">
              Quatre configurations complètes, du robot de table à l&apos;AMR
              d&apos;extérieur. Chacune génère un projet ROS 2 qui compile.
            </p>
          </div>

          <div className="mt-16 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
            {ARCHETYPES.map((a) => (
              <Link
                key={a.id}
                href={`/forge?archetype=${a.id}`}
                className="group flex flex-col bg-bg transition-colors hover:bg-panel"
              >
                <div className="relative aspect-[3/2] overflow-hidden border-b border-line">
                  <Image
                    src={`/images/archetypes/${a.id}.png`}
                    alt={a.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-bg/90 via-transparent to-transparent"
                  />
                </div>
                <div className="flex flex-1 flex-col items-start p-8">
                <Tag
                  tone={
                    a.difficulty === "Débutant"
                      ? "good"
                      : a.difficulty === "Intermédiaire"
                        ? "warn"
                        : "bad"
                  }
                >
                  {a.difficulty}
                </Tag>
                <h3 className="mega mt-6 text-lg text-ink transition-colors group-hover:text-accent2">
                  {a.name}
                </h3>
                <p className="mt-3 flex-1 text-xs leading-relaxed text-muted">
                  {a.tagline}
                </p>
                <div className="mt-6 border-t border-line pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  {a.budget[0]} – {a.budget[1]} € · {a.buildDays} j
                </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Appel final ─────────── */}
      <section className="relative overflow-hidden border-t border-line px-6 py-28 lg:px-16 lg:py-40">
        <Hairlines className="opacity-20" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px]"
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <HudLabel side="left">Prêt</HudLabel>
          <h2 className="mega mt-6 text-4xl sm:text-5xl lg:text-6xl">
            Construis
            <br />
            <span className="text-accent2">quelque chose</span>
          </h2>
          <p className="mx-auto mt-8 max-w-lg text-sm leading-relaxed text-muted">
            Commence par la première leçon si tu débutes, ou saute directement
            dans la Forge si tu sais déjà ce que tu veux fabriquer.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/academy/fondations/pourquoi-ros2"
              className="inline-flex items-center gap-4 bg-accent px-9 py-4 font-display text-[11px] uppercase tracking-hud text-white transition-colors hover:bg-accent/85"
            >
              Première leçon
              <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/forge"
              className="inline-flex items-center gap-4 border border-line2 px-9 py-4 font-display text-[11px] uppercase tracking-hud transition-colors hover:border-accent2 hover:text-accent2"
            >
              Robot Forge
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
