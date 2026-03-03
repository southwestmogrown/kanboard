"use client";

import { useState } from "react";
import type { MemberInfo } from "@/types";

interface InviteModalProps {
  boardId: string;
  onClose: () => void;
  onMemberAdded: (member: MemberInfo) => void;
}

export default function InviteModal({
  boardId,
  onClose,
  onMemberAdded,
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/boards/${boardId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to invite user");
        return;
      }

      const member: MemberInfo = await res.json();
      onMemberAdded(member);
      setEmail("");
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Invite a member
        </h2>

        <label className="block text-sm text-slate-600 mb-1">
          Email address
        </label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          type="email"
          placeholder="colleague@example.com"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          autoFocus
        />

        <label className="block text-sm text-slate-600 mb-1">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="EDITOR">Editor — can create & move cards</option>
          <option value="VIEWER">Viewer — read-only</option>
        </select>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={loading || !email.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Inviting..." : "Send invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
