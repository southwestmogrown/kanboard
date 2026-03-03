import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/boards/[id] — full board with columns, cards, members
export async function GET(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const board = await prisma.board.findFirst({
    where: {
      id,
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: {
          cards: {
            orderBy: { position: "asc" },
            include: {
              assignee: { select: { id: true, name: true, image: true } },
            },
          },
        },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  return NextResponse.json(board);
}

// PATCH /api/boards/[id] — update board title
export async function PATCH(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { title } = await req.json();

  // Only owners/editors can update
  const member = await prisma.boardMember.findFirst({
    where: { boardId: id, userId: user.id, role: { in: ["OWNER", "EDITOR"] } },
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const board = await prisma.board.update({
    where: { id },
    data: { title: title.trim() },
  });

  return NextResponse.json(board);
}

// DELETE /api/boards/[id] — delete board (owner only)
export async function DELETE(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const board = await prisma.board.findFirst({
    where: { id, ownerId: user.id },
  });

  if (!board) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.board.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
