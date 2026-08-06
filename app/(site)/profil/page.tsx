import type { Metadata } from "next";
import { ProfileView } from "@/components/pages/profile-view";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Profil",
  description: "Ta progression, tes badges et tes projets enregistrés."
};

export default function ProfilPage() {
  return (
    <>
      <PageHeader
        kicker="Compte"
        title="Profil"
        intro="Ta progression dans les six parcours, l'XP accumulé, les badges obtenus et les projets que tu as enregistrés."
      />

      <section className="px-6 py-14 lg:px-16 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <ProfileView />
        </div>
      </section>
    </>
  );
}
