"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProjectRoleCard } from "./ProjectRoleCard";
import { ProjectRoleForm } from "./ProjectRoleForm";
import type {
  ProjectRoleWithSkill,
  ProjectRoleFormData,
} from "../types";
import type { Skill } from "@/features/skills/types";

interface ProjectRolesManagerProps {
  projectId: string;
  initialRoles: ProjectRoleWithSkill[];
  allSkills: Skill[];
  onRolesChange?: (roles: ProjectRoleWithSkill[]) => void;
}

export function ProjectRolesManager({
  projectId,
  initialRoles,
  allSkills,
  onRolesChange,
}: ProjectRolesManagerProps) {
  const supabase = createClient();

  const [roles, setRoles] = useState<ProjectRoleWithSkill[]>(initialRoles);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  // Handle Add Role
  const handleAddRole = async (data: ProjectRoleFormData) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const { data: newRole, error } = await supabase
        .from("project_roles")
        .insert({
          project_id: projectId,
          title: data.title.trim(),
          description: data.description.trim() || null,
          required_skill_id: data.required_skill_id || null,
          slots: Number(data.slots),
        })
        .select("*, skill:skills(*)")
        .single();

      if (error || !newRole) {
        throw new Error(error?.message || "Failed to create project role.");
      }

      const formattedRole: ProjectRoleWithSkill = {
        ...newRole,
        skill: (Array.isArray(newRole.skill) ? newRole.skill[0] : newRole.skill) as Skill | null,
      };

      const updated = [...roles, formattedRole];
      setRoles(updated);
      onRolesChange?.(updated);
      setIsAdding(false);
      setFeedback({ type: "success", message: `Role "${formattedRole.title}" added!` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Role
  const handleUpdateRole = async (roleId: string, data: ProjectRoleFormData) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const { data: updatedRole, error } = await supabase
        .from("project_roles")
        .update({
          title: data.title.trim(),
          description: data.description.trim() || null,
          required_skill_id: data.required_skill_id || null,
          slots: Number(data.slots),
        })
        .eq("id", roleId)
        .select("*, skill:skills(*)")
        .single();

      if (error || !updatedRole) {
        throw new Error(error?.message || "Failed to update project role.");
      }

      const formattedRole: ProjectRoleWithSkill = {
        ...updatedRole,
        skill: (Array.isArray(updatedRole.skill) ? updatedRole.skill[0] : updatedRole.skill) as Skill | null,
      };

      const updated = roles.map((r) => (r.id === roleId ? formattedRole : r));
      setRoles(updated);
      onRolesChange?.(updated);
      setEditingRoleId(null);
      setFeedback({ type: "success", message: `Role "${formattedRole.title}" updated!` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Role
  const handleDeleteRole = async (roleId: string, roleTitle: string) => {
    if (!window.confirm(`Are you sure you want to remove the "${roleTitle}" role?`)) {
      return;
    }

    setDeletingRoleId(roleId);
    setFeedback(null);
    try {
      const { error } = await supabase
        .from("project_roles")
        .delete()
        .eq("id", roleId);

      if (error) {
        throw new Error(error.message || "Failed to delete role.");
      }

      const updated = roles.filter((r) => r.id !== roleId);
      setRoles(updated);
      onRolesChange?.(updated);
      setFeedback({ type: "success", message: `Role "${roleTitle}" removed.` });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete role.",
      });
    } finally {
      setDeletingRoleId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
            Required Team Roles ({roles.length})
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Specify the skills, responsibilities, and team slots needed for this project.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              setEditingRoleId(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Add Role</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between border ${
            feedback.type === "error"
              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50"
              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Add Role Form */}
      {isAdding && (
        <ProjectRoleForm
          skills={allSkills}
          onSubmit={handleAddRole}
          onCancel={() => setIsAdding(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Roles List */}
      {roles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => {
            if (editingRoleId === role.id) {
              return (
                <div key={role.id} className="md:col-span-2">
                  <ProjectRoleForm
                    initialData={role}
                    skills={allSkills}
                    onSubmit={(data) => handleUpdateRole(role.id, data)}
                    onCancel={() => setEditingRoleId(null)}
                    isSubmitting={isSubmitting}
                  />
                </div>
              );
            }

            return (
              <ProjectRoleCard
                key={role.id}
                role={role}
                isOwner={true}
                onEdit={() => {
                  setEditingRoleId(role.id);
                  setIsAdding(false);
                }}
                onDelete={() => handleDeleteRole(role.id, role.title)}
                isDeleting={deletingRoleId === role.id}
              />
            );
          })}
        </div>
      ) : (
        !isAdding && (
          <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-2">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              No roles added to this project yet
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Defining needed roles like &quot;Backend Engineer&quot; or &quot;UI Designer&quot; helps compatible teammates discover your project.
            </p>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 pt-1 inline-block"
            >
              + Define your first role
            </button>
          </div>
        )
      )}
    </div>
  );
}
