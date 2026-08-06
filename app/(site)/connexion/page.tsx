import type { Metadata } from "next";
import { AuthForm } from "@/components/pages/auth-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Retrouve ta progression et tes projets."
};

export default function ConnexionPage() {
  return (
    <section className="px-6 py-24 lg:px-16 lg:py-32">
      <AuthForm mode="connexion" />
    </section>
  );
}
