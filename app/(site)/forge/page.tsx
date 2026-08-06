import type { Metadata } from "next";
import { ForgeWizard } from "@/components/forge/forge-wizard";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Robot Forge",
  description:
    "Génère un projet ROS 2 complet : paquet, launch files, URDF, configuration Nav2, nomenclature et schéma de câblage, téléchargeables en .zip."
};

export default function ForgePage({
  searchParams
}: {
  searchParams: { archetype?: string };
}) {
  return (
    <>
      <PageHeader
        kicker="Forge"
        title="Robot Forge"
        intro="Choisis un archétype, ajuste le matériel et les cotes, et récupère un projet ROS 2 qui compile : paquet complet, launch files en couches, URDF cohérent, configuration Nav2, nomenclature et schéma de câblage."
      />

      <section className="px-6 py-14 lg:px-16 lg:py-20">
        <div className="mx-auto max-w-[1500px]">
          <ForgeWizard archetypeInitial={searchParams.archetype} />
        </div>
      </section>
    </>
  );
}
