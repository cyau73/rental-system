// components/AdminNav.tsx
"use client";

import { handleLogout } from "@/app/actions"; // Import the server action
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav({ user }: { user: any }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between bg-white border-b px-8 py-4 shadow-sm">
      <div className="flex items-center gap-4">
        {/* LOGO AND LINKS (Keep existing logic) */}
        <Link href="/admin" className="flex items-center gap-3 group">
          <img src="/icon.png" alt="Logo" className="w-10 h-10 object-contain" />
          <h1 className="text-2xl font-extrabold text-gray-900">Rental Management System</h1>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/admin" label="Property Listing" isActive={pathname === "/admin"} />
          <NavLink href="/admin/reports" label="Reports" isActive={pathname === "/admin/reports"} />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-gray-900 leading-none">{user.name}</p>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{user.email}</p>
        </div>

        {/* UPDATED: Calling the external Server Action */}
        <form action={handleLogout}>
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

// NavLink helper (Keep existing logic)
function NavLink({ href, label, isActive }: { href: string; label: string; isActive?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors relative ${isActive ? "text-gray-900" : "text-gray-400"
        }`}
    >
      {label}
      {isActive && (
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
      )}
    </Link>
  );
}