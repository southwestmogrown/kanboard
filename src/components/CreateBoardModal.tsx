"use client";

import { useState } from "react";

interface CreateBoardModalProps {
  onClose: () => void;
  onCreated: (board: { id: string; title: string }) => void;
}

export default function CreateBoardModal({
  onClose,
  onCreated,
}: CreateBoardModalProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const board = await res.json();
      onCreated(board);
      onClose();
    } catch {
      console.error("Failed to create board");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Create a new board
        </h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="e.g. Sprint 42, Marketing Launch..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          autoFocus
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !title.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating..." : "Create board"}
          </button>
        </div>
      </div>
    </div>
  );
}
