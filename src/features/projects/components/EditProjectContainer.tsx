"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectForm } from "./ProjectForm";
import { ProjectRolesManager } from "./ProjectRolesManager";
import type {
  Project,
  ProjectRoleWithSkill,
} from "../types";
import type { Skill } from "@/features/skills/types";

interface EditProjectContainerProps {
  project: Project;
  roles: ProjectRoleWithSkill[];
  allSkills: Skill[];
  userId: string;
}

export function EditProjectContainer({
  project,
  roles: initialRoles,
  allSkills,
  userId,
}: EditProjectContainerProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<"project" | "roles">("project");
  const [roles, setRoles] = useState<ProjectRoleWithSkill[]>(initialRoles);
  const [savedProject, setSavedProject] = useState<Project>(project);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Link href={`/projects/${savedProject.id}`} className="hover:underline">
              {savedProject.title}
            </Link>
            <span>/</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Edit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Edit Project & Roles
          </h1>
        </div>

        <Link
          href={`/projects/${savedProject.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors self-start sm:self-auto"
        >
          <span>Done → View Project</span>
        </Link>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveSection("project")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeSection === "project"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          1. Project Details
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("roles")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeSection === "roles"
              ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          2. Required Roles ({roles.length})
        </button>
      </div>

      {/* Main Form Section */}
      {activeSection === "project" ? (
        <ProjectForm
          initialProject={savedProject}
          userId={userId}
          onSubmitSuccess={(updated) => {
            setSavedProject(updated);
            router.refresh();
            // Automatically switch to roles section on save
            setActiveSection("roles");
          }}
          onCancel={() => router.push(`/projects/${savedProject.id}`)}
        />
      ) : (
        <ProjectRolesManager
          projectId={savedProject.id}
          initialRoles={roles}
          allSkills={allSkills}
          onRolesChange={(updated) => {
            setRoles(updated);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
