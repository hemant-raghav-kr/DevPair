"use client";

import React from "react";
import type { Skill } from "@/features/skills/types";
import type { DiscoveryFilters } from "../types";

interface DiscoveryFiltersProps {
  filters: DiscoveryFilters;
  skills: Skill[];
  onFilterChange: (newFilters: Partial<DiscoveryFilters>) => void;
  onReset: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const CATEGORIES = [
  { id: "all", label: "All Domains" },
  { id: "web_development", label: "Web Development" },
  { id: "mobile_app", label: "Mobile Apps" },
  { id: "ai_machine_learning", label: "AI & Machine Learning" },
  { id: "open_source", label: "Open Source" },
  { id: "game_development", label: "Game Dev" },
  { id: "hardware_iot", label: "Hardware & IoT" },
  { id: "blockchain", label: "Blockchain" },
  { id: "cybersecurity", label: "Cybersecurity" },
  { id: "other", label: "Other" },
];

export function DiscoveryFiltersPanel({
  filters,
  skills,
  onFilterChange,
  onReset,
  isOpenMobile = false,
  onCloseMobile,
}: DiscoveryFiltersProps) {
  const activeCategory = filters.category || "all";
  const activeHackathon = filters.hackathon || "all";
  const activeAvailability = filters.availability || "all";
  const activeSkill = filters.skill || "all";
  const activeStatus = filters.status || "recruiting";

  const hasActiveFilters =
    (filters.category && filters.category !== "all") ||
    (filters.hackathon && filters.hackathon !== "all") ||
    (filters.availability && filters.availability !== "all") ||
    (filters.skill && filters.skill !== "all") ||
    (filters.status && filters.status !== "recruiting") ||
    Boolean(filters.q);

  const content = (
    <div className="space-y-6">
      {/* Header with Reset */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          <span>Filters</span>
        </h3>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Domain / Category Filter */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
          Project Domain
        </label>
        <div className="flex flex-col gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onFilterChange({ category: cat.id })}
              className={`flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-medium transition-colors text-left ${
                activeCategory === cat.id
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <span>{cat.label}</span>
              {activeCategory === cat.id && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Required Skill Filter */}
      <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
        <label htmlFor="skill-filter-select" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
          Required Tech Skill
        </label>
        <select
          id="skill-filter-select"
          aria-label="Required Tech Skill"
          value={activeSkill}
          onChange={(e) => onFilterChange({ skill: e.target.value })}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-blue-500 focus:outline-hidden"
        >
          <option value="all">Any Required Skill</option>
          {skills.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skill.name} ({skill.category})
            </option>
          ))}
        </select>
      </div>

      {/* Hackathon Filter */}
      <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
          Project Type
        </label>
        <div className="grid grid-cols-3 gap-1.5 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onFilterChange({ hackathon: "all" })}
            className={`rounded-lg py-1.5 text-2xs font-semibold text-center transition-all ${
              activeHackathon === "all"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ hackathon: "hackathon" })}
            className={`rounded-lg py-1.5 text-2xs font-semibold text-center transition-all ${
              activeHackathon === "hackathon"
                ? "bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-2xs font-bold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Hackathon
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ hackathon: "non_hackathon" })}
            className={`rounded-lg py-1.5 text-2xs font-semibold text-center transition-all ${
              activeHackathon === "non_hackathon"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Regular
          </button>
        </div>
      </div>

      {/* Role Availability */}
      <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
          Role Openings
        </label>
        <div className="flex flex-col gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="availability"
              checked={activeAvailability === "all"}
              onChange={() => onFilterChange({ availability: "all" })}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span>All Projects</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="availability"
              checked={activeAvailability === "open_roles"}
              onChange={() => onFilterChange({ availability: "open_roles" })}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              Only with Open Roles
            </span>
          </label>
        </div>
      </div>

      {/* Project Status */}
      <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
        <label htmlFor="status-filter-select" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
          Project Status
        </label>
        <select
          id="status-filter-select"
          aria-label="Project Status"
          value={activeStatus}
          onChange={(e) => onFilterChange({ status: e.target.value })}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:border-blue-500 focus:outline-hidden"
        >
          <option value="recruiting">Recruiting Teammates (Default)</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed Projects</option>
          <option value="all">All Public Statuses</option>
        </select>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop View */}
      <aside className="hidden lg:block w-64 shrink-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs self-start sticky top-20">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4">
              <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Filter Projects
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {content}
            <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-full rounded-xl bg-blue-600 text-white py-2.5 text-xs font-semibold shadow-xs hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
