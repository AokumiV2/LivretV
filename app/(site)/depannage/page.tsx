import type { Metadata } from "next";
import { Troubleshooter } from "@/components/pages/troubleshooter";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Dépannage",
  description:
    "Arbre de diagnostic guidé pour ROS 2 : topic muet, robot immobile, RViz2 vide, erreurs TF2. Quelques questions et une cause identifiée."
};

export default function DepannagePage() {
  return (
    <>
      <PageHeader
        kicker="Diagnostic"
        title="Dépannage"
        intro="Réponds à quelques questions sur ce que tu observes. L'arbre te mène à la cause probable et aux commandes qui la confirment."
      />

      <section className="px-6 py-16 lg:px-16 lg:py-24">
        <Troubleshooter />
      </section>
    </>
  );
}
