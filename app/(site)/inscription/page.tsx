import type { Metadata } from "next";
import { AuthForm } from "@/components/pages/auth-form";

export const metadata: Metadata = {
  title: "Inscription",
  description: "Crée un compte pour synchroniser ta progression."
};

export default function InscriptionPage() {
  return (
    <section className="px-6 py-24 lg:px-16 lg:py-32">
      <AuthForm mode="inscription" />
    </section>
  );
}
