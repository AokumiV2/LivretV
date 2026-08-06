"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MAIN_NAV } from "@/lib/nav";
import { cx } from "@/components/ui/primitives";
import { GridMenu } from "./grid-menu";
import { useCommandPalette } from "./command-palette";

export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const open = useCommandPalette((s) => s.open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cx(
        "fixed inset-x-0 top-0 z-40 transition-all duration-500",
        scrolled ? "bg-bg/85 backdrop-blur-md" : "bg-transparent"
      )}
    >
      <div
        className={cx(
          "absolute inset-x-0 bottom-0 h-px bg-line transition-opacity duration-500",
          scrolled ? "opacity-100" : "opacity-0"
        )}
      />

      <nav className="relative flex h-16 items-center justify-between px-5 lg:h-20 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-base font-medium uppercase tracking-[0.28em] text-ink transition-colors hover:text-accent2 lg:text-lg"
        >
          Livret<span className="text-accent2">V</span>
        </Link>

        {/* Navigation centrale */}
        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 lg:flex">
          {MAIN_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cx(
                  "link-underline font-display text-[11px] uppercase tracking-hud transition-colors",
                  isActive(item.href)
                    ? "text-accent2"
                    : "text-muted hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions à droite */}
        <div className="flex items-center gap-4">
          <button
            onClick={open}
            className="hidden items-center gap-2 border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:border-line2 hover:text-ink sm:flex"
            aria-label="Ouvrir la recherche"
          >
            Rechercher
            <kbd className="border border-line2 px-1 py-px text-[9px]">⌘K</kbd>
          </button>

          <Link
            href="/profil"
            className="hidden font-display text-[10px] uppercase tracking-hud text-muted transition-colors hover:text-ink sm:block"
          >
            Profil
          </Link>

          <GridMenu />
        </div>
      </nav>
    </header>
  );
}
