"use client";

import { useState, useCallback, useEffect } from "react";
import Column from "@/components/Column";
import InviteModal from "@/components/InviteModal";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { BoardFull, ColumnWithCards, CardInfo, WSMessage } from "@/types";

interface BoardProps {
  initialData: BoardFull;
}

export default function Board({ initialData }: BoardProps) {
  const [board, setBoard] = useState<BoardFull>(initialData);
  const [showInvite, setShowInvite] = useState(false);

  // ── WebSocket handler: apply remote changes ────────────────────
  const handleWSMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case "card-created": {
        const { card, columnId } = msg.payload as unknown as {
          card: CardInfo;
          columnId: string;
        };
        setBoard((prev) => ({
          ...prev,
          columns: prev.columns.map((col) =>
            col.id === columnId ? { ...col, cards: [...col.cards, card] } : col,
          ),
        }));
        break;
      }
      case "card-moved": {
        const { cardId, sourceColumnId, targetColumnId, position } =
          msg.payload as {
            cardId: string;
            sourceColumnId: string;
            targetColumnId: string;
            position: number;
          };
        setBoard((prev) => {
          const cols = prev.columns.map((col) => ({
            ...col,
            cards: [...col.cards],
          }));
          const srcCol = cols.find((c) => c.id === sourceColumnId);
          const tgtCol = cols.find((c) => c.id === targetColumnId);
          if (!srcCol || !tgtCol) return prev;

          const cardIdx = srcCol.cards.findIndex((c) => c.id === cardId);
          if (cardIdx === -1) return prev;

          const [card] = srcCol.cards.splice(cardIdx, 1);
          card.columnId = targetColumnId;
          card.position = position;
          tgtCol.cards.splice(position, 0, card);

          return { ...prev, columns: cols };
        });
        break;
      }
      case "card-updated": {
        const updatedCard = msg.payload as unknown as CardInfo;
        setBoard((prev) => ({
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            cards: col.cards.map((c) =>
              c.id === updatedCard.id ? { ...c, ...updatedCard } : c,
            ),
          })),
        }));
        break;
      }
      case "card-deleted": {
        const { cardId } = msg.payload as { cardId: string };
        setBoard((prev) => ({
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            cards: col.cards.filter((c) => c.id !== cardId),
          })),
        }));
        break;
      }
      case "column-created": {
        const col = msg.payload as unknown as ColumnWithCards;
        setBoard((prev) => ({ ...prev, columns: [...prev.columns, col] }));
        break;
      }
      case "column-updated": {
        const { columnId, title } = msg.payload as {
          columnId: string;
          title: string;
        };
        setBoard((prev) => ({
          ...prev,
          columns: prev.columns.map((c) =>
            c.id === columnId ? { ...c, title } : c,
          ),
        }));
        break;
      }
      case "column-deleted": {
        const { columnId } = msg.payload as { columnId: string };
        setBoard((prev) => ({
          ...prev,
          columns: prev.columns.filter((c) => c.id !== columnId),
        }));
        break;
      }
    }
  }, []);

  const { send, connected } = useWebSocket(board.id, handleWSMessage);

  useEffect(() => {
    if (connected) return;

    const syncBoard = async () => {
      try {
        const res = await fetch(`/api/boards/${board.id}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const latest: BoardFull = await res.json();
        setBoard(latest);
      } catch {
        // ignore transient network errors while disconnected
      }
    };

    void syncBoard();
    const intervalId = setInterval(syncBoard, 4000);

    return () => clearInterval(intervalId);
  }, [board.id, connected]);

  // ── CRUD actions (hit API, optimistic update, broadcast via WS) ─

  const createCard = async (columnId: string, title: string) => {
    const res = await fetch(
      `/api/boards/${board.id}/columns/${columnId}/cards`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      },
    );
    const card: CardInfo = await res.json();

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.id === columnId ? { ...col, cards: [...col.cards, card] } : col,
      ),
    }));

    send({ type: "card-created", payload: { card, columnId } });
  };

  const updateCard = async (cardId: string, data: Partial<CardInfo>) => {
    const res = await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated: CardInfo = await res.json();

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === cardId ? { ...c, ...updated } : c,
        ),
      })),
    }));

    send({
      type: "card-updated",
      payload: updated as unknown as Record<string, unknown>,
    });
  };

  const deleteCard = async (cardId: string) => {
    await fetch(`/api/cards/${cardId}`, { method: "DELETE" });

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      })),
    }));

    send({ type: "card-deleted", payload: { cardId } });
  };

  const moveCard = async (
    cardId: string,
    sourceColumnId: string,
    targetColumnId: string,
    position: number,
  ) => {
    // Optimistic UI update
    setBoard((prev) => {
      const cols = prev.columns.map((col) => ({
        ...col,
        cards: [...col.cards],
      }));
      const srcCol = cols.find((c) => c.id === sourceColumnId);
      const tgtCol = cols.find((c) => c.id === targetColumnId);
      if (!srcCol || !tgtCol) return prev;

      const cardIdx = srcCol.cards.findIndex((c) => c.id === cardId);
      if (cardIdx === -1) return prev;

      const [card] = srcCol.cards.splice(cardIdx, 1);
      card.columnId = targetColumnId;
      card.position = position;
      tgtCol.cards.splice(position, 0, card);

      return { ...prev, columns: cols };
    });

    // Persist
    await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnId: targetColumnId, position }),
    });

    // Broadcast
    send({
      type: "card-moved",
      payload: { cardId, sourceColumnId, targetColumnId, position },
    });
  };

  const createColumn = async () => {
    const res = await fetch(`/api/boards/${board.id}/columns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Column" }),
    });
    const col: ColumnWithCards = await res.json();

    setBoard((prev) => ({ ...prev, columns: [...prev.columns, col] }));
    send({
      type: "column-created",
      payload: col as unknown as Record<string, unknown>,
    });
  };

  const updateColumn = async (columnId: string, title: string) => {
    await fetch(`/api/boards/${board.id}/columns/${columnId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((c) =>
        c.id === columnId ? { ...c, title } : c,
      ),
    }));

    send({ type: "column-updated", payload: { columnId, title } });
  };

  const deleteColumn = async (columnId: string) => {
    await fetch(`/api/boards/${board.id}/columns/${columnId}`, {
      method: "DELETE",
    });

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.filter((c) => c.id !== columnId),
    }));

    send({ type: "column-deleted", payload: { columnId } });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <h1 className="text-xl font-bold text-slate-800">{board.title}</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-400"}`}
            />
            <span className="text-xs text-slate-400">
              {connected ? "Live" : "Connecting..."}
            </span>
          </div>

          {/* Member avatars */}
          <div className="flex -space-x-2">
            {board.members.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="w-7 h-7 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600"
                title={m.user.name || m.user.email}
              >
                {m.user.name?.charAt(0) || m.user.email.charAt(0)}
              </div>
            ))}
            {board.members.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] text-slate-500">
                +{board.members.length - 5}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowInvite(true)}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
          >
            Invite
          </button>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 items-start h-full">
          {board.columns.map((col) => (
            <Column
              key={col.id}
              column={col}
              onCreateCard={createCard}
              onUpdateCard={updateCard}
              onDeleteCard={deleteCard}
              onMoveCard={moveCard}
              onUpdateColumn={updateColumn}
              onDeleteColumn={deleteColumn}
            />
          ))}

          {/* Add column button */}
          <button
            onClick={createColumn}
            className="min-w-[18rem] w-72 p-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-500 transition-colors text-sm"
          >
            + Add column
          </button>
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <InviteModal
          boardId={board.id}
          onClose={() => setShowInvite(false)}
          onMemberAdded={(member) => {
            setBoard((prev) => ({
              ...prev,
              members: [...prev.members, member],
            }));
          }}
        />
      )}
    </div>
  );
}
