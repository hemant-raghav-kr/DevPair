import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/common/SignOutButton";
import { NotificationBell } from "@/features/notifications";
import { checkIsAdmin, checkIsSuperAdmin } from "@/lib/auth/admin";
import { MobileNav } from "@/components/common/MobileNav";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user ? await checkIsAdmin(user.id) : false;
  const isSuperAdmin = user ? await checkIsSuperAdmin(user.id) : false;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-extrabold text-sm shadow-sm">
              DP
            </span>
            <span>DevPair</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/discover"
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Discover Projects
                </Link>
                <Link
                  href="/applications"
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  My Applications
                </Link>
                <Link
                  href="/projects"
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  My Projects
                </Link>
                <Link
                  href="/profile"
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Profile
                </Link>
                <Link
                  href="/complaints"
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Reports
                </Link>
              </>
            ) : (
              <Link
                href="/discover"
                className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Discover Projects
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden md:inline-block text-xs font-mono text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate">
                {user.email}
              </span>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                    isSuperAdmin
                      ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900 hover:bg-purple-100 dark:hover:bg-purple-900/50"
                      : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/50"
                  }`}
                >
                  {isSuperAdmin ? "Super Admin" : "Admin Portal"}
                </Link>
              )}
              <NotificationBell userId={user.id} />
              <div className="hidden sm:block">
                <SignOutButton />
              </div>
              <MobileNav
                userEmail={user.email}
                isAdmin={isAdmin}
                isSuperAdmin={isSuperAdmin}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/discover"
                className="sm:hidden px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-400"
              >
                Discover
              </Link>
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
