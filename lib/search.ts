import { CLI_COMMANDS } from "@/content/cli";
import { COMPONENTS, CATEGORY_LABEL } from "@/content/components";
import { GLOSSARY } from "@/content/glossary";
import { allLessons } from "@/content/tracks";
import { ARCHETYPES } from "@/content/archetypes";
import { FULL_NAV } from "./nav";

export type SearchKind =
  | "Leçon"
  | "Composant"
  | "Glossaire"
  | "Commande"
  | "Archétype"
  | "Page";

export type SearchEntry = {
  kind: SearchKind;
  title: string;
  sub: string;
  href: string;
  /** Texte concaténé et normalisé sur lequel porte la recherche. */
  hay: string;
};

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

let cache: SearchEntry[] | null = null;

export function searchIndex(): SearchEntry[] {
  if (cache) return cache;

  const entries: SearchEntry[] = [];

  for (const { track, lesson } of allLessons()) {
    entries.push({
      kind: "Leçon",
      title: lesson.title,
      sub: `${track.title} · ${lesson.minutes} min · ${lesson.level}`,
      href: `/academy/${track.slug}/${lesson.slug}`,
      hay: norm(
        [
          lesson.title,
          lesson.summary,
          track.title,
          lesson.objectives.join(" ")
        ].join(" ")
      )
    });
  }

  for (const c of COMPONENTS) {
    entries.push({
      kind: "Composant",
      title: c.name,
      sub: `${CATEGORY_LABEL[c.category]} · ${c.brand} · ${c.price} €`,
      href: `/codex/${c.id}`,
      hay: norm(
        [
          c.name,
          c.brand,
          c.tagline,
          c.description,
          CATEGORY_LABEL[c.category],
          c.buses.join(" "),
          c.rosPackages.map((p) => p.name).join(" ")
        ].join(" ")
      )
    });
  }

  for (const g of GLOSSARY) {
    entries.push({
      kind: "Glossaire",
      title: g.term,
      sub: g.short,
      href: `/glossaire#${encodeURIComponent(g.term)}`,
      hay: norm([g.term, g.short, g.long, g.category].join(" "))
    });
  }

  for (const c of CLI_COMMANDS) {
    entries.push({
      kind: "Commande",
      title: c.cmd,
      sub: c.what,
      href: `/terminal#${encodeURIComponent(c.cmd)}`,
      hay: norm([c.cmd, c.what, c.example, c.group].join(" "))
    });
  }

  for (const a of ARCHETYPES) {
    entries.push({
      kind: "Archétype",
      title: a.name,
      sub: a.tagline,
      href: `/forge?archetype=${a.id}`,
      hay: norm([a.name, a.tagline, a.description, a.skills.join(" ")].join(" "))
    });
  }

  for (const group of FULL_NAV) {
    for (const item of group.items) {
      entries.push({
        kind: "Page",
        title: item.label,
        sub: item.desc,
        href: item.href,
        hay: norm([item.label, item.desc, group.group].join(" "))
      });
    }
  }

  cache = entries;
  return entries;
}

/** Recherche par sous-chaîne, avec un score simple qui privilégie les titres. */
export function search(query: string, limit = 24): SearchEntry[] {
  const q = norm(query.trim());
  if (q.length < 2) return [];

  const mots = q.split(/\s+/);
  const scored: { e: SearchEntry; score: number }[] = [];

  for (const e of searchIndex()) {
    const titre = norm(e.title);
    let score = 0;
    let tousPresents = true;

    for (const mot of mots) {
      if (titre.startsWith(mot)) score += 12;
      else if (titre.includes(mot)) score += 7;
      else if (e.hay.includes(mot)) score += 2;
      else tousPresents = false;
    }

    if (tousPresents && score > 0) scored.push({ e, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.e);
}
