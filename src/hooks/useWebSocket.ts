"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { WSMessage } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";

/**
 * Hook that manages a WebSocket connection to the collaboration server.
 * Auto-joins the given boardId room and exposes a `send` function
 * plus an `onMessage` callback for handling incoming events.
 */
export function useWebSocket(
  boardId: string | null,
  onMessage: (msg: WSMessage) => void,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const reconnectAttemptsRef = useRef(0);
  const [connected, setConnected] = useState(false);

  // Keep callback ref fresh without re-triggering effect
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!boardId) return;

    let shouldReconnect = true;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setConnected(true);
        ws.send(JSON.stringify({ type: "join-board", boardId, payload: {} }));
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          onMessageRef.current(msg);
        } catch {
          console.error("Failed to parse WS message");
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;

        if (shouldReconnect) {
          const delay = Math.min(
            1000 * 2 ** reconnectAttemptsRef.current,
            5000,
          );
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      shouldReconnect = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      const ws = wsRef.current;

      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "leave-board", boardId, payload: {} }));
      }

      ws?.close();
      wsRef.current = null;
      setConnected(false);
    };
  }, [boardId]);

  const send = useCallback(
    (msg: Omit<WSMessage, "boardId">) => {
      if (wsRef.current?.readyState === WebSocket.OPEN && boardId) {
        wsRef.current.send(JSON.stringify({ ...msg, boardId }));
      }
    },
    [boardId],
  );

  return { send, connected };
}
