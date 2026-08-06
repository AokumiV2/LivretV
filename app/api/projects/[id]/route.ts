import { NextResponse } from "next/server";
import { dbConfiguree, prisma } from "@/lib/db/prisma";
import { lireSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!dbConfiguree) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const session = await lireSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    // deleteMany filtré sur userId : un identifiant deviné ne permet pas
    // de supprimer le projet de quelqu'un d'autre.
    const { count } = await prisma.project.deleteMany({
      where: { id: params.id, userId: session.sub }
    });

    if (count === 0) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "La base de données est injoignable" },
      { status: 503 }
    );
  }
}
