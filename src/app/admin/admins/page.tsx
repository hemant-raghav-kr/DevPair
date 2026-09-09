import { requireAdmin } from "@/lib/auth/admin";
import { getAdminsList } from "@/features/admin/queries";
import { AdminsContainer } from "./components/AdminsContainer";

export const metadata = {
  title: "Admin Directory | DevPair Admin",
  description: "Manage authorized platform administrators and Super Admin access.",
};

export default async function AdminManagementPage() {
  const adminContext = await requireAdmin();
  const admins = await getAdminsList();

  return <AdminsContainer admins={admins} isViewerSuperAdmin={adminContext.isSuperAdmin} />;
}
