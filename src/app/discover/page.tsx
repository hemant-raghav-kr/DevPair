import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDiscoverProjects, DiscoveryContainer } from "@/features/discovery";
import type { Skill } from "@/features/skills/types";

export const metadata: Metadata = {
  title: "Discover Projects & Hackathons | DevPair",
  description:
    "Browse student-led development projects, find open teammate roles, and discover hackathons matching your technical skills.",
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    hackathon?: string;
    skill?: string;
    status?: string;
    availability?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function DiscoverPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();

  // Get current user session if authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch standard skills taxonomy for the skill filter dropdown
  const { data: skillsData } = await supabase
    .from("skills")
    .select("*")
    .order("name", { ascending: true });

  const skills: Skill[] = (skillsData || []) as Skill[];

  // Execute server-side discovery query with filters, ML scoring, and pagination
  const initialResult = await getDiscoverProjects({
    q: resolvedParams.q,
    category: resolvedParams.category,
    hackathon: resolvedParams.hackathon,
    skill: resolvedParams.skill,
    status: resolvedParams.status,
    availability: resolvedParams.availability,
    sort: resolvedParams.sort,
    page: resolvedParams.page ? Number(resolvedParams.page) : 1,
  });

  return (
    <main className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <DiscoveryContainer
        initialResult={initialResult}
        skills={skills}
        currentUserId={user?.id}
      />
    </main>
  );
}
