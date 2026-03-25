// components/AdminNav.tsx
"use client";

import { useState, useEffect, useRef } from "react"
import { User } from "next-auth";
import { signOut } from "next-auth/react";
import Link from "next/link";

const HouseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20" height="20"
    viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    className="text-blue hover:text-blue-600 transition-colors"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

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
      className="w-full bg-white/90 backdrop-blur-md border-b border-gray-100 font-[family-name:var(--font-geist-sans)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-12 flex items-center justify-between">

        {/* Left Side: Brand & Hamburger Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 -ml-1.5 hover:bg-gray-50 rounded-md transition-colors text-gray-600"
            aria-label="Toggle Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <Link href="/admin" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <HouseIcon />
            <span className="text-[10px] font-black uppercase tracking-tight text-gray-900 hidden sm:inline">
              May Properties <span className="text-gray-400 font-bold">Sdn. Bhd.</span>
            </span>
          </Link>
        </div>

        {/* Right Side: Compact User Info */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end leading-tight">
            <span className="text-[9px] font-bold text-gray-900 uppercase">{user.name}</span>
            <span className="text-[7px] text-gray-400 uppercase tracking-tighter">{user.email}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="text-[9px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute top-12 left-0 w-full bg-white border-b border-gray-100 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-w-7xl mx-auto px-6 py-2 flex flex-col gap-0.5">

            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-900 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-all"
            >
              Property Management
            </Link>

            <div className="my-1 border-t border-gray-50 w-full" />

            <div className="px-4 py-1 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
              Reports
            </div>

            <Link
              href="/admin/reports/financials"
              onClick={() => setIsOpen(false)}
              className="ml-2 pl-8 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-all"
            >
              Financials
            </Link>

            <Link
              href="/admin/reports/expiry"
              onClick={() => setIsOpen(false)}
              className="ml-2 pl-8 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-all"
            >
              Tenancy Expiry
            </Link>

            <Link
              href="/admin/reports/invoices"
              onClick={() => setIsOpen(false)}
              className="ml-2 pl-8 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-all"
            >
              Invoices
            </Link>

            <div className="my-1 border-t border-gray-50 w-full" />

            <Link
              href="/admin/users"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-all"
            >
              User Management
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}