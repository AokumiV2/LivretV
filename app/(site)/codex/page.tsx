import type { Metadata } from "next";
import { Catalog } from "@/components/codex/catalog";
import { PageHeader } from "@/components/ui/primitives";
import { COMPONENTS, CATEGORY_ORDER } from "@/content/components";
import type { Category } from "@/content/types";

export const metadata: Metadata = {
  title: "Codex",
  description:
    "Catalogue de composants pour la robotique ROS 2 : calculateurs, microcontrôleurs, moteurs, drivers, capteurs, caméras et alimentation."
};

export default function CodexPage({
  searchParams
}: {
  searchParams: { cat?: string };
}) {
  const cat = CATEGORY_ORDER.includes(searchParams.cat as Category)
    ? (searchParams.cat as Category)
    : undefined;

  const prixMoyen = Math.round(
    COMPONENTS.reduce((n, c) => n + c.price, 0) / COMPONENTS.length
  );

  return (
    <>
      <PageHeader
        kicker="Matériel"
        title="Codex"
        intro="Chaque fiche donne la tension, le courant, le brochage, le paquet ROS 2 associé et les pièges. Savoir qu'un encodeur sort en 5 V évite de détruire un Raspberry Pi à 85 €."
        right={
          <div className="flex gap-8">
            <div>
              <p className="font-display text-2xl text-ink">
                {COMPONENTS.length}
              </p>
              <p className="hud mt-1">Fiches</p>
            </div>
            <div>
              <p className="font-display text-2xl text-ink">{prixMoyen} €</p>
              <p className="hud mt-1">Prix moyen</p>
            </div>
          </div>
        }
      />

      <section className="px-6 py-14 lg:px-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <Catalog components={COMPONENTS} categorieInitiale={cat} />
        </div>
      </section>
    </>
  );
}
