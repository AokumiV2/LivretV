import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Package,
  X,
  Zap
} from "lucide-react";
import {
  COMPONENTS,
  CATEGORY_LABEL,
  getComponent,
  getComponents
} from "@/content/components";
import { Hairlines, HudLabel, Tag, cx } from "@/components/ui/primitives";

export function generateStaticParams() {
  return COMPONENTS.map((c) => ({ slug: c.id }));
}

export function generateMetadata({
  params
}: {
  params: { slug: string };
}): Metadata {
  const c = getComponent(params.slug);
  if (!c) return { title: "Composant introuvable" };
  return { title: c.name, description: c.tagline };
}

const PIN_TONE: Record<string, string> = {
  GND: "text-muted",
  "5V": "text-bad",
  "3V3": "text-warn",
  VIN: "text-bad",
  SDA: "text-accent2",
  SCL: "text-accent2",
  TX: "text-good",
  RX: "text-good",
  PWM: "text-accent2",
  MOTOR: "text-warn"
};

export default function ComponentPage({
  params
}: {
  params: { slug: string };
}) {
  const c = getComponent(params.slug);
  if (!c) notFound();

  const compatibles = getComponents(c.worksWith);
  const puissance = ((c.voltage.nominal * c.currentMa.typ) / 1000).toFixed(1);

  return (
    <article>
      {/* ─── En-tête ─── */}
      <header className="relative border-b border-line px-6 py-14 lg:px-16 lg:py-20">
        <Hairlines className="opacity-20" />
        <div className="relative mx-auto max-w-6xl">
          <nav className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            <Link href="/codex" className="transition-colors hover:text-ink">
              Codex
            </Link>
            <span>/</span>
            <Link
              href={`/codex?cat=${c.category}`}
              className="transition-colors hover:text-ink"
            >
              {CATEGORY_LABEL[c.category]}
            </Link>
          </nav>

          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="mega text-3xl sm:text-4xl lg:text-5xl">{c.name}</h1>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                {c.brand}
              </p>
              <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-muted">
                {c.tagline}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Tag
                  tone={
                    c.level === "Débutant"
                      ? "good"
                      : c.level === "Intermédiaire"
                        ? "warn"
                        : "bad"
                  }
                >
                  {c.level}
                </Tag>
                {c.buses.map((b) => (
                  <Tag key={b} tone="accent">
                    {b}
                  </Tag>
                ))}
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-x-10 gap-y-5 lg:grid-cols-1 lg:text-right">
              <div>
                <p className="font-display text-3xl text-accent2">{c.price} €</p>
                <p className="hud mt-1">Prix indicatif</p>
              </div>
              {c.weightG !== undefined && (
                <div>
                  <p className="font-display text-xl text-ink">{c.weightG} g</p>
                  <p className="hud mt-1">Masse</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Électrique ─── */}
      <section className="border-b border-line bg-panel/25 px-6 py-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center gap-3">
            <Zap size={13} className="text-warn" />
            <HudLabel side="right">Caractéristiques électriques</HudLabel>
          </div>
          <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-5">
            {[
              [
                "Alimentation",
                c.voltage.nominal > 0
                  ? `${c.voltage.min} – ${c.voltage.max} V`
                  : "—"
              ],
              [
                "Nominal",
                c.voltage.nominal > 0 ? `${c.voltage.nominal} V` : "—"
              ],
              ["Courant typique", c.currentMa.typ > 0 ? `${c.currentMa.typ} mA` : "—"],
              ["Courant crête", c.currentMa.peak > 0 ? `${c.currentMa.peak} mA` : "—"],
              c.suppliesMa
                ? ["Fournit", `${c.suppliesMa} mA`]
                : ["Puissance typ.", c.currentMa.typ > 0 ? `${puissance} W` : "—"]
            ].map(([k, v]) => (
              <div key={k} className="bg-bg px-5 py-6">
                <p className="font-display text-lg text-ink">{v}</p>
                <p className="hud mt-2">{k}</p>
              </div>
            ))}
          </div>

          {(c.logicVolts || c.i2cAddress) && (
            <div className="mt-6 flex flex-wrap gap-x-10 gap-y-3 font-mono text-[11px] text-muted">
              {c.logicVolts && (
                <span>
                  Logique&nbsp;
                  <span className={c.logicVolts >= 5 ? "text-bad" : "text-warn"}>
                    {c.logicVolts} V
                  </span>
                </span>
              )}
              {c.i2cAddress && (
                <span>
                  Adresse I2C&nbsp;
                  <span className="text-accent2">{c.i2cAddress}</span>
                  {c.i2cAlternates?.length
                    ? ` · alternatives ${c.i2cAlternates.join(", ")}`
                    : " · non modifiable"}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-16 lg:px-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.5fr_1fr]">
          {/* ─── Colonne principale ─── */}
          <div className="space-y-14">
            <div>
              <HudLabel side="right">Description</HudLabel>
              <p className="mt-5 text-[15px] leading-[1.85] text-ink/80">
                {c.description}
              </p>
            </div>

            {c.gotchas.length > 0 && (
              <div>
                <div className="flex items-center gap-3">
                  <AlertTriangle size={13} className="text-bad" />
                  <HudLabel side="right">Les pièges</HudLabel>
                </div>
                <ul className="mt-5 space-y-3">
                  {c.gotchas.map((g, i) => (
                    <li
                      key={i}
                      className="border-l-2 border-bad/40 bg-bad/[0.04] px-5 py-4 text-sm leading-relaxed text-ink/80"
                    >
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <HudLabel side="right">Points forts</HudLabel>
                <ul className="mt-5 space-y-3">
                  {c.pros.map((p, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink/75">
                      <Check size={13} className="mt-1 shrink-0 text-good" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <HudLabel side="right">Limites</HudLabel>
                <ul className="mt-5 space-y-3">
                  {c.cons.map((p, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink/75">
                      <X size={13} className="mt-1 shrink-0 text-bad" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {c.pins.length > 0 && (
              <div>
                <HudLabel side="right">Brochage</HudLabel>
                <div className="mt-5 flex flex-wrap gap-px bg-line">
                  {c.pins.map((p) => (
                    <div
                      key={p.id}
                      className="min-w-[110px] flex-1 bg-panel/60 px-3 py-3"
                      title={p.note}
                    >
                      <p
                        className={cx(
                          "font-mono text-[11px]",
                          PIN_TONE[p.kind] || "text-ink"
                        )}
                      >
                        {p.label}
                      </p>
                      <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                        {p.volts !== undefined ? `${p.volts} V` : p.kind}
                        {p.tolerant5v && " · tol. 5 V"}
                      </p>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/lab/wiring?add=${c.id}`}
                  className="mt-5 inline-flex items-center gap-3 border border-line2 px-6 py-3 font-display text-[10px] uppercase tracking-hud transition-colors hover:border-accent2 hover:text-accent2"
                >
                  Ouvrir dans le Wiring Lab
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            )}
          </div>

          {/* ─── Colonne latérale ─── */}
          <aside className="space-y-12">
            <div>
              <HudLabel side="right">Spécifications</HudLabel>
              <dl className="mt-5 divide-y divide-line border border-line">
                {c.specs.map((s) => (
                  <div key={s.k} className="flex gap-4 px-4 py-3">
                    <dt className="w-1/2 shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                      {s.k}
                    </dt>
                    <dd className="text-xs leading-relaxed text-ink/85">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {c.rosPackages.length > 0 && (
              <div>
                <div className="flex items-center gap-3">
                  <Package size={13} className="text-accent2" />
                  <HudLabel side="right">Paquets ROS 2</HudLabel>
                </div>
                <ul className="mt-5 space-y-3">
                  {c.rosPackages.map((p) => (
                    <li key={p.name} className="border border-line bg-panel/40 p-4">
                      <p className="font-mono text-[11px] text-accent2">{p.name}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted">
                        {p.note}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {compatibles.length > 0 && (
              <div>
                <HudLabel side="right">Va bien avec</HudLabel>
                <div className="mt-5 space-y-px bg-line">
                  {compatibles.map((w) => (
                    <Link
                      key={w.id}
                      href={`/codex/${w.id}`}
                      className="group flex items-center justify-between gap-3 bg-bg px-4 py-3 transition-colors hover:bg-panel"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs text-ink transition-colors group-hover:text-accent2">
                          {w.name}
                        </span>
                        <span className="block font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                          {CATEGORY_LABEL[w.category]}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-muted">
                        {w.price} €
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </article>
  );
}
