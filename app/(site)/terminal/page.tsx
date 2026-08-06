import type { Metadata } from "next";
import { CliExplorer } from "@/components/pages/cli-explorer";
import { PageHeader } from "@/components/ui/primitives";
import { CLI_COMMANDS } from "@/content/cli";

export const metadata: Metadata = {
  title: "Terminal",
  description:
    "Toutes les commandes ros2 utiles, avec leur usage réel et un exemple copiable : topics, services, paramètres, TF, compilation, diagnostic."
};

export default function TerminalPage() {
  return (
    <>
      <PageHeader
        kicker="Référence"
        title="Terminal"
        intro="Les commandes que tu taperas vraiment, avec un exemple concret et la sortie attendue. Cherche par mot-clé ou par famille."
        right={
          <div>
            <p className="font-display text-2xl text-ink">
              {CLI_COMMANDS.length}
            </p>
            <p className="hud mt-1">Commandes</p>
          </div>
        }
      />

      <section className="px-6 py-14 lg:px-16 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <CliExplorer />
        </div>
      </section>
    </>
  );
}
