import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { PageHeader, Tag } from "@/components/ui/primitives";
import { TRACKS, TOTAL_LESSONS, TOTAL_MINUTES } from "@/content/tracks";
import { TrackProgress } from "@/components/academy/track-progress";

export const metadata: Metadata = {
  title: "Academy",
  description:
    "Six parcours progressifs pour apprendre ROS 2 : fondations, communication, représentation, navigation, perception et embarqué."
};

export default function AcademyPage() {
  const heures = Math.round(TOTAL_MINUTES / 60);

  return (
    <>
      <PageHeader
        kicker="Academy"
        title="Six parcours"
        intro="Ils s'enchaînent dans l'ordre, mais rien ne t'oblige à le suivre. Chaque leçon est autonome, avec son code, ses commandes et les pièges que personne ne signale avant qu'il ne soit trop tard."
        right={
          <div className="flex gap-8">
            {[
              ["Leçons", TOTAL_LESSONS],
              ["Heures", `${heures} h`],
              ["Parcours", TRACKS.length]
            ].map(([k, v]) => (
              <div key={String(k)}>
                <p className="font-display text-2xl text-ink">{v}</p>
                <p className="hud mt-1">{k}</p>
              </div>
            ))}
          </div>
        }
      />

      <section className="px-6 py-16 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-7xl space-y-px bg-line">
          {TRACKS.map((t) => (
            <div key={t.slug} className="bg-bg">
              <Link
                href={`/academy/${t.slug}`}
                className="group grid gap-6 p-8 transition-colors hover:bg-panel lg:grid-cols-[100px_1fr_260px] lg:items-center lg:gap-10 lg:p-10"
              >
                <div className="flex items-center gap-4 lg:block">
                  <span
                    className="font-display text-4xl font-light lg:text-5xl"
                    style={{ color: t.color }}
                  >
                    {String(t.index).padStart(2, "0")}
                  </span>
                </div>

                <div>
                  <h2 className="mega text-2xl text-ink transition-colors group-hover:text-accent2 lg:text-3xl">
                    {t.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted">{t.tagline}</p>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/70">
                    {t.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {t.lessons.slice(0, 4).map((l) => (
                      <Tag key={l.slug}>{l.title}</Tag>
                    ))}
                    {t.lessons.length > 4 && (
                      <Tag>+{t.lessons.length - 4}</Tag>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6 lg:flex-col lg:items-end lg:gap-4">
                  <TrackProgress slug={t.slug} total={t.lessons.length} />
                  <ArrowUpRight
                    size={20}
                    className="text-muted transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent2"
                  />
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
