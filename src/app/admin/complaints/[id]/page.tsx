import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminComplaintById } from "@/features/complaints/queries";
import { AdminComplaintDetailView } from "@/features/complaints/components/AdminComplaintDetailView";

export const metadata = {
  title: "Investigate Complaint | DevPair Admin",
  description: "Detailed investigation and moderation of student report.",
};

interface AdminComplaintDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminComplaintDetailPage({ params }: AdminComplaintDetailPageProps) {
  const adminContext = await requireAdmin();
  const { id } = await params;

  const complaint = await getAdminComplaintById(id);

  if (!complaint) {
    notFound();
  }

  return (
    <AdminComplaintDetailView
      complaint={complaint}
      viewerIsSuperAdmin={adminContext.isSuperAdmin}
    />
  );
}
