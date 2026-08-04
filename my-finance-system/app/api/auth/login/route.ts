import { NextResponse } from "next/server";
import { createSession, ensureAuthTables, normalizeEmail, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const input = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  const email = typeof input?.email === "string" ? normalizeEmail(input.email) : "";
  const password = typeof input?.password === "string" ? input.password : "";
  if (email.length > 254 || password.length > 128) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  await ensureAuthTables();
  const users = await prisma.$queryRawUnsafe<Array<{ id: string; passwordHash: string }>>(
    `SELECT "id", "passwordHash" FROM "AppUser" WHERE "email" = ?`, email
  );
  const user = users[0];
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
