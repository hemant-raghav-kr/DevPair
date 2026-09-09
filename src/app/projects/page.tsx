import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkIsBanned } from "@/lib/auth/admin";
import { MyProjectsContainer, type ProjectWithRoleCount } from "@/features/projects";

export const metadata = {
  title: "My Projects | DevPair",
  description: "Manage your DevPair project listings, defined teammate roles, and hackathons.",
};

interface RawProjectWithRoles {
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
  project_roles: { id: string }[] | null;
}

export default async function MyProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/projects");
  }

  const banStatus = await checkIsBanned(user.id);
  if (banStatus.banned) {
    redirect("/banned");
  }

  // Fetch projects owned by the current user under RLS
  const { data: projectsData } = await supabase
    .from("projects")
    .select("*, project_roles(id)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const rawProjects = (projectsData as unknown as RawProjectWithRoles[]) || [];

  const projectsWithCounts: ProjectWithRoleCount[] = rawProjects.map((p) => {
    const { project_roles, ...rest } = p;
    return {
      ...rest,
      roleCount: Array.isArray(project_roles) ? project_roles.length : 0,
    };
  });

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <MyProjectsContainer
        initialProjects={projectsWithCounts}
        userId={user.id}
      />
    </main>
  );
}
