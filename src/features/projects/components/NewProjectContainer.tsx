"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectForm } from "./ProjectForm";

interface NewProjectContainerProps {
  userId: string;
}

export function NewProjectContainer({ userId }: NewProjectContainerProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Link href="/projects" className="hover:underline">
              Projects
            </Link>
            <span>/</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">New</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create New Project
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            List your project or hackathon idea to discover and recruit compatible teammates.
          </p>
        </div>

        <Link
          href="/projects"
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Cancel
        </Link>
      </div>

      <ProjectForm
        userId={userId}
        onSubmitSuccess={(createdProject) => {
          // Redirect to edit page so user can immediately define roles, or directly to project view
          router.push(`/projects/${createdProject.id}/edit`);
          router.refresh();
        }}
        onCancel={() => router.push("/projects")}
      />
    </div>
  );
}
