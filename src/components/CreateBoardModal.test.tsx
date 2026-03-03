import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import CreateBoardModal from "@/components/CreateBoardModal";

describe("CreateBoardModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a board and calls onCreated + onClose", async () => {
    const onClose = vi.fn();
    const onCreated = vi.fn();

    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ id: "board-1", title: "Sprint Board" }),
    } as Response);

    render(<CreateBoardModal onClose={onClose} onCreated={onCreated} />);

    await userEvent.type(
      screen.getByPlaceholderText("e.g. Sprint 42, Marketing Launch..."),
      "Sprint Board",
    );
    await userEvent.click(screen.getByRole("button", { name: "Create board" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Sprint Board" }),
      });
      expect(onCreated).toHaveBeenCalledWith({
        id: "board-1",
        title: "Sprint Board",
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
