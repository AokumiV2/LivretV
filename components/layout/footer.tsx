import Link from "next/link";
import { FULL_NAV } from "@/lib/nav";
import { TOTAL_LESSONS, TOTAL_MINUTES } from "@/content/tracks";
import { COMPONENTS } from "@/content/components";
import { QUESTIONS } from "@/content/quiz";

export function Footer() {
  const heures = Math.round(TOTAL_MINUTES / 60);

  return (
    <footer className="relative border-t border-line bg-panel/30">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <span className="font-display text-lg font-medium uppercase tracking-[0.28em]">
              Livret<span className="text-accent2">V</span>
            </span>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              Apprendre la robotique ROS 2 en français, du premier node au robot
              complet. Théorie, matériel, câblage validé et génération de projet.
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-y-4 sm:grid-cols-4">
              {[
                ["Leçons", TOTAL_LESSONS],
                ["Heures", `${heures} h`],
                ["Composants", COMPONENTS.length],
                ["Questions", QUESTIONS.length]
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dd className="font-display text-xl text-ink">{v}</dd>
                  <dt className="hud mt-1">{k}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {FULL_NAV.map((group) => (
              <div key={group.group}>
                <p className="hud mb-4">{group.group}</p>
                <ul className="space-y-2.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted transition-colors hover:text-ink"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            ROS 2 Jazzy Jalisco · Ubuntu 24.04 LTS
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Contenu pédagogique indépendant, sans lien avec Open Robotics
          </p>
        </div>
      </div>
    </footer>
  );
}
