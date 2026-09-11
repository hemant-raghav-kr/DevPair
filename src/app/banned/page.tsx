import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkIsBanned } from "@/lib/auth/admin";
import { SignOutButton } from "@/components/common/SignOutButton";
import { BannedAppealSection } from "./BannedAppealSection";
import type { RestrictionRevokeRequest } from "@/types";

export const metadata = {
  title: "Account Suspended | DevPair",
  description: "Notice regarding restricted student account privileges.",
  robots: { index: false, follow: false },
};

export default async function BannedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const banStatus = await checkIsBanned(user.id);
  if (!banStatus.banned) {
    redirect("/dashboard");
  }

  // Fetch latest ban appeal request
  const { data: latestRaw } = await supabase
    .from("restriction_revoke_requests")
    .select("*")
    .eq("user_id", user.id)
    .eq("restriction_type", "ban")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const latestRequest: RestrictionRevokeRequest | null = latestRaw
    ? {
        id: latestRaw.id,
        userId: latestRaw.user_id,
        restrictionType: latestRaw.restriction_type as "ban",
        status: latestRaw.status as "pending" | "approved" | "rejected",
        reason: latestRaw.reason,
        reviewedBy: latestRaw.reviewed_by,
        reviewedAt: latestRaw.reviewed_at,
        reviewReason: latestRaw.review_reason,
        createdAt: latestRaw.created_at,
        updatedAt: latestRaw.updated_at,
      }
    : null;

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Account Restricted
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Your DevPair student account has been suspended by a platform administrator.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-left space-y-2">
          <div className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
            Reason for Suspension
          </div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {banStatus.banReason || "Violation of DevPair community standards or terms of service."}
          </p>
          {banStatus.bannedAt && (
            <div className="text-xs text-zinc-400 pt-1">
              Effective: {new Date(banStatus.bannedAt).toLocaleDateString(undefined, { dateStyle: "long" })}
            </div>
          )}
        </div>

        <BannedAppealSection initialRequest={latestRequest} />

        <div className="pt-2">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}

