"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { WSMessage } from "@/types";

function resolveWebSocketUrl(): string | null {
  const configuredUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();

  if (!configuredUrl) {
    if (typeof window !== "undefined") {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (isLocalhost) return "ws://localhost:3001";
    }

    return null;
  }

  if (configuredUrl.startsWith("ws://") || configuredUrl.startsWith("wss://")) {
    return configuredUrl;
  }

  if (configuredUrl.startsWith("https://")) {
    return configuredUrl.replace("https://", "wss://");
  }

  if (configuredUrl.startsWith("http://")) {
    return configuredUrl.replace("http://", "ws://");
  }

  return `wss://${configuredUrl}`;
}

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

    const wsUrl = resolveWebSocketUrl();
    if (!wsUrl) {
      console.error(
        "WebSocket URL is not configured. Set NEXT_PUBLIC_WS_URL in your deployment environment.",
      );
      setConnected(false);
      return;
    }

    let shouldReconnect = true;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
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

      ws.onclose = (event) => {
        setConnected(false);
        wsRef.current = null;

        if (!event?.wasClean) {
          console.warn(
            `WebSocket closed unexpectedly (code=${event?.code ?? "n/a"}, reason=${event?.reason || "n/a"})`,
          );
        }

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
        console.error(`WebSocket error for URL: ${wsUrl}`);
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
