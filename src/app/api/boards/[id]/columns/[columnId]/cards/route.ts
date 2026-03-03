import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

interface Params {
  params: Promise<{ id: string; columnId: string }>;
}

// POST /api/boards/[id]/columns/[columnId]/cards — create a card
export async function POST(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: boardId, columnId } = await params;
  const { title, description } = await req.json();

  const member = await prisma.boardMember.findFirst({
    where: { boardId, userId: user.id, role: { in: ["OWNER", "EDITOR"] } },
  });
  if (!member)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get next position in column
  const lastCard = await prisma.card.findFirst({
    where: { columnId },
    orderBy: { position: "desc" },
  });

  const card = await prisma.card.create({
    data: {
      title: title?.trim() || "Untitled",
      description: description?.trim() || null,
      position: (lastCard?.position ?? -1) + 1,
      columnId,
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(card, { status: 201 });
}
