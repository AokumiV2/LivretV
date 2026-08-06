"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { FULL_NAV } from "@/lib/nav";
import { cx } from "@/components/ui/primitives";

export function GridMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="group flex h-10 w-10 items-center justify-center border border-line2 bg-panel/60 transition-colors hover:border-accent2 lg:h-12 lg:w-12"
      >
        <span className="grid grid-cols-3 gap-[3px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="h-[3px] w-[3px] bg-muted transition-colors duration-300 group-hover:bg-accent2"
              style={{ transitionDelay: `${i * 20}ms` }}
            />
          ))}
        </span>
      </button>

      <div
        className={cx(
          "fixed inset-0 z-50 transition-all duration-500",
          open ? "visible opacity-100" : "invisible opacity-0"
        )}
      >
        <div
          className="absolute inset-0 bg-bg/95 backdrop-blur-lg"
          onClick={() => setOpen(false)}
        />

        <div className="relative flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-5 lg:h-20 lg:px-8">
            <span className="font-display text-base font-medium uppercase tracking-[0.28em]">
              Livret<span className="text-accent2">V</span>
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="flex h-10 w-10 items-center justify-center border border-line2 text-muted transition-colors hover:border-bad hover:text-bad lg:h-12 lg:w-12"
            >
              <X size={16} />
            </button>
          </div>

          <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-16 lg:px-8">
            <div className="mx-auto grid max-w-6xl gap-12 pt-8 md:grid-cols-3 lg:pt-16">
              {FULL_NAV.map((group, gi) => (
                <div
                  key={group.group}
                  className={cx(open && "animate-fade-up")}
                  style={{ animationDelay: `${gi * 80}ms` }}
                >
                  <div className="mb-6 flex items-center gap-3">
                    <span className="h-px w-8 bg-accent" />
                    <span className="hud">{group.group}</span>
                  </div>
                  <ul className="space-y-6">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="group block"
                        >
                          <span className="mega block text-2xl text-ink transition-colors group-hover:text-accent2 lg:text-3xl">
                            {item.label}
                          </span>
                          <span className="mt-1.5 block text-xs text-muted">
                            {item.desc}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
