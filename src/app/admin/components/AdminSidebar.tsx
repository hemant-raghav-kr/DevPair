"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/common/SignOutButton";

interface AdminSidebarProps {
  adminEmail: string;
}

export function AdminSidebar({ adminEmail }: AdminSidebarProps) {
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
  ];

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-zinc-950 text-white border-b border-zinc-800">
        <div className="flex items-center gap-2 font-bold text-base">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white font-extrabold text-xs">
            ADM
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
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white font-extrabold text-sm shadow-md shadow-red-900/40">
              ADM
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight leading-tight">
                DevPair Admin
              </h2>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-red-400">
                Privileged Portal
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
                  <span className={isActive ? "text-red-400" : "text-zinc-500"}>
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
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
              Authenticated Admin
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
