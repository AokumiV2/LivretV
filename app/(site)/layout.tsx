import { CommandPalette } from "@/components/layout/command-palette";
import { Footer } from "@/components/layout/footer";
import { SiteNav } from "@/components/layout/site-nav";
import { VerticalRail } from "@/components/layout/vertical-rail";
import { Scanlines } from "@/components/ui/primitives";

export default function SiteLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Scanlines />
      <SiteNav />
      <VerticalRail />
      <CommandPalette />
      <main className="relative z-[2] min-h-screen pt-16 lg:pt-20">
        {children}
      </main>
      <Footer />
    </>
  );
}
