import { NextResponse } from "next/server";
import { detruireSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  detruireSession();
  return NextResponse.json({ ok: true });
}
