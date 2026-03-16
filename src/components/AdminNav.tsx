// components/AdminNav.tsx
"use client";

import { User } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function AdminNav({ user }: { user: User }) {
  return (
    /* 
       The outer <nav> handles the full-width background and bottom border.
       The inner <div> handles the alignment to match the rest of the site.
    */
    <nav className="w-full bg-white border-b border-gray-100 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Left Side: Brand/Title */}
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-900">
            Admin Dashboard
          </span>
        </div>

        {/* Right Side: User Info & Logout */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-900 uppercase">{user.name}</span>
            <span className="text-[8px] text-gray-400 uppercase tracking-tighter">{user.email}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
          >
            Logout
          </button>
        </div>

      </div>
    </nav>
  );
}