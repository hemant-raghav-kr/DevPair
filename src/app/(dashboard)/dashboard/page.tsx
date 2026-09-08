import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  // Fetch the automatic profile provisioned by handle_new_user() trigger
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
            Authenticated Session Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome to DevPair, {profile?.full_name || profile?.username || user.email}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Your student profile and authentication state are active and synchronized with Supabase.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Auth Account (auth.users)
          </h2>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-500">User ID:</span>
              <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[200px] sm:max-w-[240px]">
                {user.id}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-500">Email:</span>
              <span className="text-zinc-800 dark:text-zinc-200">{user.email}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-zinc-500">Created:</span>
              <span className="text-zinc-800 dark:text-zinc-200">
                {new Date(user.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Student Profile (public.profiles)
          </h2>
          {profile ? (
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Username:</span>
                <span className="text-zinc-800 dark:text-zinc-200">@{profile.username}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Full Name:</span>
                <span className="text-zinc-800 dark:text-zinc-200">{profile.full_name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Trigger Status:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Provisioned Automatically
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
    </main>
  );
}
