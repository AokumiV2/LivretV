import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConfiguree, prisma } from "@/lib/db/prisma";
import { authConfiguree, creerSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!dbConfiguree || !authConfiguree) {
    return NextResponse.json(
      {
        error:
          "Les comptes ne sont pas activés sur cette instance. Ta progression reste enregistrée dans ce navigateur."
      },
      { status: 501 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Message identique dans les deux cas : ne pas révéler si l'adresse existe.
    const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !ok) {
      return NextResponse.json(
        { error: "Adresse ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    await creerSession({ sub: user.id, email: user.email, pseudo: user.pseudo });

    return NextResponse.json({
      user: { id: user.id, email: user.email, pseudo: user.pseudo, xp: user.xp }
    });
  } catch {
    return NextResponse.json(
      { error: "La base de données est injoignable" },
      { status: 503 }
    );
  }
}
