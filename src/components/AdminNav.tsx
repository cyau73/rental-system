// src/components/AdminNav.tsx
import { signOut } from "@/auth";

export default function AdminNav({ user }: { user: any }) {
  return (
    <nav className="flex items-center justify-between bg-white border-b px-8 py-4 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold tracking-tight italic">
          Estate<span className="text-blue-600">Admin</span>
        </h1>
        <span className="bg-gray-100 text-gray-600 text-[10px] uppercase px-2 py-0.5 rounded font-bold">
          v1.0
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-900 leading-none">{user.name}</p>
          <p className="text-xs text-gray-500 mt-1">{user.email}</p>
        </div>

        {/* This form handles the Sign Out via Server Action */}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg border border-red-100 transition-colors"
          >
            Logout
          </button>
        </form>
      </div>
    </nav>
  );
}
