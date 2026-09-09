import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkIsBanned } from "@/lib/auth/admin";
import {
  ProjectApplicationsContainer,
  type ApplicationWithOwnerView,
  type ApplicationStatus,
} from "@/features/applications";
import type { Project, ProjectRoleWithSkill } from "@/features/projects/types";
import type { Profile } from "@/features/profiles/types";
import type { Skill, UserSkillWithDetails, ProficiencyLevel } from "@/features/skills/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Review Applications | DevPair",
  description: "Review and manage student applications for your project.",
};

interface RawOwnerApplicationQuery {
  id: string;
  project_id: string;
  applicant_id: string;
  role_id: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  applicant: Profile | Profile[] | null;
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

export default async function ProjectApplicationsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/projects/${id}/applications`);
  }

  const banStatus = await checkIsBanned(user.id);
  if (banStatus.banned) {
    redirect("/banned");
  }

  // Fetch project under RLS
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (projectError || !projectData) {
    redirect("/projects");
  }

  // Strict ownership check: only owner can manage applications
  if (projectData.owner_id !== user.id) {
    redirect(`/projects/${id}`);
  }

  // Fetch project roles with required skills
  const { data: rolesData } = await supabase
    .from("project_roles")
    .select("*, skill:skills(*)")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  interface RawRoleItem {
    id: string;
    project_id: string;
    title: string;
    description: string | null;
    required_skill_id: string | null;
    slots: number;
    created_at: string;
    skill: Skill | Skill[] | null;
  }

  const formattedRoles: ProjectRoleWithSkill[] = (
    (rolesData as unknown as RawRoleItem[]) || []
  ).map((r) => {
    const rawSkill = r.skill;
    return {
      id: r.id,
      project_id: r.project_id,
      title: r.title,
      description: r.description || null,
      required_skill_id: r.required_skill_id || null,
      slots: Number(r.slots),
      created_at: r.created_at,
      skill: (Array.isArray(rawSkill) ? rawSkill[0] : rawSkill) as Skill | null,
    };
  });

  // Fetch all applications for this project
  const { data: rawApps } = await supabase
    .from("applications")
    .select(`
      *,
      applicant:profiles!applications_applicant_id_fkey(*),
      role:project_roles!applications_role_id_fkey(
        id, title, description, slots,
        skill:skills(*)
      )
    `)
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const rawList = (rawApps as unknown as RawOwnerApplicationQuery[]) || [];

  // Fetch applicant skills for all applicants to evaluate technical stack
  const applicantIds = Array.from(
    new Set(rawList.map((a) => a.applicant_id).filter(Boolean))
  );

  interface RawSkillItem {
    user_id: string;
    skill_id: string;
    proficiency: string;
    created_at: string;
    skill: Skill | Skill[] | null;
  }

  const applicantSkillsMap: Record<string, UserSkillWithDetails[]> = {};
  if (applicantIds.length > 0) {
    const { data: skillsData } = await supabase
      .from("user_skills")
      .select("*, skill:skills(*)")
      .in("user_id", applicantIds);

    ((skillsData as unknown as RawSkillItem[]) || []).forEach((item) => {
      if (!applicantSkillsMap[item.user_id]) {
        applicantSkillsMap[item.user_id] = [];
      }
      applicantSkillsMap[item.user_id].push({
        user_id: item.user_id,
        skill_id: item.skill_id,
        proficiency: item.proficiency as ProficiencyLevel,
        created_at: item.created_at,
        skill: (Array.isArray(item.skill) ? item.skill[0] : item.skill) as Skill,
      });
    });
  }

  const formattedApplications: ApplicationWithOwnerView[] = rawList.map((app) => {
    const rawApplicant = Array.isArray(app.applicant)
      ? app.applicant[0]
      : app.applicant;
    const rawRole = Array.isArray(app.role) ? app.role[0] : app.role;
    const rawSkill = rawRole
      ? Array.isArray(rawRole.skill)
        ? rawRole.skill[0]
        : rawRole.skill
      : null;

    return {
      id: app.id,
      project_id: app.project_id,
      applicant_id: app.applicant_id,
      role_id: app.role_id,
      message: app.message,
      status: app.status as ApplicationStatus,
      created_at: app.created_at,
      updated_at: app.updated_at,
      applicant: rawApplicant as Profile,
      applicantSkills: applicantSkillsMap[app.applicant_id] || [],
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
      <ProjectApplicationsContainer
        project={projectData as Project}
        roles={formattedRoles}
        initialApplications={formattedApplications}
      />
    </main>
  );
}
