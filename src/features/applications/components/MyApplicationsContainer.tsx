"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ApplicationCard } from "./ApplicationCard";
import type { ApplicationWithDetails, ApplicationStatus } from "../types";

interface MyApplicationsContainerProps {
  initialApplications: ApplicationWithDetails[];
}

type FilterTab = "all" | ApplicationStatus;

export function MyApplicationsContainer({
  initialApplications,
}: MyApplicationsContainerProps) {
  const [applications, setApplications] =
    useState<ApplicationWithDetails[]>(initialApplications);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const handleWithdrawn = (id: string) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "withdrawn" } : app))
    );
  };

  const filteredApplications = useMemo(() => {
    if (activeTab === "all") return applications;
    return applications.filter((app) => app.status === activeTab);
  }, [applications, activeTab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: applications.length };
    applications.forEach((a) => {
      c[a.status] = (c[a.status] || 0) + 1;
    });
    return c;
  }, [applications]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            My Applications
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track the status of your join requests for college projects and hackathons.
          </p>
        </div>

        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors self-start sm:self-auto"
        >
          <span>Explore Projects</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(
          [
            { id: "all", label: "All Requests" },
            { id: "pending", label: "Pending" },
            { id: "accepted", label: "Accepted" },
            { id: "rejected", label: "Not Selected" },
            { id: "withdrawn", label: "Withdrawn" },
          ] as { id: FilterTab; label: string }[]
        ).map((tab) => {
          const count = counts[tab.id] || 0;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-zinc-700 dark:bg-zinc-300 text-white dark:text-zinc-900"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications List */}
      {filteredApplications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApplications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onWithdrawn={handleWithdrawn}
            />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-12 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              No applications submitted yet
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
              When you discover projects looking for your skills, submit join requests to collaborate with student teams.
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors"
          >
            Browse Projects
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
          No applications match the &quot;{activeTab}&quot; filter.
        </div>
      )}
    </div>
  );
}
