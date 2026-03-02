import { signOut } from "@/auth";
import Link from "next/link";

export default function AdminNav({ user }: { user: any }) {
  return (
    <nav className="flex items-center justify-between bg-white border-b px-8 py-4 shadow-sm">
      <div className="flex items-center gap-4">
        {/* LOGO INTEGRATION */}
        <Link href="/admin" className="flex items-center gap-3 group">
          <img 
            src="/icon.png" 
            alt="May Properties Logo" 
            className="w-10 h-10 object-contain transition-transform group-hover:scale-105" 
          />
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Rental Management
          </h1>
        </Link>

        <div className="flex items-center gap-3">
          <span className="bg-gray-100 text-gray-600 text-[10px] uppercase px-2 py-0.5 rounded font-bold">
            v1.0
          </span>
          {/* redundant sub-text removed from this line as per your previous request to clean up headers */}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-gray-900 leading-none">{user.name}</p>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{user.email}</p>
        </div>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-xl border border-red-100 transition-all active:scale-95"
          >
            Logout
          </button>
        </form>
      </div>
    </nav>
  );
}