"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitComplaintAction } from "../actions";
import type { ComplaintCategory } from "../types";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType?: "user" | "project" | "application" | "general";
  targetTitle?: string;
  reportedUsername?: string;
  reportedUserId?: string;
  reportedProjectId?: string;
  reportedApplicationId?: string;
}

const CATEGORY_OPTIONS: { value: ComplaintCategory; label: string; description: string }[] = [
  {
    value: "harassment",
    label: "Harassment or Bullying",
    description: "Intimidation, stalking, or targeted hostility towards you or others.",
  },
  {
    value: "inappropriate_content",
    label: "Inappropriate Content",
    description: "Offensive, discriminatory, sexually suggestive, or harmful material.",
  },
  {
    value: "spam",
    label: "Spam or Unsolicited Promotion",
    description: "Repetitive messaging, commercial advertising, or irrelevant outreach.",
  },
  {
    value: "fake_profile",
    label: "Fake Profile or Misrepresentation",
    description: "Inaccurate student identity, false credentials, or counterfeit persona.",
  },
  {
    value: "abusive_behavior",
    label: "Abusive Behavior",
    description: "Hostile communication, personal attacks, or aggressive conduct.",
  },
  {
    value: "project_misconduct",
    label: "Project Misconduct",
    description: "Dishonest project listings, fraudulent hackathon entries, or ghosting.",
  },
  {
    value: "application_misconduct",
    label: "Application Interaction Issue",
    description: "Unfair candidate rejection, unprofessional conduct, or team agreement breach.",
  },
  {
    value: "plagiarism",
    label: "Plagiarism or IP Infringement",
    description: "Unauthorized copying of code, project descriptions, or design assets.",
  },
  {
    value: "impersonation",
    label: "Impersonation",
    description: "Pretending to be another student, institution, or organization.",
  },
  {
    value: "other",
    label: "Other Issue",
    description: "Other policy violations or security concerns not listed above.",
  },
];

export function ReportModal({
  isOpen,
  onClose,
  targetType = "general",
  targetTitle,
  reportedUsername,
  reportedUserId,
  reportedProjectId,
  reportedApplicationId,
}: ReportModalProps) {
  const [category, setCategory] = useState<ComplaintCategory>(
    targetType === "user" ? "harassment" : targetType === "project" ? "project_misconduct" : "other"
  );
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ reference: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setSubject("");
    setDescription("");
    setError(null);
    setSuccessResult(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (subject.trim().length < 3) {
      setError("Please provide a subject line of at least 3 characters.");
      return;
    }

    if (description.trim().length < 10) {
      setError("Please provide at least 10 characters explaining the issue.");
      return;
    }

    startTransition(async () => {
      const res = await submitComplaintAction({
        category,
        subject,
        description,
        reportedUsername,
        reportedUserId,
        reportedProjectId,
        reportedApplicationId,
      });

      if (!res.success) {
        setError(res.error || "Failed to submit report.");
      } else if (res.data) {
        setSuccessResult({ reference: res.data.reference });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {successResult ? "Report Filed" : "Submit Moderation Report"}
              </h2>
              {targetTitle && !successResult && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[280px]">
                  Target: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{targetTitle}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {successResult ? (
          <div className="p-6 text-center space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Complaint Submitted Successfully
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Your report has been securely filed with DevPair moderation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 inline-block text-center">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold block">
                Reference Code
              </span>
              <span className="text-xl font-mono font-extrabold text-blue-600 dark:text-blue-400">
                {successResult.reference}
              </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Our moderation team will review this report in accordance with DevPair Community Standards. You can track progress in your complaints dashboard.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/complaints"
                onClick={handleResetAndClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                View My Complaints
              </Link>
              <button
                onClick={handleResetAndClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Issue Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {CATEGORY_OPTIONS.find((c) => c.value === category)?.description}
              </p>
            </div>

            {/* Subject */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Subject Summary <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-zinc-400">{subject.length}/150</span>
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value.slice(0, 150))}
                placeholder="Brief summary of the violation or concern..."
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Detailed Explanation <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-zinc-400">{description.length}/2500</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 2500))}
                placeholder="Please describe what occurred in detail. Include specific behaviors, dates, and context to help moderators investigate..."
                rows={4}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Notice */}
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                Notice on Platform Reports
              </p>
              <p>
                Reports are treated confidentially and reviewed by authorized administrators. False or frivolous reports violate our terms of use.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={isPending}
                className="px-4 py-2.5 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || subject.trim().length < 3 || description.trim().length < 10}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
