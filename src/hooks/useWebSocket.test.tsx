import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { WSMessage } from "@/types";

class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSED = 3;

  static instances: MockWebSocket[] = [];

  public readyState = MockWebSocket.CONNECTING;
  public onopen: (() => void) | null = null;
  public onclose: (() => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public sent: string[] = [];

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error("Socket not open");
    }
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  receive(message: WSMessage) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

describe("useWebSocket", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);
  });

  it("joins the board when socket opens", () => {
    const onMessage = vi.fn();

    renderHook(() => useWebSocket("board-1", onMessage));
    const socket = MockWebSocket.instances[0];

    act(() => {
      socket.open();
    });

    expect(socket.sent).toHaveLength(1);
    expect(JSON.parse(socket.sent[0])).toMatchObject({
      type: "join-board",
      boardId: "board-1",
    });
  });

  it("does not send leave-board while socket is still connecting on unmount", () => {
    const onMessage = vi.fn();

    const { unmount } = renderHook(() => useWebSocket("board-1", onMessage));

    expect(() => {
      unmount();
    }).not.toThrow();

    const socket = MockWebSocket.instances[0];
    expect(socket.sent).toHaveLength(0);
  });

  it("forwards incoming messages to the callback", () => {
    const onMessage = vi.fn();

    renderHook(() => useWebSocket("board-1", onMessage));
    const socket = MockWebSocket.instances[0];

    act(() => {
      socket.open();
      socket.receive({
        type: "card-created",
        boardId: "board-1",
        payload: { cardId: "c1" },
      } as WSMessage);
    });

    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage.mock.calls[0][0]).toMatchObject({
      type: "card-created",
      boardId: "board-1",
    });
  });
});
