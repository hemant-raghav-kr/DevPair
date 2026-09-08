"use client";

import React, { useState, useMemo } from "react";
import type { Skill, ProficiencyLevel } from "../types";
import { PROFICIENCY_LABELS } from "../types";

interface SkillSelectorProps {
  availableSkills: Skill[];
  existingSkillIds: Set<string>;
  onAddSkill: (skill: Skill, proficiency: ProficiencyLevel) => Promise<void> | void;
  isSubmitting?: boolean;
}

const CATEGORY_NAMES: Record<string, string> = {
  all: "All Categories",
  frontend: "Frontend",
  backend: "Backend",
  fullstack: "Fullstack",
  mobile: "Mobile",
  ai_ml: "AI / ML",
  devops_cloud: "DevOps & Cloud",
  ui_ux_design: "UI/UX Design",
  data_science: "Data Science",
  product_management: "Product",
  blockchain: "Blockchain",
  cybersecurity: "Security",
  other: "Other",
};

export function SkillSelector({
  availableSkills,
  existingSkillIds,
  onAddSkill,
  isSubmitting = false,
}: SkillSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");
  const [selectedProficiency, setSelectedProficiency] =
    useState<ProficiencyLevel>("intermediate");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Filter skills not yet added by the user
  const unaddedSkills = useMemo(() => {
    return availableSkills.filter((s) => !existingSkillIds.has(s.id));
  }, [availableSkills, existingSkillIds]);

  // Filter unadded skills by search query and category
  const filteredSkills = useMemo(() => {
    return unaddedSkills.filter((s) => {
      const matchesSearch = s.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase().trim());
      const matchesCategory =
        selectedCategory === "all" || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [unaddedSkills, searchTerm, selectedCategory]);

  const selectedSkill = useMemo(() => {
    return availableSkills.find((s) => s.id === selectedSkillId);
  }, [availableSkills, selectedSkillId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);

    if (!selectedSkill) {
      setFeedbackError("Please select a skill from the list first.");
      return;
    }

    try {
      await onAddSkill(selectedSkill, selectedProficiency);
      // Reset selection
      setSelectedSkillId("");
      setSearchTerm("");
    } catch (err) {
      setFeedbackError(
        err instanceof Error ? err.message : "Failed to add skill."
      );
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
          Add New Skill
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Select verified technologies and frameworks to display on your developer card.
        </p>
      </div>

      {feedbackError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {feedbackError}
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 pointer-events-none">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search skills (e.g. React, Python, Docker)..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 pl-9 pr-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            >
              {Object.entries(CATEGORY_NAMES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Available Skills Options List */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono">
            Select Skill ({filteredSkills.length} available)
          </label>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 p-2 space-y-1 bg-zinc-50/30 dark:bg-zinc-950/30">
            {filteredSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-1">
                {filteredSkills.map((skill) => {
                  const isSelected = selectedSkillId === skill.id;
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => {
                        setSelectedSkillId(skill.id);
                        setFeedbackError(null);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition-all ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-300 dark:hover:border-blue-600"
                      }`}
                    >
                      <span>{skill.name}</span>
                      <span
                        className={`text-[9px] uppercase font-mono px-1 rounded ${
                          isSelected
                            ? "bg-blue-700/50 text-blue-100"
                            : "bg-zinc-100 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-400"
                        }`}
                      >
                        {skill.category.replace("_", " ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {searchTerm || selectedCategory !== "all"
                  ? "No matching skills found for this filter."
                  : unaddedSkills.length === 0
                  ? "You have already added all available skills in the catalog!"
                  : "No skills found."}
              </div>
            )}
          </div>
        </div>

        {/* Selected Skill Proficiency Choice */}
        {selectedSkill && (
          <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                Configure Proficiency for:{" "}
                <span className="font-bold underline">{selectedSkill.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedSkillId("")}
                className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Clear Selection
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(["beginner", "intermediate", "advanced"] as ProficiencyLevel[]).map(
                (level) => {
                  const isChosen = selectedProficiency === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSelectedProficiency(level)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isChosen
                          ? "bg-white dark:bg-zinc-800 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-white/60 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800"
                      }`}
                    >
                      <div className="text-xs font-semibold capitalize text-zinc-900 dark:text-zinc-100">
                        {PROFICIENCY_LABELS[level].label}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                        {PROFICIENCY_LABELS[level].description}
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleAdd}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Add {selectedSkill.name} to Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
