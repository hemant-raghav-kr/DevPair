"use client";

import React, { useState } from "react";
import { RoleSkillPicker } from "./RoleSkillPicker";
import { validateProjectRoleForm } from "../validation";
import type {
  ProjectRoleFormData,
  ProjectRoleValidationErrors,
  ProjectRoleWithSkill,
} from "../types";
import type { Skill } from "@/features/skills/types";

interface ProjectRoleFormProps {
  initialData?: ProjectRoleWithSkill | null;
  skills: Skill[];
  onSubmit: (data: ProjectRoleFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ProjectRoleForm({
  initialData,
  skills,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ProjectRoleFormProps) {
  const [formData, setFormData] = useState<ProjectRoleFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    required_skill_id: initialData?.required_skill_id || null,
    slots: initialData?.slots ?? 1,
  });

  const [errors, setErrors] = useState<ProjectRoleValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const { isValid, errors: validationErrors } = validateProjectRoleForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save project role."
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/20 p-5 space-y-4 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-900/60 pb-3">
        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
          {initialData ? "Edit Project Role" : "Add Project Role"}
        </h4>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>

      {submitError && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-xs border border-red-200 dark:border-red-900/50">
          {submitError}
        </div>
      )}

      {/* Role Title & Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono">
            Role Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, title: e.target.value }));
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            placeholder="e.g. Frontend Engineer, UI/UX Designer"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
          {errors.title && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.title}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono">
            Open Slots <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={20}
            required
            value={formData.slots}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, slots: e.target.value }));
              if (errors.slots) setErrors((prev) => ({ ...prev, slots: undefined }));
            }}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
          {errors.slots && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.slots}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono">
          Role Description / Responsibilities
        </label>
        <textarea
          rows={2}
          value={formData.description}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, description: e.target.value }));
            if (errors.description)
              setErrors((prev) => ({ ...prev, description: undefined }));
          }}
          placeholder="Describe what this teammate will focus on (e.g. building the Next.js frontend, integrating Supabase auth)..."
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
        />
        {errors.description && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {errors.description}
          </p>
        )}
      </div>

      {/* Required Skill Picker */}
      <RoleSkillPicker
        skills={skills}
        selectedSkillId={formData.required_skill_id}
        onSelectSkill={(skillId) =>
          setFormData((prev) => ({ ...prev, required_skill_id: skillId }))
        }
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Saving role...</span>
            </>
          ) : (
            <span>{initialData ? "Update Role" : "Add Role"}</span>
          )}
        </button>
      </div>
    </form>
  );
}
