import React from "react";
import Link from "next/link";
import { AvatarPreview } from "./AvatarPreview";
import { SkillBadge } from "@/features/skills/components/SkillBadge";
import type { Profile } from "../types";
import type { UserSkillWithDetails } from "@/features/skills/types";

interface ProfileCardProps {
  profile: Profile;
  skills: UserSkillWithDetails[];
  isOwnProfile?: boolean;
  onEditClick?: () => void;
}

export function ProfileCard({
  profile,
  skills,
  isOwnProfile = false,
  onEditClick,
}: ProfileCardProps) {
  const hasSocialLinks =
    Boolean(profile.github_url) ||
    Boolean(profile.linkedin_url) ||
    Boolean(profile.portfolio_url);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      {/* Profile Header Banner */}
      <div className="h-32 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 border-b border-zinc-200/60 dark:border-zinc-800/60" />

      <div className="px-6 sm:px-8 pb-8 -mt-14 space-y-6">
        {/* Avatar & Top Info */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <AvatarPreview
              avatarUrl={profile.avatar_url}
              name={profile.full_name || profile.username}
              size="xl"
              className="ring-4 ring-white dark:ring-zinc-900 shadow-md"
            />
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                {profile.full_name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                  @{profile.username}
                </span>
                {(profile.college || profile.course) && <span>•</span>}
                {profile.college && <span>{profile.college}</span>}
                {profile.course && <span>({profile.course})</span>}
                {profile.graduation_year && (
                  <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    Class of {profile.graduation_year}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isOwnProfile && onEditClick && (
            <button
              onClick={onEditClick}
              type="button"
              className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-4 py-2 text-sm font-semibold shadow-sm transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Bio Section */}
        {profile.bio ? (
          <div className="space-y-1.5 pt-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              About
            </h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed max-w-3xl">
              {profile.bio}
            </p>
          </div>
        ) : (
          <div className="py-2 text-xs italic text-zinc-400 dark:text-zinc-500">
            No bio provided yet. Add an overview of your interests and project goals.
          </div>
        )}

        {/* Availability & Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
          {/* Availability */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              Weekly Availability
            </h2>
            <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 px-3.5 py-2 text-sm text-blue-800 dark:text-blue-300">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">
                {profile.availability_hours_per_week ?? 10} hours/week
              </span>
            </div>
          </div>

          {/* External Links */}
          <div className="md:col-span-2 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              Online Profiles
            </h2>
            {hasSocialLinks ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {profile.github_url && (
                  <Link
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span>GitHub</span>
                    <svg className="h-3.5 w-3.5 opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </Link>
                )}
                {profile.linkedin_url && (
                  <Link
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span>LinkedIn</span>
                    <svg className="h-3.5 w-3.5 opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </Link>
                )}
                {profile.portfolio_url && (
                  <Link
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span>Portfolio</span>
                    <svg className="h-3.5 w-3.5 opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-xs italic text-zinc-400 dark:text-zinc-500">
                No external portfolio or social links provided.
              </div>
            )}
          </div>
        </div>

        {/* Skills Section */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
              Skills ({skills.length})
            </h2>
          </div>

          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {skills.map((item) => (
                <SkillBadge
                  key={item.skill_id}
                  name={item.skill?.name || "Skill"}
                  category={item.skill?.category}
                  proficiency={item.proficiency}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center space-y-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No skills added yet. Add your skills to improve teammate matching and project recommendations.
              </p>
              {isOwnProfile && onEditClick && (
                <button
                  type="button"
                  onClick={onEditClick}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                  + Add your first skill
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
