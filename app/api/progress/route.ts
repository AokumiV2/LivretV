import { NextResponse } from "next/server";
import { dbConfiguree, prisma } from "@/lib/db/prisma";
import { lireSession } from "@/lib/auth/session";
import { XP } from "@/lib/storage/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function refuse() {
  return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
}

export async function GET() {
  if (!dbConfiguree) return NextResponse.json({ progress: {} });

  const session = await lireSession();
  if (!session) return refuse();

  try {
    const lignes = await prisma.lessonProgress.findMany({
      where: { userId: session.sub }
    });

    const progress: Record<
      string,
      { status: "en_cours" | "terminee"; score: number; total: number; at: number }
    > = {};

    for (const l of lignes) {
      progress[l.lessonId] = {
        status: l.status === "TERMINEE" ? "terminee" : "en_cours",
        score: l.score,
        total: 0,
        at: l.updatedAt.getTime()
      };
    }

    return NextResponse.json({ progress });
  } catch {
    return NextResponse.json({ progress: {} });
  }
}

export async function POST(req: Request) {
  if (!dbConfiguree) return refuse();

  const session = await lireSession();
  if (!session) return refuse();

  let body: {
    lessonId?: string;
    status?: "en_cours" | "terminee";
    score?: number;
    total?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const lessonId = (body.lessonId ?? "").trim();
  if (!lessonId || lessonId.length > 120) {
    return NextResponse.json({ error: "lessonId invalide" }, { status: 400 });
  }

  const score = Math.max(0, Math.min(999, Math.round(body.score ?? 0)));
  const total = Math.max(0, Math.min(999, Math.round(body.total ?? 0)));
  const termine = body.status === "terminee";

  try {
    const avant = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: session.sub, lessonId } }
    });

    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: session.sub, lessonId } },
      create: {
        userId: session.sub,
        lessonId,
        status: termine ? "TERMINEE" : "EN_COURS",
        score,
        completedAt: termine ? new Date() : null
      },
      update: {
        status: termine ? "TERMINEE" : "EN_COURS",
        score: Math.max(score, avant?.score ?? 0),
        completedAt: termine ? (avant?.completedAt ?? new Date()) : null
      }
    });

    if (total > 0) {
      await prisma.quizAttempt.create({
        data: { userId: session.sub, quizId: lessonId, score, total, answers: {} }
      });
    }

    // L'XP n'est attribué qu'à la PREMIÈRE validation d'une leçon,
    // sinon il suffirait de rejouer le quiz en boucle.
    if (termine && avant?.status !== "TERMINEE") {
      let gain: number = XP.lecon;
      if (total > 0) {
        if (score === total) gain += XP.quizParfait;
        else if (score / total >= 0.6) gain += XP.quizReussi;
      }
      await prisma.user.update({
        where: { id: session.sub },
        data: { xp: { increment: gain } }
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "La base de données est injoignable" },
      { status: 503 }
    );
  }
}
