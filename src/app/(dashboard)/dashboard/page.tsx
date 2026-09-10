import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getRecommendedProjectsForUser,
  RecommendedProjectsSection,
} from "@/features/matching";

import { checkIsBanned } from "@/lib/auth/admin";

export const metadata = {
  title: "Dashboard | DevPair",
  description: "DevPair Student Dashboard with ML project recommendations and activity.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const banStatus = await checkIsBanned(user.id);
  if (banStatus.banned) {
    redirect("/banned");
  }

  // Fetch the automatic profile provisioned by handle_new_user() trigger
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Check if student has added any skills
  const { count: skillsCount } = await supabase
    .from("user_skills")
    .select("skill_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Compute real-time ML project recommendations
  const recommendations = await getRecommendedProjectsForUser(user.id, 6);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
            Active Student Session
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back, {profile?.full_name?.trim() || profile?.username || "Student"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Discover peer projects, manage applications, and collaborate with college developers.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>New Project</span>
          </Link>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-4 py-2 text-xs font-semibold transition-colors"
          >
            <span>Edit Profile & Skills</span>
          </Link>
        </div>
      </div>

      {/* ML Recommended Projects Section */}
      <RecommendedProjectsSection
        recommendations={recommendations}
        hasSkills={(skillsCount ?? 0) > 0}
      />

      {/* Student Profile Summary */}
      <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="max-w-xl">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-3 shadow-xs">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Student Profile (public.profiles)
            </h3>
            {profile ? (
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500">Username:</span>
                  <span className="text-zinc-800 dark:text-zinc-200">@{profile.username}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500">Availability:</span>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {profile.availability_hours_per_week ?? 10} hrs/week
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Listed Skills:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    {skillsCount ?? 0} verified skills
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-amber-600 dark:text-amber-400">
                Profile row pending synchronization.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
