import type { Metadata } from "next";
import { Atelier } from "@/components/sim/atelier";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Atelier — coder ROS 2 et simuler",
  description:
    "Écris de vrais nœuds ROS 2 en Python, exécutés par CPython dans ton navigateur, et regarde-les piloter un robot simulé. Douze missions guidées, des objectifs vérifiés automatiquement, et un export en paquet ament_python."
};

export default function AtelierPage({
  searchParams
}: {
  searchParams?: { mission?: string };
}) {
  return (
    <>
      <PageHeader
        kicker="Atelier"
        title="Coder & Simuler"
        intro="Du vrai Python, exécuté par un vrai CPython compilé en WebAssembly, avec une API rclpy conforme. Le fichier que tu écris ici se dépose sur un robot sans une virgule de changement. Douze missions, du premier nœud à la traversée d'un labyrinthe."
      />

      <section className="px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <div className="mx-auto max-w-[1800px]">
          <Atelier missionInitiale={searchParams?.mission} />
        </div>
      </section>
    </>
  );
}
