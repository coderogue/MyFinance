import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createSession, ensureAuthTables, hashPassword, normalizeEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const input = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  const email = typeof input?.email === "string" ? normalizeEmail(input.email) : "";
  const password = typeof input?.password === "string" ? input.password : "";
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || password.length < 12 || password.length > 128) {
    return NextResponse.json({ error: "Enter a valid email and a password of at least 12 characters." }, { status: 400 });
  }
  await ensureAuthTables();
  const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "AppUser" WHERE "email" = ?`, email
  );
  if (existing.length) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }
  const userId = randomBytes(16).toString("hex");
  await prisma.$executeRawUnsafe(
    `INSERT INTO "AppUser" ("id", "email", "passwordHash") VALUES (?, ?, ?)`,
    userId, email, await hashPassword(password)
  );
  await createSession(userId);
  return NextResponse.json({ ok: true });
}
