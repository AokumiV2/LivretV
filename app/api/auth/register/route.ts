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

  let body: { email?: string; pseudo?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const pseudo = (body.pseudo ?? "").trim();
  const password = body.password ?? "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide" }, { status: 400 });
  }
  if (pseudo.length < 2 || pseudo.length > 40) {
    return NextResponse.json(
      { error: "Le pseudo doit faire entre 2 et 40 caractères" },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit faire au moins 8 caractères" },
      { status: 400 }
    );
  }

  try {
    const existe = await prisma.user.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cette adresse" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        pseudo,
        passwordHash: await bcrypt.hash(password, 12)
      }
    });

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
