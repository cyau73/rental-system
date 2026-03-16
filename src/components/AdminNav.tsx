// components/AdminNav.tsx
"use client";

import { useState, useEffect, useRef } from "react"
import { User } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function AdminNav({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // FIX: Close menu when clicking outside of the navigation component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    // Bind the event listener
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Clean up the listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <nav
      ref={navRef}
      className="w-full bg-white border-b border-gray-100 font-[family-name:var(--font-geist-sans)] relative z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Left Side: Brand & Hamburger Toggle */}
        <div className="flex items-center gap-4">
          {/* Hamburger/X Button: Toggles the menu state */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 -ml-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-600"
            aria-label="Toggle Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isOpen ? (
                <path d="M18 6L6 18M6 6l12 12" /> // X Icon
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" /> // Hamburger Icon
              )}
            </svg>
          </button>

          <span className="text-xs font-bold uppercase tracking-widest text-gray-900 hidden sm:inline">
            Admin Dashboard
          </span>
        </div>

        {/* Right Side: User Info & Logout (Matches horizontal alignment px-6) */}
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

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-white border-b border-gray-100 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setIsOpen(false)} // Closes when a link is clicked
              className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-all"
            >
              Home
            </Link>
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)} // Closes when a link is clicked
              className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-all"
            >
              Property
            </Link>
            <Link
              href="/admin/reports"
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-all"
            >
              Reports
            </Link>
            <Link
              href="/admin/users"
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-all"
            >
              Users
            </Link>
          </div >
        </div >
      )
      }
    </nav >
  );
}