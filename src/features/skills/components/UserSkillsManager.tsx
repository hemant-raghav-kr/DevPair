"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SkillSelector } from "./SkillSelector";
import type { Skill, UserSkillWithDetails, ProficiencyLevel } from "../types";

interface UserSkillsManagerProps {
  userId: string;
  initialSkills: UserSkillWithDetails[];
  allTaxonomySkills: Skill[];
  onSkillsChange?: (skills: UserSkillWithDetails[]) => void;
}

const proficiencyBadgeStyles: Record<ProficiencyLevel, string> = {
  beginner: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  intermediate: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  advanced: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800",
};

export function UserSkillsManager({
  userId,
  initialSkills,
  allTaxonomySkills,
  onSkillsChange,
}: UserSkillsManagerProps) {
  const supabase = createClient();

  const [skills, setSkills] = useState<UserSkillWithDetails[]>(initialSkills);
  const [isAdding, setIsAdding] = useState(false);
  const [updatingSkillId, setUpdatingSkillId] = useState<string | null>(null);
  const [removingSkillId, setRemovingSkillId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  const existingSkillIds = new Set(skills.map((s) => s.skill_id));

  // Add a new skill
  const handleAddSkill = async (
    skill: Skill,
    proficiency: ProficiencyLevel
  ) => {
    setFeedback(null);
    if (existingSkillIds.has(skill.id)) {
      setFeedback({
        type: "error",
        message: `${skill.name} is already in your skills list.`,
      });
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.from("user_skills").insert({
        user_id: userId,
        skill_id: skill.id,
        proficiency,
      });

      if (error) {
        if (error.code === "23505") {
          setFeedback({
            type: "error",
            message: `${skill.name} has already been added to your profile.`,
          });
        } else {
          setFeedback({
            type: "error",
            message: error.message || "Failed to add skill.",
          });
        }
        return;
      }

      const newEntry: UserSkillWithDetails = {
        user_id: userId,
        skill_id: skill.id,
        proficiency,
        created_at: new Date().toISOString(),
        skill,
      };

      const updated = [newEntry, ...skills];
      setSkills(updated);
      onSkillsChange?.(updated);
      setFeedback({
        type: "success",
        message: `Added ${skill.name} (${proficiency}) to your skills.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Modify skill proficiency
  const handleProficiencyChange = async (
    skillId: string,
    newProficiency: ProficiencyLevel
  ) => {
    setFeedback(null);
    setUpdatingSkillId(skillId);

    try {
      const { error } = await supabase
        .from("user_skills")
        .update({ proficiency: newProficiency })
        .eq("user_id", userId)
        .eq("skill_id", skillId);

      if (error) {
        setFeedback({
          type: "error",
          message: error.message || "Failed to update proficiency.",
        });
        return;
      }

      const updated = skills.map((item) =>
        item.skill_id === skillId
          ? { ...item, proficiency: newProficiency }
          : item
      );
      setSkills(updated);
      onSkillsChange?.(updated);
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to update proficiency.",
      });
    } finally {
      setUpdatingSkillId(null);
    }
  };

  // Remove a skill
  const handleRemoveSkill = async (skillId: string, skillName: string) => {
    setFeedback(null);
    setRemovingSkillId(skillId);

    try {
      const { error } = await supabase
        .from("user_skills")
        .delete()
        .eq("user_id", userId)
        .eq("skill_id", skillId);

      if (error) {
        setFeedback({
          type: "error",
          message: error.message || "Failed to remove skill.",
        });
        return;
      }

      const updated = skills.filter((item) => item.skill_id !== skillId);
      setSkills(updated);
      onSkillsChange?.(updated);
      setFeedback({
        type: "success",
        message: `Removed ${skillName} from your profile.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to remove skill.",
      });
    } finally {
      setRemovingSkillId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`rounded-xl p-4 text-xs font-medium flex items-center justify-between border ${
            feedback.type === "error"
              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50"
              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Current Skills List */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Your Skills ({skills.length})
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Manage your stack and adjust your self-assessed proficiency.
            </p>
          </div>
        </div>

        {skills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skills.map((item) => {
              const skillName = item.skill?.name || "Skill";
              const isUpdating = updatingSkillId === item.skill_id;
              const isRemoving = removingSkillId === item.skill_id;

              return (
                <div
                  key={item.skill_id}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/30 p-3.5 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {skillName}
                      </span>
                      {item.skill?.category && (
                        <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 dark:text-zinc-500">
                          {item.skill.category.replace("_", "/")}
                        </span>
                      )}
                    </div>

                    {/* Inline Proficiency Selector */}
                    <div className="flex items-center gap-1.5">
                      <select
                        aria-label={`Proficiency for ${skillName}`}
                        value={item.proficiency}
                        disabled={isUpdating || isRemoving}
                        onChange={(e) =>
                          handleProficiencyChange(
                            item.skill_id,
                            e.target.value as ProficiencyLevel
                          )
                        }
                        className={`rounded-md border px-2 py-0.5 text-xs font-semibold capitalize focus:outline-none transition-colors ${
                          proficiencyBadgeStyles[item.proficiency]
                        }`}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                      {isUpdating && (
                        <svg className="animate-spin h-3 w-3 text-blue-500" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    disabled={isRemoving || isUpdating}
                    onClick={() => handleRemoveSkill(item.skill_id, skillName)}
                    aria-label={`Remove ${skillName}`}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
                  >
                    {isRemoving ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            No skills added yet. Use the selector below to add skills to your profile.
          </div>
        )}
      </div>

      {/* Skill Selector Component */}
      <SkillSelector
        availableSkills={allTaxonomySkills}
        existingSkillIds={existingSkillIds}
        onAddSkill={handleAddSkill}
        isSubmitting={isAdding}
      />
    </div>
  );
}
