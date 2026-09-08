import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicProfileView } from "@/features/profiles";
import type { Skill, UserSkillWithDetails, ProficiencyLevel } from "@/features/skills/types";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, bio")
    .ilike("username", username)
    .maybeSingle();

  if (!profile) {
    return {
      title: "User Not Found | DevPair",
    };
  }

  const displayName = profile.full_name || profile.username;
  return {
    title: `${displayName} (@${profile.username}) | DevPair`,
    description:
      profile.bio ||
      `View ${displayName}'s student developer profile, technical skills, and availability on DevPair.`,
  };
}

interface RawUserSkill {
  user_id: string;
  skill_id: string;
  proficiency: string;
  created_at: string;
  skill: Skill | Skill[] | null;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Optional: fetch authenticated user to determine if viewing own profile
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Case-insensitive profile lookup
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const isOwnProfile = currentUser?.id === profile.id;

  // Fetch verified user skills joined with skills taxonomy
  const { data: userSkillsData } = await supabase
    .from("user_skills")
    .select("user_id, skill_id, proficiency, created_at, skill:skills(*)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const formattedUserSkills: UserSkillWithDetails[] = (
    (userSkillsData as unknown as RawUserSkill[]) || []
  )
    .filter((row) => row.skill !== null)
    .map((row) => ({
      user_id: row.user_id,
      skill_id: row.skill_id,
      proficiency: row.proficiency as ProficiencyLevel,
      created_at: row.created_at,
      skill: (Array.isArray(row.skill) ? row.skill[0] : row.skill) as Skill,
    }));

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Back / Context Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back to Projects</span>
        </Link>

        {isOwnProfile && (
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            <span>Manage Settings</span>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        )}
      </div>

      {/* Public Profile Card */}
      <PublicProfileView
        profile={profile}
        skills={formattedUserSkills}
        isOwnProfile={isOwnProfile}
      />
    </main>
  );
}
