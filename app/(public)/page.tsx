import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
      <section className="relative overflow-hidden rounded-3xl border border-line bg-[#081311]/90 p-8 shadow-soft md:p-12">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-green-300/10 blur-3xl" />
        <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Livret C</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">Investissement energie avec une experience fintech, en mode green.</h1>
        <p className="mt-4 max-w-2xl text-base text-muted md:text-lg">Achetez des parts de fermes solaires, eoliennes et hydro. Suivez la production, claim vos rendements, puis reinvestissez en un clic.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/app" className="btn-primary">Acceder a l'app</Link>
          <a href="#details" className="btn-soft">Voir le parcours</a>
        </div>
      </section>

      <section id="details" className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ["Parcours instantane", "Connexion rapide, achat de parts, portfolio mis a jour en temps reel."],
          ["Protection et securite", "Reserve safety fund, milestones visuels et suivi des paiements par epoch."],
          ["Pilotage clair", "Map des fermes, data room, incidents, production et PnL sur la meme interface."]
        ].map(([title, text]) => (
          <article key={title} className="card bg-gradient-to-b from-[#0b1a16] to-[#0a1613]">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted">{text}</p>
          </article>
        ))}
      </section>

      <footer className="mt-16 border-t border-line pt-6 text-sm text-muted">Ceci est une demo frontend uniquement, avec donnees mock en localStorage.</footer>
    </div>
  );
}
