import Link from "next/link";
import { AlertTriangle, Info, Lightbulb, OctagonAlert } from "lucide-react";
import type { Block } from "@/content/types";
import { getComponents, CATEGORY_LABEL } from "@/content/components";
import { cx } from "@/components/ui/primitives";
import { CodeBlock, CodeTabs } from "./code-block";
import { Diagram } from "./diagrams";

const CALLOUT = {
  info: { icon: Info, cls: "border-accent2/35 bg-accent2/[0.04]", ic: "text-accent2" },
  tip: { icon: Lightbulb, cls: "border-good/35 bg-good/[0.04]", ic: "text-good" },
  warn: { icon: AlertTriangle, cls: "border-warn/35 bg-warn/[0.04]", ic: "text-warn" },
  danger: { icon: OctagonAlert, cls: "border-bad/40 bg-bad/[0.05]", ic: "text-bad" }
} as const;

function Terminal({ lines }: { lines: { cmd?: string; out?: string }[] }) {
  return (
    <div className="border border-line bg-[#07070d]">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2">
        <span className="h-2 w-2 rounded-full bg-bad/60" />
        <span className="h-2 w-2 rounded-full bg-warn/60" />
        <span className="h-2 w-2 rounded-full bg-good/60" />
        <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          bash
        </span>
      </div>
      <div className="no-scrollbar overflow-x-auto p-4 font-mono text-[13.5px] leading-[1.7]">
        {lines.map((l, i) =>
          l.cmd !== undefined ? (
            <div key={i} className="flex gap-2 whitespace-pre">
              <span className="shrink-0 text-good">$</span>
              <span className="text-ink">{l.cmd}</span>
            </div>
          ) : (
            <div key={i} className="whitespace-pre text-muted">
              {l.out || " "}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function ComponentStrip({ ids, caption }: { ids: string[]; caption?: string }) {
  const items = getComponents(ids);
  if (items.length === 0) return null;

  return (
    <div>
      <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <Link
            key={c.id}
            href={`/codex/${c.id}`}
            className="group bg-panel/50 p-5 transition-colors hover:bg-panel2"
          >
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
              {CATEGORY_LABEL[c.category]}
            </p>
            <p className="mt-2 text-sm text-ink transition-colors group-hover:text-accent2">
              {c.name}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{c.tagline}</p>
            <p className="mt-3 font-mono text-[11px] text-muted">≈ {c.price} €</p>
          </Link>
        ))}
      </div>
      {caption && <p className="mt-3 text-xs text-muted">{caption}</p>}
    </div>
  );
}

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-8">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h":
            return (
              <h2
                key={i}
                className="mega scroll-mt-28 pt-6 text-xl text-ink lg:text-2xl"
              >
                {b.text}
              </h2>
            );

          case "para":
            return (
              <p key={i} className="text-[15px] leading-[1.85] text-ink/80">
                {b.text}
              </p>
            );

          case "list": {
            const Cmp = b.ordered ? "ol" : "ul";
            return (
              <Cmp key={i} className="space-y-3">
                {b.items.map((item, j) => (
                  <li key={j} className="flex gap-4">
                    <span className="mt-[7px] shrink-0 font-mono text-[11px] text-accent2">
                      {b.ordered ? String(j + 1).padStart(2, "0") : "—"}
                    </span>
                    <span className="text-[15px] leading-[1.8] text-ink/80">
                      {item}
                    </span>
                  </li>
                ))}
              </Cmp>
            );
          }

          case "code":
            return (
              <CodeBlock key={i} code={b.code} lang={b.lang} file={b.file} />
            );

          case "tabs":
            return <CodeTabs key={i} tabs={b.tabs} />;

          case "terminal":
            return <Terminal key={i} lines={b.lines} />;

          case "diagram":
            return <Diagram key={i} kind={b.kind} caption={b.caption} />;

          case "components":
            return <ComponentStrip key={i} ids={b.ids} caption={b.caption} />;

          case "callout": {
            const { icon: Icon, cls, ic } = CALLOUT[b.tone];
            return (
              <aside key={i} className={cx("border-l-2 p-5", cls)}>
                <div className="flex items-start gap-3">
                  <Icon size={16} className={cx("mt-0.5 shrink-0", ic)} />
                  <div>
                    <p className="font-display text-[11px] uppercase tracking-hud text-ink">
                      {b.title}
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-ink/75">
                      {b.text}
                    </p>
                  </div>
                </div>
              </aside>
            );
          }

          case "table":
            return (
              <div key={i} className="overflow-x-auto border border-line">
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line bg-panel/60">
                      {b.head.map((h, j) => (
                        <th
                          key={j}
                          className="px-4 py-3 font-display text-[11px] font-medium uppercase tracking-hud text-muted"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, ri) => (
                      <tr
                        key={ri}
                        className="border-b border-line/60 last:border-0"
                      >
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={cx(
                              "px-4 py-3 align-top text-[14px] leading-relaxed",
                              ci === 0 ? "text-ink" : "text-muted"
                            )}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
