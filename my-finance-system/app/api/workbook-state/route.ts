import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WORKBOOK_STATE_ID = "default";

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
}

export async function GET() {
  await ensureWorkbookStateTable();

  const state = await prisma.workbookState.findUnique({
    where: {
      id: WORKBOOK_STATE_ID
    }
  });

  return NextResponse.json({
    data: state ? JSON.parse(state.data) : null
  });
}

export async function PUT(request: Request) {
  const data = await request.json();

  await ensureWorkbookStateTable();
  await prisma.workbookState.upsert({
    create: {
      data: JSON.stringify(data),
      id: WORKBOOK_STATE_ID
    },
    update: {
      data: JSON.stringify(data)
    },
    where: {
      id: WORKBOOK_STATE_ID
    }
  });

  return NextResponse.json({ ok: true });
}
