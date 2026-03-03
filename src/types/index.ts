// ─── Shared types used across client & server ─────────────────

export type BoardMemberRole = "OWNER" | "EDITOR" | "VIEWER";

export interface BoardSummary {
  id: string;
  title: string;
  role: BoardMemberRole;
  memberCount: number;
  updatedAt: string;
}

export interface BoardFull {
  id: string;
  title: string;
  ownerId: string;
  columns: ColumnWithCards[];
  members: MemberInfo[];
}

export interface ColumnWithCards {
  id: string;
  title: string;
  position: number;
  cards: CardInfo[];
}

export interface CardInfo {
  id: string;
  title: string;
  description: string | null;
  position: number;
  columnId: string;
  assigneeId: string | null;
  assignee?: { id: string; name: string | null; image: string | null } | null;
}

export interface MemberInfo {
  id: string;
  userId: string;
  role: BoardMemberRole;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

// ─── WebSocket message types ──────────────────────────────────

export type WSMessageType =
  | "join-board"
  | "leave-board"
  | "card-created"
  | "card-moved"
  | "card-updated"
  | "card-deleted"
  | "column-created"
  | "column-updated"
  | "column-deleted"
  | "column-reordered"
  | "member-added"
  | "board-updated";

export interface WSMessage {
  type: WSMessageType;
  boardId: string;
  payload: Record<string, unknown>;
  senderId?: string;
}
