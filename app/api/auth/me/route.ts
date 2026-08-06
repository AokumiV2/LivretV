import { NextResponse } from "next/server";
import { dbConfiguree, prisma } from "@/lib/db/prisma";
import { lireSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!dbConfiguree) return NextResponse.json({ user: null });

  const session = await lireSession();
  if (!session) return NextResponse.json({ user: null });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, pseudo: true, xp: true }
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
