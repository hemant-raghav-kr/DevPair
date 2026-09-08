"use client";

import React, { useState, useMemo } from "react";
import type { Skill } from "@/features/skills/types";

interface RoleSkillPickerProps {
  skills: Skill[];
  selectedSkillId: string | null;
  onSelectSkill: (skillId: string | null) => void;
}

export function RoleSkillPicker({
  skills,
  selectedSkillId,
  onSelectSkill,
}: RoleSkillPickerProps) {
  const [search, setSearch] = useState("");

  const selectedSkill = useMemo(() => {
    return skills.find((s) => s.id === selectedSkillId) || null;
  }, [skills, selectedSkillId]);

  const filteredSkills = useMemo(() => {
    if (!search.trim()) return skills.slice(0, 15);
    const query = search.toLowerCase().trim();
    return skills
      .filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query)
      )
      .slice(0, 15);
  }, [skills, search]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono">
          Required Core Skill
        </label>
        {selectedSkill && (
          <button
            type="button"
            onClick={() => onSelectSkill(null)}
            className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            Clear requirement
          </button>
        )}
      </div>

      {selectedSkill ? (
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-blue-900 dark:text-blue-200">
              {selectedSkill.name}
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              {selectedSkill.category.replace("_", "/")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectSkill(null)}
            className="text-xs text-zinc-400 hover:text-red-500 font-bold px-2 py-0.5"
            aria-label="Remove selected skill"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 pointer-events-none">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search taxonomy (e.g. React, Python, Figma, PyTorch)..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
            {filteredSkills.length > 0 ? (
              filteredSkills.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onSelectSkill(s.id);
                    setSearch("");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <span>{s.name}</span>
                  <span className="text-[9px] uppercase font-mono text-zinc-400">
                    {s.category.replace("_", "/")}
                  </span>
                </button>
              ))
            ) : (
              <p className="text-xs text-zinc-400 p-2">No matching skills found in catalog.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
