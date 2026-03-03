import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

interface Params {
  params: Promise<{ id: string; columnId: string }>;
}

// PATCH /api/boards/[id]/columns/[columnId] — update column title or position
export async function PATCH(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: boardId, columnId } = await params;
  const body = await req.json();

  const member = await prisma.boardMember.findFirst({
    where: { boardId, userId: user.id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!member)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.position !== undefined) data.position = body.position;

  const column = await prisma.column.update({
    where: { id: columnId },
    data,
  });

  return NextResponse.json(column);
}

// DELETE /api/boards/[id]/columns/[columnId] — delete column and its cards
export async function DELETE(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: boardId, columnId } = await params;

  const member = await prisma.boardMember.findFirst({
    where: { boardId, userId: user.id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!member)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.column.delete({ where: { id: columnId } });
  return NextResponse.json({ success: true });
}
