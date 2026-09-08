"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { OwnerApplicationCard } from "./OwnerApplicationCard";
import type { ApplicationWithOwnerView, ApplicationStatus } from "../types";
import type { Project, ProjectRoleWithSkill } from "@/features/projects/types";

interface ProjectApplicationsContainerProps {
  project: Project;
  roles: ProjectRoleWithSkill[];
  initialApplications: ApplicationWithOwnerView[];
}

type FilterTab = "all" | ApplicationStatus;

export function ProjectApplicationsContainer({
  project,
  roles,
  initialApplications,
}: ProjectApplicationsContainerProps) {
  const supabase = createClient();
  const [applications, setApplications] =
    useState<ApplicationWithOwnerView[]>(initialApplications);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  // Group applications by role_id
  const applicationsByRole = useMemo(() => {
    const map = new Map<string, ApplicationWithOwnerView[]>();
    roles.forEach((r) => map.set(r.id, []));
    map.set("unassigned", []);

    applications.forEach((app) => {
      const key = app.role_id && map.has(app.role_id) ? app.role_id : "unassigned";
      map.get(key)!.push(app);
    });

    return map;
  }, [roles, applications]);

  // Derive accepted count per role
  const roleCapacities = useMemo(() => {
    const caps: Record<string, { slots: number; acceptedCount: number }> = {};
    roles.forEach((r) => {
      const roleApps = applicationsByRole.get(r.id) || [];
      const acceptedCount = roleApps.filter((a) => a.status === "accepted").length;
      caps[r.id] = {
        slots: r.slots,
        acceptedCount,
      };
    });
    return caps;
  }, [roles, applicationsByRole]);

  // Overall stats
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => a.status === "pending").length;
    const accepted = applications.filter((a) => a.status === "accepted").length;
    const totalSlots = roles.reduce((acc, r) => acc + r.slots, 0);
    return { total, pending, accepted, totalSlots };
  }, [applications, roles]);

  const handleStatusUpdate = async (
    appId: string,
    newStatus: "accepted" | "rejected"
  ) => {
    setUpdatingAppId(appId);
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", appId);

      if (error) {
        throw new Error(error.message || "Failed to update application status.");
      }

      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );
    } finally {
      setUpdatingAppId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/projects" className="hover:underline">
              Projects
            </Link>
            <span>/</span>
            <Link href={`/projects/${project.id}`} className="hover:underline">
              {project.title}
            </Link>
            <span>/</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Applications
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Review Applications
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Review student join requests and assemble your team.
          </p>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors self-start sm:self-auto"
        >
          <span>View Project</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <span className="text-[11px] uppercase font-mono tracking-wider text-zinc-400">
            Total Requests
          </span>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">
            {stats.total}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <span className="text-[11px] uppercase font-mono tracking-wider text-amber-500 font-semibold">
            Pending Review
          </span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats.pending}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <span className="text-[11px] uppercase font-mono tracking-wider text-emerald-500 font-semibold">
            Accepted Teammates
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.accepted}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <span className="text-[11px] uppercase font-mono tracking-wider text-blue-500 font-semibold">
            Configured Slots
          </span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {stats.totalSlots}
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-zinc-200 dark:border-zinc-800">
        {(
          [
            { id: "all", label: "All Applications" },
            { id: "pending", label: "Pending" },
            { id: "accepted", label: "Accepted" },
            { id: "rejected", label: "Declined" },
            { id: "withdrawn", label: "Withdrawn" },
          ] as { id: FilterTab; label: string }[]
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Roles Sections */}
      {roles.map((role) => {
        const capacity = roleCapacities[role.id] || { slots: role.slots, acceptedCount: 0 };
        const roleApps = (applicationsByRole.get(role.id) || []).filter(
          (app) => activeTab === "all" || app.status === activeTab
        );

        return (
          <div
            key={role.id}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-xs"
          >
            {/* Role Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    {role.title}
                  </h2>
                  {role.skill && (
                    <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-300 font-mono">
                      {role.skill.name}
                    </span>
                  )}
                </div>
                {role.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    {role.description}
                  </p>
                )}
              </div>

              {/* Slot Capacity Pill */}
              <div className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Capacity:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  {capacity.acceptedCount} / {capacity.slots} filled
                </span>
                {capacity.acceptedCount >= capacity.slots && (
                  <span className="rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.2">
                    FULL
                  </span>
                )}
              </div>
            </div>

            {/* Applications for this Role */}
            {roleApps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleApps.map((app) => (
                  <OwnerApplicationCard
                    key={app.id}
                    application={app}
                    roleCapacity={capacity}
                    onStatusUpdate={handleStatusUpdate}
                    isUpdating={updatingAppId === app.id}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800/80 p-6 text-center text-xs text-zinc-400">
                No applications matching this filter for the {role.title} position.
              </div>
            )}
          </div>
        );
      })}

      {/* Unassigned / Direct Applications Section if any */}
      {(applicationsByRole.get("unassigned") || []).length > 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              General Inquiries
            </h2>
            <p className="text-xs text-zinc-500">
              Applications submitted without specifying an explicit role.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(applicationsByRole.get("unassigned") || []).map((app) => (
              <OwnerApplicationCard
                key={app.id}
                application={app}
                roleCapacity={{ slots: 99, acceptedCount: 0 }}
                onStatusUpdate={handleStatusUpdate}
                isUpdating={updatingAppId === app.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
