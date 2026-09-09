import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkIsBanned } from "@/lib/auth/admin";
import {
  EditProjectContainer,
  type Project,
  type ProjectRoleWithSkill,
} from "@/features/projects";
import type { Skill } from "@/features/skills/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Edit Project | DevPair",
  description: "Edit your project details and manage open teammate roles.",
};

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/projects/${id}/edit`);
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

  // Only project owner can edit
  if (projectData.owner_id !== user.id) {
    redirect(`/projects/${id}`);
  }

  // Fetch project roles with required skills
  const { data: rolesData } = await supabase
    .from("project_roles")
    .select("*, skill:skills(*)")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  // Fetch all taxonomy skills for the role skill picker
  const { data: allSkills } = await supabase
    .from("skills")
    .select("*")
    .order("name", { ascending: true });

  interface RawRoleRecord {
    id: string;
    project_id: string;
    title: string;
    description: string | null;
    required_skill_id: string | null;
    slots: number;
    created_at: string;
    skill: Skill | Skill[] | null;
  }

  const rawRoles = (rolesData as unknown as RawRoleRecord[]) || [];

  const rolesWithSkill: ProjectRoleWithSkill[] = rawRoles.map((r) => {
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

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <EditProjectContainer
        project={projectData as Project}
        roles={rolesWithSkill}
        allSkills={allSkills || []}
        userId={user.id}
      />
    </main>
  );
}
