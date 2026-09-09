"use client";

import React, { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DiscoverySearch } from "./DiscoverySearch";
import { DiscoveryFiltersPanel } from "./DiscoveryFilters";
import { DiscoverySort } from "./DiscoverySort";
import { DiscoveryProjectCard } from "./DiscoveryProjectCard";
import { DiscoveryPagination } from "./DiscoveryPagination";
import type { DiscoveryFilters, DiscoveryResult } from "../types";
import type { Skill } from "@/features/skills/types";

interface DiscoveryContainerProps {
  initialResult: DiscoveryResult;
  skills: Skill[];
  currentUserId?: string | null;
}

export function DiscoveryContainer({
  initialResult,
  skills,
  currentUserId,
}: DiscoveryContainerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Parse active filters from URL search params
  const activeFilters: DiscoveryFilters = {
    q: searchParams.get("q") || undefined,
    category: searchParams.get("category") || undefined,
    hackathon: searchParams.get("hackathon") || undefined,
    skill: searchParams.get("skill") || undefined,
    status: searchParams.get("status") || undefined,
    availability: searchParams.get("availability") || undefined,
    sort: searchParams.get("sort") || undefined,
    page: Number(searchParams.get("page")) || 1,
  };

  const updateFilters = (newFilters: Partial<DiscoveryFilters>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Merge updates
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val === undefined || val === null || val === "" || val === "all") {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });

    // Reset page to 1 on filter/search change unless page is explicitly updated
    if (!newFilters.page) {
      params.delete("page");
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const resetFilters = () => {
    router.push(pathname);
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeSkillObj = skills.find((s) => s.id === activeFilters.skill);

  const hasAnyFilters =
    Boolean(activeFilters.q) ||
    (activeFilters.category && activeFilters.category !== "all") ||
    (activeFilters.hackathon && activeFilters.hackathon !== "all") ||
    (activeFilters.skill && activeFilters.skill !== "all") ||
    (activeFilters.availability && activeFilters.availability !== "all") ||
    (activeFilters.status && activeFilters.status !== "recruiting");

  return (
    <div className="space-y-8">
      {/* Search Header Banner */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Discover Projects
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Find student-led teams, open developer roles, and hackathons matching your technical skills.
            </p>
          </div>

          <Link
            href="/projects/new"
            className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Create a Project</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="pt-2">
          <DiscoverySearch
            initialQuery={activeFilters.q}
            onSearch={(q) => updateFilters({ q })}
          />
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Results Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Filter Controls Sidebar */}
        <DiscoveryFiltersPanel
          filters={activeFilters}
          skills={skills}
          onFilterChange={updateFilters}
          onReset={resetFilters}
          isOpenMobile={isMobileFiltersOpen}
          onCloseMobile={() => setIsMobileFiltersOpen(false)}
        />

        {/* Results Area */}
        <div className="flex-1 w-full space-y-6">
          {/* Controls Bar: Mobile Filters Button, Active Chips & Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-2xs"
              >
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                <span>Filter Options</span>
                {hasAnyFilters && (
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                )}
              </button>

              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {initialResult.totalCount}{" "}
                {initialResult.totalCount === 1 ? "project" : "projects"} found
              </div>
            </div>

            {/* Sort Control */}
            <DiscoverySort
              currentSort={activeFilters.sort || (currentUserId ? "match" : "newest")}
              onSortChange={(sort) => updateFilters({ sort })}
              isAuthenticated={Boolean(currentUserId)}
            />
          </div>

          {/* Active Filter Badges */}
          {hasAnyFilters && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-zinc-400 font-medium">Active:</span>

              {activeFilters.q && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-zinc-700 dark:text-zinc-300 font-medium">
                  <span>&quot;{activeFilters.q}&quot;</span>
                  <button
                    type="button"
                    onClick={() => updateFilters({ q: "" })}
                    className="hover:text-red-500 transition-colors"
                  >
                    &times;
                  </button>
                </span>
              )}

              {activeFilters.category && activeFilters.category !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 font-medium">
                  <span>Domain: {activeFilters.category.replace(/_/g, " ")}</span>
                  <button
                    type="button"
                    onClick={() => updateFilters({ category: "all" })}
                    className="hover:text-red-500 transition-colors"
                  >
                    &times;
                  </button>
                </span>
              )}

              {activeSkillObj && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 font-medium">
                  <span>Skill: {activeSkillObj.name}</span>
                  <button
                    type="button"
                    onClick={() => updateFilters({ skill: "all" })}
                    className="hover:text-red-500 transition-colors"
                  >
                    &times;
                  </button>
                </span>
              )}

              {activeFilters.hackathon && activeFilters.hackathon !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-2.5 py-1 font-medium">
                  <span>{activeFilters.hackathon === "hackathon" ? "Hackathons" : "Regular"}</span>
                  <button
                    type="button"
                    onClick={() => updateFilters({ hackathon: "all" })}
                    className="hover:text-red-500 transition-colors"
                  >
                    &times;
                  </button>
                </span>
              )}

              {activeFilters.availability === "open_roles" && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 font-medium">
                  <span>Open Roles Only</span>
                  <button
                    type="button"
                    onClick={() => updateFilters({ availability: "all" })}
                    className="hover:text-red-500 transition-colors"
                  >
                    &times;
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline pl-1"
              >
                Reset
              </button>
            </div>
          )}

          {/* Projects Results Grid */}
          {initialResult.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {initialResult.projects.map((proj) => (
                <DiscoveryProjectCard
                  key={proj.id}
                  project={proj}
                  currentUserId={currentUserId}
                  onApplicationSuccess={() => router.refresh()}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-4 bg-white dark:bg-zinc-900/40">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  No projects match your criteria
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Try clearing your search query, selecting different categories, or removing specific skill filters.
                </p>
              </div>
              {hasAnyFilters && (
                <div>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-xs font-semibold shadow-xs hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          <DiscoveryPagination
            page={initialResult.page}
            pageSize={initialResult.pageSize}
            totalCount={initialResult.totalCount}
            totalPages={initialResult.totalPages}
            hasNext={initialResult.hasNext}
            hasPrev={initialResult.hasPrev}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
