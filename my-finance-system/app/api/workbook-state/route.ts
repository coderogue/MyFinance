import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  DestructiveSaveError,
  getWorkbookState,
  SaveConflictError,
  saveWorkbookState
} from "@/lib/workbook/workbook-state-repository";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const state = await getWorkbookState(user.id);

  return NextResponse.json({
    data: state ? JSON.parse(state.data) : null,
    revision: state?.revision ?? 0
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
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

  try {
    const revision = await saveWorkbookState({
      data: body.data,
      expectedRevision: body.expectedRevision as number,
      userId: user.id
    });

    return NextResponse.json({ ok: true, revision });
  } catch (error) {
    if (error instanceof SaveConflictError) {
      return NextResponse.json(
        {
          error: "The workbook changed in another session. Reload before saving.",
          revision: error.revision
        },
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
