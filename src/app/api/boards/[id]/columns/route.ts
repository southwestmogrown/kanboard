import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/boards/[id]/columns — create a new column
export async function POST(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: boardId } = await params;
  const { title } = await req.json();

  // Check user has edit access
  const member = await prisma.boardMember.findFirst({
    where: { boardId, userId: user.id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!member)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get next position
  const lastCol = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
  });

  const column = await prisma.column.create({
    data: {
      title: title?.trim() || "New Column",
      position: (lastCol?.position ?? -1) + 1,
      boardId,
    },
    include: { cards: true },
  });

  return NextResponse.json(column, { status: 201 });
}
