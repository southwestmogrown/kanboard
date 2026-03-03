"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CreateBoardModal from "@/components/CreateBoardModal";
import type { BoardSummary } from "@/types";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/boards")
        .then((res) => res.json())
        .then((data) => {
          setBoards(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <main className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <p className="text-slate-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Your boards</h1>
          <p className="text-sm text-slate-500 mt-1">
            {session?.user?.name
              ? `Welcome back, ${session.user.name}`
              : "Manage your kanban boards"}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors shadow-sm"
        >
          + New board
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg mb-4">No boards yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Create your first board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/board/${board.id}`}
              className="block p-5 bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                {board.title}
              </h3>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                <span className="px-2 py-0.5 bg-slate-100 rounded-full">
                  {board.role}
                </span>
                <span>
                  {board.memberCount} member{board.memberCount !== 1 ? "s" : ""}
                </span>
                <span>
                  Updated {new Date(board.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateBoardModal
          onClose={() => setShowCreate(false)}
          onCreated={(board) => {
            setBoards((prev) => [
              {
                ...board,
                role: "OWNER" as const,
                memberCount: 1,
                updatedAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }}
        />
      )}
    </main>
  );
}
