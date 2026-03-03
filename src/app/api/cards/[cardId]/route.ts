import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

interface Params {
  params: Promise<{ cardId: string }>;
}

// PATCH /api/cards/[cardId] — update card (title, description, position, columnId, assignee)
export async function PATCH(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId } = await params;
  const body = await req.json();

  // Verify the card exists and user has access
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { column: { select: { boardId: true } } },
  });
  if (!card)
    return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const member = await prisma.boardMember.findFirst({
    where: {
      boardId: card.column.boardId,
      userId: user.id,
      role: { in: ["OWNER", "EDITOR"] },
    },
  });
  if (!member)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.description !== undefined)
    data.description = body.description?.trim() || null;
  if (body.position !== undefined) data.position = body.position;
  if (body.columnId !== undefined) data.columnId = body.columnId;
  if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId || null;

  const updated = await prisma.card.update({
    where: { id: cardId },
    data,
    include: {
      assignee: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/cards/[cardId]
export async function DELETE(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId } = await params;

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { column: { select: { boardId: true } } },
  });
  if (!card)
    return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const member = await prisma.boardMember.findFirst({
    where: {
      boardId: card.column.boardId,
      userId: user.id,
      role: { in: ["OWNER", "EDITOR"] },
    },
  });
  if (!member)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.card.delete({ where: { id: cardId } });
  return NextResponse.json({ success: true });
}
