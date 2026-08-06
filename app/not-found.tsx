import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="hud">Erreur 404</p>
        <h1 className="mega mt-5 text-5xl lg:text-6xl">
          <span className="relative inline-block">
            <span
              aria-hidden
              className="absolute -left-2 -top-1 -z-10 h-[1.1em] w-[0.86em] bg-accent"
            />
            P
          </span>
          erdu
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Cette page n&apos;existe pas. Comme un repère TF absent de l&apos;arbre :
          le nom est peut-être mal orthographié.
        </p>
        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-3 border border-line2 px-8 py-4 font-display text-[11px] uppercase tracking-hud transition-colors hover:border-accent2 hover:text-accent2"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
