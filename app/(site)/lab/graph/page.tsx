import type { Metadata } from "next";
import { GraphLab } from "@/components/lab/graph-lab";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Node Graph Simulator",
  description:
    "Construis un graphe de nodes ROS 2 : types de messages vérifiés, compatibilité QoS contrôlée, flux animé et ros2 topic echo simulé."
};

export default function GraphPage() {
  return (
    <>
      <PageHeader
        kicker="Laboratoire 02"
        title="Node Graph"
        intro="Le graphe que tu construis est vérifié comme le ferait DDS : types de messages, compatibilité QoS, topics orphelins. Lance la lecture pour voir circuler les messages."
      />

      <section className="px-6 py-12 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1700px]">
          <GraphLab />
        </div>
      </section>
    </>
  );
}
