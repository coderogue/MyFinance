import { prisma } from "@/lib/prisma";

const MAX_HISTORY_REVISIONS = 50;

export interface StoredWorkbookState {
  data: string;
  revision: number;
}

export class SaveConflictError extends Error {
  constructor(public revision: number) {
    super("Workbook revision conflict.");
  }
}

export class DestructiveSaveError extends Error {}

export async function getWorkbookState(userId: string) {
  await ensureWorkbookStateTables();
  const states = await prisma.$queryRawUnsafe<StoredWorkbookState[]>(
    `SELECT "data", "revision" FROM "WorkbookState" WHERE "id" = ?`,
    userId
  );
  return states[0] ?? null;
}

export async function saveWorkbookState({
  data,
  expectedRevision,
  userId
}: {
  data: unknown;
  expectedRevision: number;
  userId: string;
}) {
  await ensureWorkbookStateTables();
  const serializedData = JSON.stringify(data);

  return prisma.$transaction(async (transaction) => {
    const states = await transaction.$queryRawUnsafe<StoredWorkbookState[]>(
      `SELECT "data", "revision" FROM "WorkbookState" WHERE "id" = ?`,
      userId
    );
    const currentState = states[0];
    const currentRevision = currentState?.revision ?? 0;

    if (currentRevision !== expectedRevision) {
      throw new SaveConflictError(currentRevision);
    }

    if (
      currentState &&
      hasMeaningfulWorkbookData(JSON.parse(currentState.data)) &&
      !hasMeaningfulWorkbookData(data)
    ) {
      throw new DestructiveSaveError();
    }

    if (currentState) {
      await transaction.$executeRawUnsafe(
        `INSERT INTO "WorkbookStateRevision" ("workbookStateId", "revision", "data") VALUES (?, ?, ?)`,
        userId,
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
        userId
      );
    } else {
      await transaction.$executeRawUnsafe(
        `INSERT INTO "WorkbookState" ("id", "data", "revision", "updatedAt") VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        userId,
        serializedData,
        nextRevision
      );
    }

    await transaction.$executeRawUnsafe(
      `DELETE FROM "WorkbookStateRevision" WHERE "workbookStateId" = ? AND "id" NOT IN (SELECT "id" FROM "WorkbookStateRevision" WHERE "workbookStateId" = ? ORDER BY "id" DESC LIMIT ?)`,
      userId,
      userId,
      MAX_HISTORY_REVISIONS
    );

    return nextRevision;
  });
}

async function ensureWorkbookStateTables() {
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

    return (
      tabs.some((tab) => {
        return Boolean(
          tab &&
            typeof tab === "object" &&
            (tab as { id?: string }).id !== "summary"
        );
      }) ||
      hasCollections ||
      hasMaps
    );
  });
}
