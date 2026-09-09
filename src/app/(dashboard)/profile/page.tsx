import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileContainer } from "@/features/profiles";
import type { UserSkillWithDetails, Skill, ProficiencyLevel } from "@/features/skills";

import { checkIsBanned } from "@/lib/auth/admin";

export const metadata = {
  title: "Profile | DevPair",
  description: "Manage your DevPair student profile, bio, links, and technical skills.",
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const banStatus = await checkIsBanned(user.id);
  if (banStatus.banned) {
    redirect("/banned");
  }

  // Fetch current user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Edge-case safety fallback if handle_new_user trigger had not yet executed
    redirect("/login");
  }

  // Fetch user skills joined with skills taxonomy
  const { data: userSkillsData } = await supabase
    .from("user_skills")
    .select("user_id, skill_id, proficiency, created_at, skill:skills(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch all taxonomy skills for the selector
  const { data: allSkills } = await supabase
    .from("skills")
    .select("*")
    .order("name", { ascending: true });

  interface RawUserSkill {
    user_id: string;
    skill_id: string;
    proficiency: string;
    created_at: string;
    skill: Skill | Skill[] | null;
  }

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
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ProfileContainer
        initialProfile={profile}
        initialUserSkills={formattedUserSkills}
        allSkills={allSkills || []}
      />
    </main>
  );
}
