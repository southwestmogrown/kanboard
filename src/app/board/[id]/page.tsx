import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Board from "@/components/Board";
import type { BoardFull } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BoardPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { id } = await params;

  const board = await prisma.board.findFirst({
    where: {
      id,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
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

  if (!board) redirect("/dashboard");

  // Serialize for client component
  const data: BoardFull = {
    id: board.id,
    title: board.title,
    ownerId: board.ownerId,
    columns: board.columns.map((col) => ({
      id: col.id,
      title: col.title,
      position: col.position,
      cards: col.cards.map((card) => ({
        id: card.id,
        title: card.title,
        description: card.description,
        position: card.position,
        columnId: card.columnId,
        assigneeId: card.assigneeId,
        assignee: card.assignee,
      })),
    })),
    members: board.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      user: m.user,
    })),
  };

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <Board initialData={data} />
    </div>
  );
}
