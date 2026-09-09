"use client";

import { useState } from "react";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

interface MobileNavProps {
  userEmail?: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export function MobileNav({ userEmail, isAdmin, isSuperAdmin }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sm:hidden flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-0 top-16 z-50 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 shadow-xl px-4 py-5 space-y-4 animate-in slide-in-from-top duration-200">
          {userEmail && (
            <div className="pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Signed in as</span>
              <span className="text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100 truncate block">
                {userEmail}
              </span>
            </div>
          )}

          <nav className="flex flex-col space-y-2 text-sm font-medium">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/discover"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Discover Projects
            </Link>
            <Link
              href="/applications"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              My Applications
            </Link>
            <Link
              href="/projects"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              My Projects
            </Link>
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Profile
            </Link>
            <Link
              href="/complaints"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Reports & Complaints
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className={`px-3 py-2 rounded-lg font-bold border transition-colors ${
                  isSuperAdmin
                    ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900"
                    : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900"
                }`}
              >
                {isSuperAdmin ? "Super Admin Portal" : "Admin Portal"}
              </Link>
            )}
          </nav>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <SignOutButton />
          </div>
        </div>
      )}
    </div>
  );
}
