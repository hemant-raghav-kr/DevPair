import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkIsBanned } from "@/lib/auth/admin";
import { getMyComplaints } from "@/features/complaints/queries";
import { ComplaintsList } from "@/features/complaints/components/ComplaintsList";
import { ReportButton } from "@/features/complaints/components/ReportButton";

export const metadata = {
  title: "My Complaints & Reports | DevPair",
  description: "Track the status of your submitted moderation reports and platform feedback.",
};

export default async function StudentComplaintsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/complaints");
  }

  const banStatus = await checkIsBanned(user.id);
  if (banStatus.banned) {
    redirect("/banned");
  }

  const complaints = await getMyComplaints();

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              My Complaints & Moderation Reports
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Review the status, investigation progress, and resolution of issues you have reported.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ReportButton
              targetType="general"
              buttonLabel="Report a Problem"
              variant="danger"
              size="md"
            />
          </div>
        </div>

        {/* Complaints List */}
        <ComplaintsList complaints={complaints} />
      </div>
    </div>
  );
}
