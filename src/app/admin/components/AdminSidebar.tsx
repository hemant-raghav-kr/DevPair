"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/common/SignOutButton";
import type { AdminRole } from "@/lib/auth/admin";

interface AdminSidebarProps {
  adminEmail: string;
  role?: AdminRole;
  isSuperAdmin?: boolean;
}

export function AdminSidebar({
  adminEmail,
  isSuperAdmin = false,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      label: "Overview",
      href: "/admin",
      exact: true,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Students",
      href: "/admin/users",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: "Projects",
      href: "/admin/projects",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: "Applications",
      href: "/admin/applications",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "Complaints",
      href: "/admin/complaints",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      label: "Admins",
      href: "/admin/admins",
      exact: false,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-zinc-950 text-white border-b border-zinc-800">
        <div className="flex items-center gap-2 font-bold text-base">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-white font-extrabold text-xs ${
              isSuperAdmin ? "bg-purple-600" : "bg-red-600"
            }`}
          >
            {isSuperAdmin ? "SUP" : "ADM"}
          </span>
          <span>DevPair Admin</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="p-2 text-zinc-400 hover:text-white rounded-lg focus:outline-none"
          aria-label="Toggle navigation"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar navigation */}
      <aside
        className={`${
          mobileOpen ? "block" : "hidden"
        } lg:flex lg:flex-col lg:w-64 shrink-0 bg-zinc-950 text-zinc-300 border-r border-zinc-800 min-h-screen p-5 justify-between transition-all duration-200`}
      >
        <div className="space-y-6">
          {/* Brand header */}
          <div className="hidden lg:flex items-center gap-3 px-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-white font-extrabold text-sm shadow-md ${
                isSuperAdmin
                  ? "bg-purple-600 shadow-purple-900/40"
                  : "bg-red-600 shadow-red-900/40"
              }`}
            >
              {isSuperAdmin ? "SUP" : "ADM"}
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight leading-tight">
                DevPair Admin
              </h2>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider ${
                  isSuperAdmin ? "text-purple-400" : "text-red-400"
                }`}
              >
                {isSuperAdmin ? "Super Admin Portal" : "Privileged Portal"}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-800/90 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                  }`}
                >
                  <span
                    className={
                      isActive
                        ? isSuperAdmin
                          ? "text-purple-400"
                          : "text-red-400"
                        : "text-zinc-500"
                    }
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer controls */}
        <div className="pt-6 border-t border-zinc-800/80 space-y-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Return to DevPair</span>
          </Link>

          <div className="px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                {isSuperAdmin ? "Super Admin" : "Administrator"}
              </span>
              {isSuperAdmin && (
                <span className="text-xs text-amber-500" title="Super Administrator">
                  ★
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-zinc-300 truncate mt-0.5">
              {adminEmail}
            </div>
          </div>

          <div className="px-1">
            <SignOutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
