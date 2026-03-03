import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

// GET /api/boards — list boards the user owns or is a member of
export async function GET() {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boards = await prisma.board.findMany({
    where: {
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const result = boards.map((b) => ({
    id: b.id,
    title: b.title,
    role: b.ownerId === user.id ? "OWNER" : "MEMBER",
    memberCount: b._count.members,
    updatedAt: b.updatedAt.toISOString(),
  }));

  return NextResponse.json(result);
}

// POST /api/boards — create a new board with default columns
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const board = await prisma.board.create({
    data: {
      title: title.trim(),
      ownerId: user.id!,
      columns: {
        create: [
          { title: "To Do", position: 0 },
          { title: "In Progress", position: 1 },
          { title: "Done", position: 2 },
        ],
      },
      members: {
        create: { userId: user.id!, role: "OWNER" },
      },
    },
    include: {
      columns: { orderBy: { position: "asc" } },
    },
  });

  return NextResponse.json(board, { status: 201 });
}
