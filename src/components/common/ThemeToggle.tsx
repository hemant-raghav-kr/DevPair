"use client";

import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  // Prevent hydration mismatch during initial SSR
  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-hidden="true"
        className={`h-9 w-9 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 text-transparent transition-colors ${className}`}
      >
        <span className="block w-5 h-5" />
      </button>
    );
  }

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`relative inline-flex items-center justify-center h-9 rounded-xl border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 active:scale-95 ${
        showLabel ? "px-3 gap-2" : "w-9 p-2"
      } ${
        isDark
          ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-amber-400 hover:text-amber-300"
          : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 shadow-2xs"
      } ${className}`}
    >
      {isDark ? (
        // Sun icon (switch to light)
        <svg
          className="w-4.5 h-4.5 shrink-0 transition-transform hover:rotate-45"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      ) : (
        // Moon icon (switch to dark)
        <svg
          className="w-4.5 h-4.5 shrink-0 transition-transform hover:-rotate-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          />
        </svg>
      )}

      {showLabel && (
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {isDark ? "Light mode" : "Dark mode"}
        </span>
      )}

      <span className="sr-only">{label}</span>
    </button>
  );
}
