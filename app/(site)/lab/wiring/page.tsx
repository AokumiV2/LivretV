import type { Metadata } from "next";
import { WiringLab } from "@/components/lab/wiring-lab";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Wiring Lab",
  description:
    "Câble virtuellement ton robot : conflits de tension, adresses I2C dupliquées, budget de courant et nomenclature vérifiés en direct."
};

export default function WiringPage({
  searchParams
}: {
  searchParams: { add?: string };
}) {
  return (
    <>
      <PageHeader
        kicker="Laboratoire 01"
        title="Wiring Lab"
        intro="Pose les composants, relie les broches. L'application vérifie les tensions, les adresses I2C, la masse commune et le budget de courant — avant que la fumée ne sorte."
      />

      <section className="px-6 py-12 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1700px]">
          <WiringLab ajoutInitial={searchParams.add} />
        </div>
      </section>
    </>
  );
}
