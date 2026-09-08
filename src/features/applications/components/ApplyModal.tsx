"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { validateApplicationForm } from "../validation";
import type { ApplicationFormData, ApplicationValidationErrors } from "../types";
import type { Skill } from "@/features/skills/types";

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
  };
  role: {
    id: string;
    title: string;
    skill?: Skill | null;
  };
  applicantId: string;
  onSuccess: () => void;
}

export function ApplyModal({
  isOpen,
  onClose,
  project,
  role,
  applicantId,
  onSuccess,
}: ApplyModalProps) {
  const supabase = createClient();

  const [formData, setFormData] = useState<ApplicationFormData>({ message: "" });
  const [errors, setErrors] = useState<ApplicationValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const { isValid, errors: validationErrors } = validateApplicationForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("applications")
        .insert({
          project_id: project.id,
          role_id: role.id,
          applicant_id: applicantId,
          message: formData.message.trim(),
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        if (
          error.code === "23505" ||
          error.message?.includes("idx_applications_unique_pending")
        ) {
          setSubmitError(
            "You already have an active pending application for this role on this project."
          );
        } else if (
          error.message?.includes("cannot apply to their own project")
        ) {
          setSubmitError("Project owners cannot apply to their own projects.");
        } else if (error.code === "23514") {
          setSubmitError("Message must be between 5 and 1000 characters.");
        } else {
          setSubmitError(error.message || "Failed to submit application.");
        }
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              <span>Join Request</span>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Apply for {role.title}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              You are applying for <span className="font-semibold text-zinc-800 dark:text-zinc-200">&quot;{role.title}&quot;</span> on <span className="font-semibold text-zinc-800 dark:text-zinc-200">&quot;{project.title}&quot;</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Required Skill info pill if applicable */}
        {role.skill && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 p-3 flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Target Tech Stack:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-2xs">
              {role.skill.name}
            </span>
          </div>
        )}

        {/* Error Alert */}
        {submitError && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-xs border border-red-200 dark:border-red-900/50 flex items-start gap-2">
            <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>{submitError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label
                htmlFor="apply-message"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 font-mono"
              >
                Introductory Note <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  formData.message.length > 1000
                    ? "text-red-500 font-bold"
                    : "text-zinc-400"
                }`}
              >
                {formData.message.length}/1000
              </span>
            </div>
            <textarea
              id="apply-message"
              rows={5}
              required
              value={formData.message}
              onChange={(e) => {
                setFormData({ message: e.target.value });
                if (errors.message) setErrors({});
                setSubmitError(null);
              }}
              placeholder={`Hi! I'm interested in the ${role.title} role. I have experience with ${role.skill?.name || "these technologies"} and would love to contribute to this project because...`}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 p-3.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors resize-y"
            />
            {errors.message ? (
              <p className="text-xs text-red-600 dark:text-red-400">{errors.message}</p>
            ) : (
              <p className="text-[11px] text-zinc-400">
                Minimum 5 characters. Explain your background, availability, and motivation.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Application</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
