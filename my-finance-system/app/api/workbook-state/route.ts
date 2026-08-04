import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const MAX_HISTORY_REVISIONS = 50;

export const runtime = "nodejs";

async function ensureWorkbookStateTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WorkbookState" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "data" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  const columns = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    `PRAGMA table_info("WorkbookState")`
  );

  if (!columns.some((column) => column.name === "revision")) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "WorkbookState" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1`
    );
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WorkbookStateRevision" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "workbookStateId" TEXT NOT NULL,
      "revision" INTEGER NOT NULL,
      "data" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  await ensureWorkbookStateTable();

  const states = await prisma.$queryRawUnsafe<
    Array<{ data: string; revision: number }>
  >(
    `SELECT "data", "revision" FROM "WorkbookState" WHERE "id" = ?`,
    user.id
  );
  const state = states[0];

  return NextResponse.json({
    data: state ? JSON.parse(state.data) : null,
    revision: state?.revision ?? 0
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const body = (await request.json()) as {
    data?: unknown;
    expectedRevision?: unknown;
  };

  if (
    !body.data ||
    typeof body.data !== "object" ||
    !Number.isInteger(body.expectedRevision) ||
    (body.expectedRevision as number) < 0
  ) {
    return NextResponse.json({ error: "Invalid save request." }, { status: 400 });
  }

  await ensureWorkbookStateTable();
  const serializedData = JSON.stringify(body.data);
  const expectedRevision = body.expectedRevision as number;

  try {
    const revision = await prisma.$transaction(async (transaction) => {
      const states = await transaction.$queryRawUnsafe<
        Array<{ data: string; revision: number }>
      >(
        `SELECT "data", "revision" FROM "WorkbookState" WHERE "id" = ?`,
        user.id
      );
      const currentState = states[0];
      const currentRevision = currentState?.revision ?? 0;

      if (currentRevision !== expectedRevision) {
        throw new SaveConflictError(currentRevision);
      }

      if (
        currentState &&
        hasMeaningfulWorkbookData(JSON.parse(currentState.data)) &&
        !hasMeaningfulWorkbookData(body.data)
      ) {
        throw new DestructiveSaveError();
      }

      if (currentState) {
        await transaction.$executeRawUnsafe(
          `INSERT INTO "WorkbookStateRevision" ("workbookStateId", "revision", "data") VALUES (?, ?, ?)`,
          user.id,
          currentRevision,
          currentState.data
        );
      }

      const nextRevision = currentRevision + 1;

      if (currentState) {
        await transaction.$executeRawUnsafe(
          `UPDATE "WorkbookState" SET "data" = ?, "revision" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`,
          serializedData,
          nextRevision,
          user.id
        );
      } else {
        await transaction.$executeRawUnsafe(
          `INSERT INTO "WorkbookState" ("id", "data", "revision", "updatedAt") VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
          user.id,
          serializedData,
          nextRevision
        );
      }

      await transaction.$executeRawUnsafe(
        `DELETE FROM "WorkbookStateRevision" WHERE "workbookStateId" = ? AND "id" NOT IN (SELECT "id" FROM "WorkbookStateRevision" WHERE "workbookStateId" = ? ORDER BY "id" DESC LIMIT ?)`,
        user.id,
        user.id,
        MAX_HISTORY_REVISIONS
      );

      return nextRevision;
    });

    return NextResponse.json({ ok: true, revision });
  } catch (error) {
    if (error instanceof SaveConflictError) {
      return NextResponse.json(
        { error: "The workbook changed in another session. Reload before saving.", revision: error.revision },
        { status: 409 }
      );
    }

    if (error instanceof DestructiveSaveError) {
      return NextResponse.json(
        { error: "Refusing to replace a populated workbook with an empty state." },
        { status: 422 }
      );
    }

    throw error;
  }
}

class SaveConflictError extends Error {
  constructor(public revision: number) {
    super("Workbook revision conflict.");
  }
}

class DestructiveSaveError extends Error {}

function hasMeaningfulWorkbookData(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as { yearStates?: Record<string, Record<string, unknown>> };

  return Object.values(state.yearStates ?? {}).some((yearState) => {
    const tabs = Array.isArray(yearState.tabs) ? yearState.tabs : [];
    const collectionKeys = [
      "fixedExpenseRows",
      "fixedExpenseSubRows",
      "presetRows",
      "stockDividends",
      "stockPrices",
      "stockRows",
      "stockTransactions"
    ];
    const hasCollections = collectionKeys.some(
      (key) => Array.isArray(yearState[key]) && yearState[key].length > 0
    );
    const hasMaps = ["cellValues", "transactions"].some((key) => {
      const map = yearState[key];
      return Boolean(map && typeof map === "object" && Object.keys(map).length > 0);
    });

    return tabs.some((tab) => {
      return Boolean(tab && typeof tab === "object" && (tab as { id?: string }).id !== "summary");
    }) || hasCollections || hasMaps;
  });
}
