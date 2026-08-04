import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "my_finance_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export interface AuthUser {
  email: string;
  id: string;
}

export async function ensureAuthTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AppUser" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL UNIQUE,
      "passwordHash" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserSession" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "tokenHash" TEXT NOT NULL UNIQUE,
      "expiresAt" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "UserSession_userId_idx" ON "UserSession"("userId")`
  );
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, keyHex] = storedHash.split(":");
  if (!salt || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function createSession(userId: string) {
  await ensureAuthTables();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "UserSession" ("id", "userId", "tokenHash", "expiresAt") VALUES (?, ?, ?, ?)`,
    randomBytes(16).toString("hex"),
    userId,
    hashSessionToken(token),
    expiresAt.toISOString()
  );
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  cookieStore.set(SESSION_COOKIE, token, {
    expires: expiresAt,
    httpOnly: true,
    sameSite: "lax",
    secure: requestHeaders.get("x-forwarded-proto") === "https",
    path: "/"
  });
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await ensureAuthTables();
    await prisma.$executeRawUnsafe(
      `DELETE FROM "UserSession" WHERE "tokenHash" = ?`,
      hashSessionToken(token)
    );
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  await ensureAuthTables();
  const users = await prisma.$queryRawUnsafe<AuthUser[]>(
    `SELECT u."id", u."email" FROM "UserSession" s JOIN "AppUser" u ON u."id" = s."userId" WHERE s."tokenHash" = ? AND datetime(s."expiresAt") > CURRENT_TIMESTAMP`,
    hashSessionToken(token)
  );
  return users[0] ?? null;
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
