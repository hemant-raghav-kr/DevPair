import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MyApplicationsContainer,
  type ApplicationWithDetails,
  type ApplicationStatus,
} from "@/features/applications";
import type { Skill } from "@/features/skills/types";

export const metadata = {
  title: "My Applications | DevPair",
  description: "Track and manage your submitted project join requests on DevPair.",
};

interface RawApplicationQuery {
  id: string;
  project_id: string;
  applicant_id: string;
  role_id: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  project: {
    id: string;
    title: string;
    tagline: string | null;
    category: string;
    status: string;
    visibility: string;
    owner_id: string;
  } | {
    id: string;
    title: string;
    tagline: string | null;
    category: string;
    status: string;
    visibility: string;
    owner_id: string;
  }[] | null;
  role: {
    id: string;
    title: string;
    description: string | null;
    slots: number;
    skill: Skill | Skill[] | null;
  } | {
    id: string;
    title: string;
    description: string | null;
    slots: number;
    skill: Skill | Skill[] | null;
  }[] | null;
}

export default async function MyApplicationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/applications");
  }

  // Fetch applicant's join requests under RLS
  const { data: rawApps } = await supabase
    .from("applications")
    .select(`
      *,
      project:projects!applications_project_id_fkey(
        id, title, tagline, category, status, visibility, owner_id
      ),
      role:project_roles!applications_role_id_fkey(
        id, title, description, slots,
        skill:skills(*)
      )
    `)
    .eq("applicant_id", user.id)
    .order("created_at", { ascending: false });

  const rawList = (rawApps as unknown as RawApplicationQuery[]) || [];

  const formattedApplications: ApplicationWithDetails[] = rawList.map((app) => {
    const rawProj = Array.isArray(app.project) ? app.project[0] : app.project;
    const rawRole = Array.isArray(app.role) ? app.role[0] : app.role;
    const rawSkill = rawRole ? (Array.isArray(rawRole.skill) ? rawRole.skill[0] : rawRole.skill) : null;

    return {
      id: app.id,
      project_id: app.project_id,
      applicant_id: app.applicant_id,
      role_id: app.role_id,
      message: app.message,
      status: app.status as ApplicationStatus,
      created_at: app.created_at,
      updated_at: app.updated_at,
      project: rawProj || null,
      role: rawRole
        ? {
            id: rawRole.id,
            title: rawRole.title,
            description: rawRole.description,
            slots: rawRole.slots,
            skill: rawSkill as Skill | null,
          }
        : null,
    };
  });

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <MyApplicationsContainer initialApplications={formattedApplications} />
    </main>
  );
}
