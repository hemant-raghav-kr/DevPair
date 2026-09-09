import React from "react";
import Link from "next/link";
import { RecommendationCard } from "./RecommendationCard";
import type { ProjectRecommendation } from "../types";

interface RecommendedProjectsSectionProps {
  recommendations: ProjectRecommendation[];
  hasSkills: boolean;
}

export function RecommendedProjectsSection({
  recommendations,
  hasSkills,
}: RecommendedProjectsSectionProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Recommended for You
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border border-violet-200/80 dark:border-violet-900/60 font-mono">
              ML Matching Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Real-time project suitability calculated using your verified technical skills, category overlap, and weekly availability.
          </p>
        </div>

        <Link
          href="/projects"
          className="self-start sm:self-auto text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Browse all projects &rarr;
        </Link>
      </div>

      {recommendations.length > 0 ? (
        recommendations.length === 1 ? (
          <div className="w-full">
            <RecommendationCard
              recommendation={recommendations[0]}
              isFeatured={true}
            />
          </div>
        ) : recommendations.length === 2 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.project.id} recommendation={rec} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.project.id} recommendation={rec} />
            ))}
          </div>
        )
      ) : !hasSkills ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-4 bg-white dark:bg-zinc-900/40">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              No technical skills listed yet
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Add your technical skills and weekly availability to your profile to let our ML matching engine recommend open project roles tailored to your stack.
            </p>
          </div>
          <div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Manage Profile & Skills</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-3 bg-white dark:bg-zinc-900/40">
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              No open roles currently recruiting
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              There are currently no open recruiting roles matching your criteria. Browse existing projects or start your own!
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Create a Project</span>
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 py-2 text-xs font-semibold transition-colors"
            >
              <span>Browse Projects</span>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
