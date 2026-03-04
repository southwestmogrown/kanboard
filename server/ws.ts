/**
 * Standalone WebSocket server for real-time board collaboration.
 *
 * Runs on port 3001 alongside the Next.js dev server (port 3000).
 * Clients join a "room" for each board they're viewing.
 * When any client sends an update, it's broadcast to all other
 * clients in the same room so the UI stays in sync.
 */

import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

interface WSMessage {
  type: string;
  boardId: string;
  payload: Record<string, unknown>;
  senderId?: string;
}

const PORT = Number(process.env.PORT || process.env.WS_PORT) || 3001;

// Create an HTTP server so Railway's reverse proxy can health-check
// and properly upgrade connections to WebSocket.
const server = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("OK");
});

const wss = new WebSocketServer({ server });

// boardId → Set of connected clients
const rooms = new Map<string, Set<WebSocket>>();

function broadcast(boardId: string, message: WSMessage, exclude?: WebSocket) {
  const room = rooms.get(boardId);
  if (!room) return;

  const data = JSON.stringify(message);
  for (const client of room) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

wss.on("connection", (ws) => {
  let currentBoard: string | null = null;

  ws.on("message", (raw) => {
    try {
      const msg: WSMessage = JSON.parse(raw.toString());

      switch (msg.type) {
        case "join-board": {
          // Leave previous room if any
          if (currentBoard) {
            rooms.get(currentBoard)?.delete(ws);
          }

          currentBoard = msg.boardId;
          if (!rooms.has(currentBoard)) {
            rooms.set(currentBoard, new Set());
          }
          rooms.get(currentBoard)!.add(ws);

          console.log(
            `[WS] Client joined board ${currentBoard} (${rooms.get(currentBoard)!.size} clients)`,
          );
          break;
        }

        case "leave-board": {
          if (currentBoard) {
            rooms.get(currentBoard)?.delete(ws);
            console.log(
              `[WS] Client left board ${currentBoard} (${rooms.get(currentBoard)?.size ?? 0} clients)`,
            );
            currentBoard = null;
          }
          break;
        }

        default: {
          // All other messages: broadcast to the room
          if (msg.boardId) {
            broadcast(msg.boardId, msg, ws);
          }
          break;
        }
      }
    } catch (err) {
      console.error("[WS] Failed to parse message:", err);
    }
  });

  ws.on("close", () => {
    if (currentBoard) {
      rooms.get(currentBoard)?.delete(ws);
      const room = rooms.get(currentBoard);
      if (room && room.size === 0) {
        rooms.delete(currentBoard);
      }
      console.log(`[WS] Client disconnected from board ${currentBoard}`);
    }
  });

  ws.on("error", (err) => {
    console.error("[WS] Error:", err);
  });
});

server.listen(PORT, () => {
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
});
