import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProjectDetail, type ProjectWithDetails, type ProjectRoleWithSkill } from "@/features/projects";
import type { Skill } from "@/features/skills/types";
import type { Profile } from "@/features/profiles/types";
import type { ApplicationStatus } from "@/features/applications/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("title, tagline")
    .eq("id", id)
    .single();

  if (!project) {
    return {
      title: "Project Not Found | DevPair",
    };
  }

  return {
    title: `${project.title} | DevPair`,
    description: project.tagline || "Project on DevPair",
  };
}

interface RawProjectDetail {
  id: string;
  owner_id: string;
  title: string;
  tagline: string | null;
  description: string;
  category: string;
  status: string;
  visibility: string;
  is_hackathon: boolean;
  hackathon_name: string | null;
  hackathon_deadline: string | null;
  max_team_size: number;
  repo_url: string | null;
  demo_url: string | null;
  created_at: string;
  updated_at: string;
  owner: Profile | Profile[] | null;
  roles: (Record<string, unknown> & { skill: Skill | Skill[] | null })[] | null;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Query project joined with owner profile and project roles with skill under RLS
  const { data: rawData, error } = await supabase
    .from("projects")
    .select("*, owner:profiles!projects_owner_id_fkey(*), roles:project_roles(*, skill:skills(*))")
    .eq("id", id)
    .single();

  if (error || !rawData) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Project Not Found or Private
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            This project does not exist, or it is set to private and can only be accessed by the project owner.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors"
          >
            Back to Projects
          </Link>
        </div>
      </main>
    );
  }

  const projectRecord = rawData as unknown as RawProjectDetail;

  const ownerProfile: Profile = (
    Array.isArray(projectRecord.owner)
      ? projectRecord.owner[0]
      : projectRecord.owner
  ) as Profile;

  const rolesWithSkill: ProjectRoleWithSkill[] = (projectRecord.roles || []).map((r) => {
    const rawSkill = r.skill;
    return {
      id: r.id as string,
      project_id: r.project_id as string,
      title: r.title as string,
      description: (r.description as string) || null,
      required_skill_id: (r.required_skill_id as string) || null,
      slots: Number(r.slots),
      created_at: r.created_at as string,
      skill: (Array.isArray(rawSkill) ? rawSkill[0] : rawSkill) as Skill | null,
    };
  });

  const formattedProject: ProjectWithDetails = {
    id: projectRecord.id,
    owner_id: projectRecord.owner_id,
    title: projectRecord.title,
    tagline: projectRecord.tagline,
    description: projectRecord.description,
    category: projectRecord.category,
    status: projectRecord.status,
    visibility: projectRecord.visibility,
    is_hackathon: projectRecord.is_hackathon,
    hackathon_name: projectRecord.hackathon_name,
    hackathon_deadline: projectRecord.hackathon_deadline,
    max_team_size: projectRecord.max_team_size,
    repo_url: projectRecord.repo_url,
    demo_url: projectRecord.demo_url,
    created_at: projectRecord.created_at,
    updated_at: projectRecord.updated_at,
    owner: ownerProfile,
    roles: rolesWithSkill,
  };

  const isOwner = Boolean(user && user.id === formattedProject.owner_id);

  // Derive real accepted application counts per role
  const { data: acceptedApplications } = await supabase
    .from("applications")
    .select("role_id")
    .eq("project_id", id)
    .eq("status", "accepted");

  const roleAcceptedCounts: Record<string, number> = {};
  (acceptedApplications || []).forEach((a) => {
    if (a.role_id) {
      roleAcceptedCounts[a.role_id] = (roleAcceptedCounts[a.role_id] || 0) + 1;
    }
  });

  // If user is owner, fetch total applications count for review button
  let totalApplicationsCount = 0;
  if (isOwner) {
    const { count } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id);
    totalApplicationsCount = count || 0;
  }

  // If user is authenticated and not owner, check if they have applied to any roles on this project
  const userRoleApplicationStatuses: Record<string, ApplicationStatus | null> = {};
  if (user && !isOwner) {
    const { data: userApps } = await supabase
      .from("applications")
      .select("role_id, status")
      .eq("project_id", id)
      .eq("applicant_id", user.id);

    (userApps || []).forEach((a) => {
      if (a.role_id) {
        userRoleApplicationStatuses[a.role_id] = a.status as ApplicationStatus;
      }
    });
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ProjectDetail
        project={formattedProject}
        isOwner={isOwner}
        currentUserId={user?.id || null}
        roleAcceptedCounts={roleAcceptedCounts}
        userRoleApplicationStatuses={userRoleApplicationStatuses}
        totalApplicationsCount={totalApplicationsCount}
      />
    </main>
  );
}
