import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 text-center">
      <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
        Kan<span className="text-blue-600">Board</span>
      </h1>
      <p className="text-lg text-slate-600 max-w-md mb-8">
        A real-time collaborative kanban board. Create boards, invite your team,
        and watch changes appear instantly.
      </p>
      <div className="flex gap-4">
        <Link
          href="/auth/signin"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors shadow-md"
        >
          Get started
        </Link>
        <Link
          href="/auth/signin"
          className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
        >
          Sign in
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl">
        <div className="text-left">
          <div className="text-2xl mb-2">⚡</div>
          <h3 className="font-semibold text-slate-800 mb-1">Real-time sync</h3>
          <p className="text-sm text-slate-500">
            Changes appear instantly for all team members via native WebSockets.
          </p>
        </div>
        <div className="text-left">
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-semibold text-slate-800 mb-1">Team collaboration</h3>
          <p className="text-sm text-slate-500">
            Invite members with role-based permissions — owners, editors, and viewers.
          </p>
        </div>
        <div className="text-left">
          <div className="text-2xl mb-2">🔒</div>
          <h3 className="font-semibold text-slate-800 mb-1">Secure auth</h3>
          <p className="text-sm text-slate-500">
            Sign in with email/password or OAuth via GitHub and Google.
          </p>
        </div>
      </div>
    </main>
  );
}
