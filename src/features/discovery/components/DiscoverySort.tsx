"use client";

import React from "react";

interface DiscoverySortProps {
  currentSort: string;
  onSortChange: (sort: string) => void;
  isAuthenticated: boolean;
}

export function DiscoverySort({
  currentSort,
  onSortChange,
  isAuthenticated,
}: DiscoverySortProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-semibold text-zinc-500 dark:text-zinc-400">Sort:</span>
      <select
        value={currentSort}
        onChange={(e) => onSortChange(e.target.value)}
        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 font-medium text-zinc-800 dark:text-zinc-200 focus:border-blue-500 focus:outline-hidden cursor-pointer shadow-2xs"
      >
        {isAuthenticated && (
          <option value="match">Best Match (AI Recommended)</option>
        )}
        <option value="newest">Newest Projects First</option>
        <option value="roles">Most Open Roles</option>
      </select>
    </div>
  );
}
