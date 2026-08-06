import { NextResponse } from "next/server";
import type { Prisma, ProjectKind } from "@prisma/client";
import { dbConfiguree, prisma } from "@/lib/db/prisma";
import { lireSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = ["WIRING", "GRAPH", "FORGE", "SIM"] as const;

function refuse() {
  return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
}

export async function GET(req: Request) {
  if (!dbConfiguree) return NextResponse.json({ projects: [] });

  const session = await lireSession();
  if (!session) return refuse();

  const kindParam = new URL(req.url).searchParams.get("kind");
  const kind = KINDS.includes(kindParam as (typeof KINDS)[number])
    ? (kindParam as ProjectKind)
    : undefined;

  try {
    const rows = await prisma.project.findMany({
      where: { userId: session.sub, ...(kind ? { kind } : {}) },
      orderBy: { updatedAt: "desc" },
      take: 100
    });

    return NextResponse.json({
      projects: rows.map((p) => ({
        id: p.id,
        name: p.name,
        kind: p.kind,
        data: p.data,
        updatedAt: p.updatedAt.getTime()
      }))
    });
  } catch {
    return NextResponse.json({ projects: [] });
  }
}

export async function POST(req: Request) {
  if (!dbConfiguree) return refuse();

  const session = await lireSession();
  if (!session) return refuse();

  let body: { id?: string; name?: string; kind?: string; data?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const name = (body.name ?? "").trim().slice(0, 80) || "Sans titre";
  if (!KINDS.includes(body.kind as (typeof KINDS)[number])) {
    return NextResponse.json({ error: "Type de projet inconnu" }, { status: 400 });
  }
  const kind = body.kind as ProjectKind;
  const data = (body.data ?? {}) as Prisma.InputJsonValue;

  // Un document trop gros vient d'un bug, pas d'un usage normal.
  if (JSON.stringify(data).length > 400_000) {
    return NextResponse.json({ error: "Projet trop volumineux" }, { status: 413 });
  }

  try {
    // L'identifiant est fourni par le client : on vérifie qu'il appartient
    // bien à l'utilisateur avant de mettre à jour quoi que ce soit.
    const existant = body.id
      ? await prisma.project.findFirst({
          where: { id: body.id, userId: session.sub }
        })
      : null;

    const p = existant
      ? await prisma.project.update({
          where: { id: existant.id },
          data: { name, data }
        })
      : await prisma.project.create({
          data: { userId: session.sub, name, kind, data }
        });

    return NextResponse.json({
      project: {
        id: p.id,
        name: p.name,
        kind: p.kind,
        data: p.data,
        updatedAt: p.updatedAt.getTime()
      }
    });
  } catch {
    return NextResponse.json(
      { error: "La base de données est injoignable" },
      { status: 503 }
    );
  }
}
