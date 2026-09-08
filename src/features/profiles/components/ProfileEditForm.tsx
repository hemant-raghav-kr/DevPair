"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AvatarPreview } from "./AvatarPreview";
import type { Profile, ProfileFormData, ProfileValidationErrors } from "../types";

interface ProfileEditFormProps {
  initialProfile: Profile;
  onSaveSuccess?: (updated: Profile) => void;
  onCancel?: () => void;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

function isValidUrl(url: string): boolean {
  if (!url || url.trim() === "") return true;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function ProfileEditForm({
  initialProfile,
  onSaveSuccess,
  onCancel,
}: ProfileEditFormProps) {
  const supabase = createClient();

  const [formData, setFormData] = useState<ProfileFormData>({
    username: initialProfile.username || "",
    full_name: initialProfile.full_name || "",
    avatar_url: initialProfile.avatar_url || "",
    bio: initialProfile.bio || "",
    college: initialProfile.college || "",
    course: initialProfile.course || "",
    graduation_year: initialProfile.graduation_year ?? "",
    availability_hours_per_week:
      initialProfile.availability_hours_per_week ?? 10,
    github_url: initialProfile.github_url || "",
    linkedin_url: initialProfile.linkedin_url || "",
    portfolio_url: initialProfile.portfolio_url || "",
  });

  const [errors, setErrors] = useState<ProfileValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: ProfileValidationErrors = {};

    // Username validation
    const trimmedUsername = formData.username.trim();
    if (!trimmedUsername) {
      newErrors.username = "Username is required.";
    } else if (!USERNAME_REGEX.test(trimmedUsername)) {
      newErrors.username =
        "Username must be 3-30 characters and contain only letters, numbers, and underscores.";
    }

    // Full name validation
    const trimmedFullName = formData.full_name.trim();
    if (!trimmedFullName) {
      newErrors.full_name = "Full name is required.";
    } else if (trimmedFullName.length < 2 || trimmedFullName.length > 100) {
      newErrors.full_name = "Full name must be between 2 and 100 characters.";
    }

    // Bio length
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = "Bio cannot exceed 500 characters.";
    }

    // College & Course length
    if (formData.college && formData.college.trim().length > 100) {
      newErrors.college = "College name must be under 100 characters.";
    }
    if (formData.course && formData.course.trim().length > 100) {
      newErrors.course = "Course name must be under 100 characters.";
    }

    // Graduation Year validation
    if (formData.graduation_year !== "" && formData.graduation_year !== null) {
      const year = Number(formData.graduation_year);
      if (isNaN(year) || !Number.isInteger(year) || year < 2020 || year > 2040) {
        newErrors.graduation_year = "Graduation year must be between 2020 and 2040.";
      }
    }

    // Availability Hours validation
    if (
      formData.availability_hours_per_week !== "" &&
      formData.availability_hours_per_week !== null
    ) {
      const hours = Number(formData.availability_hours_per_week);
      if (isNaN(hours) || !Number.isInteger(hours) || hours < 0 || hours > 100) {
        newErrors.availability_hours_per_week =
          "Availability must be between 0 and 100 hours per week.";
      }
    }

    // URLs validation
    if (formData.avatar_url && !isValidUrl(formData.avatar_url)) {
      newErrors.avatar_url = "Must be a valid URL starting with http:// or https://";
    }
    if (formData.github_url && !isValidUrl(formData.github_url)) {
      newErrors.github_url = "Must be a valid URL starting with http:// or https://";
    }
    if (formData.linkedin_url && !isValidUrl(formData.linkedin_url)) {
      newErrors.linkedin_url = "Must be a valid URL starting with http:// or https://";
    }
    if (formData.portfolio_url && !isValidUrl(formData.portfolio_url)) {
      newErrors.portfolio_url = "Must be a valid URL starting with http:// or https://";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ProfileValidationErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
    }
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        avatar_url: formData.avatar_url.trim() || null,
        bio: formData.bio.trim() || null,
        college: formData.college.trim() || null,
        course: formData.course.trim() || null,
        graduation_year:
          formData.graduation_year !== ""
            ? Number(formData.graduation_year)
            : null,
        availability_hours_per_week:
          formData.availability_hours_per_week !== ""
            ? Number(formData.availability_hours_per_week)
            : 10,
        github_url: formData.github_url.trim() || null,
        linkedin_url: formData.linkedin_url.trim() || null,
        portfolio_url: formData.portfolio_url.trim() || null,
      };

      const { data, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", initialProfile.id)
        .select()
        .single();

      if (error) {
        // Unique violation on username
        if (
          error.code === "23505" ||
          error.message?.includes("idx_profiles_username_lower") ||
          error.message?.includes("profiles_username_key")
        ) {
          setErrors({
            username: "This username is already taken. Please choose another.",
          });
        } else if (error.code === "23514") {
          setErrors({
            form: "Validation failed: Please ensure all fields satisfy boundary constraints.",
          });
        } else {
          setErrors({
            form: error.message || "Failed to update profile. Please try again.",
          });
        }
        return;
      }

      setSuccessMessage("Profile updated successfully!");
      if (onSaveSuccess && data) {
        onSaveSuccess(data);
      }
    } catch (err: unknown) {
      setErrors({
        form:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while saving.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Alert Messages */}
      {errors.form && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300 flex items-start gap-3">
          <svg className="h-5 w-5 shrink-0 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold">Unable to save profile</p>
            <p>{errors.form}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/40 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-3">
          <svg className="h-5 w-5 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Basic Information */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Basic Information
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Your personal identity across projects, hackathons, and teammate search.
          </p>
        </div>

        {/* Avatar Section with Live Preview */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <AvatarPreview
            avatarUrl={formData.avatar_url}
            name={formData.full_name || formData.username}
            size="lg"
          />
          <div className="flex-1 w-full space-y-1.5">
            <label
              htmlFor="avatar_url"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              Avatar Image URL
            </label>
            <input
              id="avatar_url"
              name="avatar_url"
              type="url"
              value={formData.avatar_url}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
            {errors.avatar_url ? (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.avatar_url}</p>
            ) : (
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Direct URL to an avatar image (e.g. GitHub avatar, Gravatar, Unsplash).
              </p>
            )}
          </div>
        </div>

        {/* Username & Full Name Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Username */}
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 font-mono text-sm pointer-events-none">
                @
              </span>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="janedoe"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 pl-8 pr-3.5 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
              />
            </div>
            {errors.username ? (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.username}</p>
            ) : (
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                3-30 letters, numbers, and underscores. Unique handle.
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="full_name"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Jane Doe"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
            {errors.full_name && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.full_name}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label
              htmlFor="bio"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              Bio / About You
            </label>
            <span
              className={`text-[11px] font-mono ${
                formData.bio.length > 500
                  ? "text-red-600 font-bold"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {formData.bio.length}/500
            </span>
          </div>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell potential teammates about your interests, project focus, past hackathons, and what kind of projects you are excited to build..."
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 p-3.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors resize-y"
          />
          {errors.bio && (
            <p className="text-xs text-red-600 dark:text-red-400">{errors.bio}</p>
          )}
        </div>
      </div>

      {/* Academic & Commitment Info */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Education & Availability
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Helps teammates match on similar campus schedules and committed workload.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* College */}
          <div className="space-y-1.5">
            <label
              htmlFor="college"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              College / University
            </label>
            <input
              id="college"
              name="college"
              type="text"
              value={formData.college}
              onChange={handleChange}
              placeholder="e.g. Stanford University, MIT, IIT"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
            {errors.college && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.college}</p>
            )}
          </div>

          {/* Course */}
          <div className="space-y-1.5">
            <label
              htmlFor="course"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              Degree / Major
            </label>
            <input
              id="course"
              name="course"
              type="text"
              value={formData.course}
              onChange={handleChange}
              placeholder="e.g. Computer Science, AI & Data"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
            {errors.course && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.course}</p>
            )}
          </div>

          {/* Graduation Year */}
          <div className="space-y-1.5">
            <label
              htmlFor="graduation_year"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              Graduation Year
            </label>
            <input
              id="graduation_year"
              name="graduation_year"
              type="number"
              min={2020}
              max={2040}
              value={formData.graduation_year}
              onChange={handleChange}
              placeholder="e.g. 2027"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
            {errors.graduation_year ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.graduation_year}
              </p>
            ) : (
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Between 2020 and 2040.
              </p>
            )}
          </div>

          {/* Availability */}
          <div className="space-y-1.5">
            <label
              htmlFor="availability_hours_per_week"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              Weekly Availability (Hours)
            </label>
            <div className="relative rounded-xl shadow-sm">
              <input
                id="availability_hours_per_week"
                name="availability_hours_per_week"
                type="number"
                min={0}
                max={100}
                value={formData.availability_hours_per_week}
                onChange={handleChange}
                placeholder="10"
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 text-xs pointer-events-none">
                hrs/wk
              </span>
            </div>
            {errors.availability_hours_per_week ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.availability_hours_per_week}
              </p>
            ) : (
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Expected time commitment (0-100 hours).
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Social & Portfolio Links */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Online Profiles & Portfolio
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Share links so potential teammates can inspect your previous code and projects.
          </p>
        </div>

        <div className="space-y-4">
          {/* GitHub */}
          <div className="space-y-1.5">
            <label
              htmlFor="github_url"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              GitHub URL
            </label>
            <input
              id="github_url"
              name="github_url"
              type="url"
              value={formData.github_url}
              onChange={handleChange}
              placeholder="https://github.com/username"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
            {errors.github_url && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.github_url}</p>
            )}
          </div>

          {/* LinkedIn */}
          <div className="space-y-1.5">
            <label
              htmlFor="linkedin_url"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              LinkedIn URL
            </label>
            <input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/username"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
            {errors.linkedin_url && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.linkedin_url}</p>
            )}
          </div>

          {/* Portfolio */}
          <div className="space-y-1.5">
            <label
              htmlFor="portfolio_url"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
            >
              Personal Website / Portfolio URL
            </label>
            <input
              id="portfolio_url"
              name="portfolio_url"
              type="url"
              value={formData.portfolio_url}
              onChange={handleChange}
              placeholder="https://yourportfolio.dev"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
            {errors.portfolio_url && (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.portfolio_url}</p>
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
              <span>Saving changes...</span>
            </>
          ) : (
            <span>Save Profile Changes</span>
          )}
        </button>
      </div>
    </form>
  );
}
