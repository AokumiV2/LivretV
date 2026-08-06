import type { Metadata } from "next";
import { GlossaryList } from "@/components/pages/glossary-list";
import { PageHeader } from "@/components/ui/primitives";
import { GLOSSARY } from "@/content/glossary";

export const metadata: Metadata = {
  title: "Glossaire",
  description:
    "Le vocabulaire de ROS 2 et de la robotique expliqué en français : node, topic, QoS, TF2, URDF, costmap, EKF, micro-ROS."
};

export default function GlossairePage() {
  return (
    <>
      <PageHeader
        kicker="Vocabulaire"
        title="Glossaire"
        intro="Les termes que tu croiseras dans la documentation, les forums et les messages d'erreur — expliqués sans supposer que tu les connais déjà."
        right={
          <div>
            <p className="font-display text-2xl text-ink">{GLOSSARY.length}</p>
            <p className="hud mt-1">Entrées</p>
          </div>
        }
      />

      <section className="px-6 py-14 lg:px-16 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <GlossaryList />
        </div>
      </section>
    </>
  );
}
