import React from "react";
import Link from "next/link";
import type { ProjectRecommendation } from "../types";

interface RecommendationCardProps {
  recommendation: ProjectRecommendation;
  isFeatured?: boolean;
}

export function RecommendationCard({
  recommendation,
  isFeatured = false,
}: RecommendationCardProps) {
  const { project, bestRole, bestMatch, openSlots, owner } = recommendation;
  const score = bestMatch.score;

  // Tier color styling
  let badgeColor = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
  let progressColor = "bg-blue-600";
  if (score >= 85) {
    badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    progressColor = "bg-emerald-600";
  } else if (score >= 70) {
    badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
    progressColor = "bg-indigo-600";
  } else if (score >= 50) {
    badgeColor = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    progressColor = "bg-amber-600";
  } else {
    badgeColor = "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
    progressColor = "bg-zinc-400";
  }

  // Display top 3 explainable factors
  const topFactors = bestMatch.factors.slice(0, 3);

  // Featured / Spotlight horizontal layout for single recommendation on desktop
  if (isFeatured) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Section: Badges, Title, Tagline, Best-Fit Role, Lead */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border border-violet-200/80 dark:border-violet-900/60 font-mono">
                  <span>★</span>
                  <span>Top Match</span>
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                  {project.category.replace(/_/g, " ")}
                </span>
                {project.is_hackathon && (
                  <span className="text-xs px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900 whitespace-nowrap">
                    Hackathon
                  </span>
                )}
              </div>

              {/* ML Score Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-2xs shrink-0 ${badgeColor}`}
              >
                <span className={`h-2 w-2 rounded-full ${progressColor}`} />
                <span className="text-base font-extrabold">{score}%</span>
                <span>Match</span>
              </div>
            </div>

            {/* Project Title & Tagline */}
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug">
                <Link
                  href={`/projects/${project.id}`}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {project.title}
                </Link>
              </h3>
              {project.tagline && (
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
                  {project.tagline}
                </p>
              )}
            </div>

            {/* Best-Fit Role Box */}
            <div className="rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-800/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono text-[11px]">
                  Best-Fit Role for Your Skills
                </span>
                <span className="font-mono text-zinc-600 dark:text-zinc-300 font-medium">
                  {openSlots} {openSlots === 1 ? "slot" : "slots"} open
                </span>
              </div>
              <div className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center justify-between gap-3">
                <span className="truncate">{bestRole.title}</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-900/60">
                  {bestMatch.tier}
                </span>
              </div>
            </div>

            {/* Owner Info */}
            {owner && (
              <div className="flex items-center gap-2 pt-1 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xs uppercase">
                  {owner.username.slice(0, 2)}
                </div>
                <span>Led by <strong className="text-zinc-700 dark:text-zinc-200">@{owner.username}</strong></span>
              </div>
            )}
          </div>

          {/* Right Section: Key Matching Factors & CTA */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-6 lg:pl-8 lg:border-l lg:border-zinc-200/80 lg:dark:border-zinc-800">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
                  AI Matching Breakdown
                </p>
                <span className="text-2xs text-zinc-400">ML v{bestMatch.modelVersion}</span>
              </div>
              <ul className="space-y-2 text-xs">
                {topFactors.map((factor, idx) => (
                  <li
                    key={idx}
                    className={`flex items-start gap-2 leading-relaxed p-2.5 rounded-xl border ${
                      factor.type === "positive"
                        ? "bg-emerald-50/50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50"
                        : factor.type === "negative"
                        ? "bg-amber-50/50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border-amber-100 dark:border-amber-900/50"
                        : "bg-zinc-50 text-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-300 border-zinc-100 dark:border-zinc-800"
                    }`}
                  >
                    <span className="font-bold text-sm shrink-0">
                      {factor.type === "positive" ? "✓" : factor.type === "negative" ? "△" : "•"}
                    </span>
                    <span>{factor.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4">
              <div className="text-2xs text-zinc-400 font-mono">
                Compatibility confidence: {Math.round(bestMatch.probability * 100)}%
              </div>
              <Link
                href={`/projects/${project.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition-colors"
              >
                <span>View Project & Roles</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard card layout for multi-item grids
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Top Header: Compatibility Score & Category */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
              {project.category.replace(/_/g, " ")}
            </span>
            {project.is_hackathon && (
              <span className="text-xs px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900 whitespace-nowrap">
                Hackathon
              </span>
            )}
          </div>

          {/* ML Score Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs shrink-0 ${badgeColor}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${progressColor}`} />
            <span className="text-sm font-extrabold">{score}%</span>
            <span>Match</span>
          </div>
        </div>

        {/* Project Title & Tagline */}
        <div>
          <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-snug">
            <Link
              href={`/projects/${project.id}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {project.title}
            </Link>
          </h3>
          {project.tagline && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
              {project.tagline}
            </p>
          )}
        </div>

        {/* Best-Fit Role Box */}
        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-800/40 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">
              Best-Fit Role:
            </span>
            <span className="font-mono text-zinc-600 dark:text-zinc-300 shrink-0">
              {openSlots} {openSlots === 1 ? "slot" : "slots"} open
            </span>
          </div>
          <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center justify-between gap-2">
            <span className="truncate">{bestRole.title}</span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0">
              {bestMatch.tier}
            </span>
          </div>
        </div>

        {/* Explainability Breakdown */}
        <div className="space-y-1.5 pt-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
            Key Matching Factors
          </p>
          <ul className="space-y-1.5 text-xs">
            {topFactors.map((factor, idx) => (
              <li
                key={idx}
                className={`flex items-start gap-1.5 leading-snug ${
                  factor.type === "positive"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : factor.type === "negative"
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <span className="font-bold shrink-0">
                  {factor.type === "positive" ? "✓" : factor.type === "negative" ? "△" : "•"}
                </span>
                <span>{factor.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Card Footer: Owner & CTA */}
      <div className="pt-5 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3">
        {owner ? (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[160px]">
            By <span className="font-medium text-zinc-700 dark:text-zinc-300">@{owner.username}</span>
          </div>
        ) : (
          <div />
        )}

        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors shrink-0"
        >
          <span>View Project</span>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
