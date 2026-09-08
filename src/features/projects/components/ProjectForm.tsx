"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { validateProjectForm } from "../validation";
import {
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  PROJECT_VISIBILITIES,
  type Project,
  type ProjectCategory,
  type ProjectStatus,
  type ProjectVisibility,
  type ProjectFormData,
  type ProjectValidationErrors,
} from "../types";

interface ProjectFormProps {
  initialProject?: Project;
  userId: string;
  onSubmitSuccess: (project: Project) => void;
  onCancel?: () => void;
}

export function ProjectForm({
  initialProject,
  userId,
  onSubmitSuccess,
  onCancel,
}: ProjectFormProps) {
  const supabase = createClient();
  const isEditing = Boolean(initialProject);

  const [formData, setFormData] = useState<ProjectFormData>({
    title: initialProject?.title || "",
    tagline: initialProject?.tagline || "",
    description: initialProject?.description || "",
    category: (initialProject?.category as ProjectCategory) || "web_development",
    status: (initialProject?.status as ProjectStatus) || "recruiting",
    visibility: (initialProject?.visibility as ProjectVisibility) || "public",
    is_hackathon: initialProject?.is_hackathon || false,
    hackathon_name: initialProject?.hackathon_name || "",
    hackathon_deadline: initialProject?.hackathon_deadline
      ? new Date(initialProject.hackathon_deadline).toISOString().slice(0, 16)
      : "",
    max_team_size: initialProject?.max_team_size ?? 4,
    repo_url: initialProject?.repo_url || "",
    demo_url: initialProject?.demo_url || "",
  });

  const [errors, setErrors] = useState<ProjectValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name as keyof ProjectValidationErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
    }
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const { isValid, errors: validationErrors } = validateProjectForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        tagline: formData.tagline.trim() || null,
        description: formData.description.trim(),
        category: formData.category,
        status: formData.status,
        visibility: formData.visibility,
        is_hackathon: formData.is_hackathon,
        hackathon_name: formData.is_hackathon
          ? formData.hackathon_name.trim() || null
          : null,
        hackathon_deadline:
          formData.is_hackathon && formData.hackathon_deadline
            ? new Date(formData.hackathon_deadline).toISOString()
            : null,
        max_team_size: Number(formData.max_team_size),
        repo_url: formData.repo_url.trim() || null,
        demo_url: formData.demo_url.trim() || null,
      };

      if (isEditing && initialProject) {
        // Update existing project
        const { data, error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", initialProject.id)
          .select()
          .single();

        if (error || !data) {
          throw new Error(error?.message || "Failed to update project.");
        }
        onSubmitSuccess(data as Project);
      } else {
        // Insert new project with authenticated user's id
        const { data, error } = await supabase
          .from("projects")
          .insert({
            ...payload,
            owner_id: userId,
          })
          .select()
          .single();

        if (error || !data) {
          throw new Error(error?.message || "Failed to create project.");
        }
        onSubmitSuccess(data as Project);
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {submitError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300 flex items-start gap-3">
          <svg className="h-5 w-5 shrink-0 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">Unable to save project</p>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      {/* Section 1: Basic Information */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            1. Project Overview
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Describe the core concept and goals of your project or hackathon build.
          </p>
        </div>

        {/* Project Title */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label
              htmlFor="title"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              Project Title <span className="text-red-500">*</span>
            </label>
            <span
              className={`text-[11px] font-mono ${
                formData.title.length > 120
                  ? "text-red-500 font-bold"
                  : "text-zinc-400"
              }`}
            >
              {formData.title.length}/120
            </span>
          </div>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. AI-Powered Campus Shuttle Tracker"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
          {errors.title && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.title}</p>
          )}
        </div>

        {/* Tagline */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label
              htmlFor="tagline"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              Tagline / One-liner
            </label>
            <span
              className={`text-[11px] font-mono ${
                formData.tagline.length > 200
                  ? "text-red-500 font-bold"
                  : "text-zinc-400"
              }`}
            >
              {formData.tagline.length}/200
            </span>
          </div>
          <input
            id="tagline"
            name="tagline"
            type="text"
            value={formData.tagline}
            onChange={handleChange}
            placeholder="e.g. Real-time GPS mapping & ETA predictor for college students."
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
          {errors.tagline && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.tagline}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label
            htmlFor="description"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
          >
            Detailed Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            required
            value={formData.description}
            onChange={handleChange}
            placeholder="Explain the background problem, tech stack, roadmap, and what you aim to achieve together..."
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 p-3.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors resize-y"
          />
          {errors.description && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {errors.description}
            </p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label
            htmlFor="category"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
          >
            Category Domain
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
          >
            {PROJECT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section 2: Team, Status & Visibility Settings */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            2. Collaboration & Settings
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure recruitment state, visibility, and team size limits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Status */}
          <div className="space-y-1.5">
            <label
              htmlFor="status"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              Project Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            >
              {PROJECT_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label} - {st.description}
                </option>
              ))}
            </select>
          </div>

          {/* Visibility */}
          <div className="space-y-1.5">
            <label
              htmlFor="visibility"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              Visibility
            </label>
            <select
              id="visibility"
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            >
              {PROJECT_VISIBILITIES.map((vis) => (
                <option key={vis.value} value={vis.value}>
                  {vis.label} ({vis.description})
                </option>
              ))}
            </select>
          </div>

          {/* Max Team Size */}
          <div className="space-y-1.5">
            <label
              htmlFor="max_team_size"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              Target Team Size <span className="text-red-500">*</span>
            </label>
            <input
              id="max_team_size"
              name="max_team_size"
              type="number"
              min={1}
              max={50}
              required
              value={formData.max_team_size}
              onChange={handleChange}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
            {errors.max_team_size ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.max_team_size}
              </p>
            ) : (
              <p className="text-[11px] text-zinc-400">Between 1 and 50 members.</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Hackathon Details */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              3. Hackathon Track
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Is this project part of a timed hackathon competition?
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="is_hackathon"
              checked={formData.is_hackathon}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {formData.is_hackathon && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="space-y-1.5">
              <label
                htmlFor="hackathon_name"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
              >
                Hackathon Name
              </label>
              <input
                id="hackathon_name"
                name="hackathon_name"
                type="text"
                value={formData.hackathon_name}
                onChange={handleChange}
                placeholder="e.g. HackMIT, ETHDenver, DevPost Global"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
              />
              {errors.hackathon_name && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {errors.hackathon_name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="hackathon_deadline"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
              >
                Submission Deadline
              </label>
              <input
                id="hackathon_deadline"
                name="hackathon_deadline"
                type="datetime-local"
                value={formData.hackathon_deadline}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Repository & Demo Links */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            4. Project Links
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Share code repositories or live demo URLs with potential teammates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label
              htmlFor="repo_url"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              Repository URL
            </label>
            <input
              id="repo_url"
              name="repo_url"
              type="url"
              value={formData.repo_url}
              onChange={handleChange}
              placeholder="https://github.com/org/repo"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
            {errors.repo_url && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.repo_url}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="demo_url"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              Live Demo / Prototype URL
            </label>
            <input
              id="demo_url"
              name="demo_url"
              type="url"
              value={formData.demo_url}
              onChange={handleChange}
              placeholder="https://myproject.vercel.app"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
            {errors.demo_url && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.demo_url}</p>
            )}
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>{isEditing ? "Saving changes..." : "Creating project..."}</span>
            </>
          ) : (
            <span>{isEditing ? "Save Changes" : "Create Project"}</span>
          )}
        </button>
      </div>
    </form>
  );
}
