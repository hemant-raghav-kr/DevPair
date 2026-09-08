"use client";

import React, { useState } from "react";
import { ProfileCard } from "./ProfileCard";
import { ProfileEditForm } from "./ProfileEditForm";
import { UserSkillsManager } from "@/features/skills/components/UserSkillsManager";
import type { Profile } from "../types";
import type { Skill, UserSkillWithDetails } from "@/features/skills/types";

interface ProfileContainerProps {
  initialProfile: Profile;
  initialUserSkills: UserSkillWithDetails[];
  allSkills: Skill[];
}

export function ProfileContainer({
  initialProfile,
  initialUserSkills,
  allSkills,
}: ProfileContainerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "edit">("overview");
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [skills, setSkills] = useState<UserSkillWithDetails[]>(initialUserSkills);

  const [editSection, setEditSection] = useState<"profile" | "skills">("profile");

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            {activeTab === "overview" ? "Student Profile" : "Edit Profile & Skills"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {activeTab === "overview"
              ? "Your public portfolio, academic details, and verified technical skills."
              : "Update your personal info, availability, links, and manage your technical stack."}
          </p>
        </div>

        {/* View / Edit Mode Switcher */}
        <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-1 border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span>Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "edit"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "overview" ? (
        <ProfileCard
          profile={profile}
          skills={skills}
          isOwnProfile={true}
          onEditClick={() => setActiveTab("edit")}
        />
      ) : (
        <div className="space-y-6">
          {/* Sub-navigation inside Edit mode */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setEditSection("profile")}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                editSection === "profile"
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              1. Profile Details
            </button>
            <button
              type="button"
              onClick={() => setEditSection("skills")}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                editSection === "skills"
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              2. Skills & Stack ({skills.length})
            </button>
          </div>

          {editSection === "profile" ? (
            <ProfileEditForm
              initialProfile={profile}
              onSaveSuccess={(updated) => {
                setProfile(updated);
              }}
              onCancel={() => setActiveTab("overview")}
            />
          ) : (
            <UserSkillsManager
              userId={profile.id}
              initialSkills={skills}
              allTaxonomySkills={allSkills}
              onSkillsChange={(updated) => {
                setSkills(updated);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
