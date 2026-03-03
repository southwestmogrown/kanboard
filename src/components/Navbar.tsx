"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-slate-900 text-white shadow-md">
      <Link href="/dashboard" className="text-xl font-bold tracking-tight">
        KanBoard
      </Link>

      <div className="flex items-center gap-4">
        {session?.user ? (
          <>
            <span className="text-sm text-slate-300">
              {session.user.name || session.user.email}
            </span>
            {session.user.image && (
              <img
                src={session.user.image}
                alt="avatar"
                className="w-8 h-8 rounded-full"
              />
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/auth/signin"
            className="text-sm px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
