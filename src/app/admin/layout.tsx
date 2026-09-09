import { requireAdmin } from "@/lib/auth/admin";
import { getAdminComplaintStats } from "@/features/complaints/queries";
import { AdminSidebar } from "./components/AdminSidebar";

export const metadata = {
  title: "Admin Dashboard | DevPair",
  description: "DevPair platform management and operational metrics.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ user, isSuperAdmin, role }, complaintStats] = await Promise.all([
    requireAdmin(),
    getAdminComplaintStats().catch(() => ({ pending: 0 })),
  ]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <AdminSidebar
        adminEmail={user.email || "admin@devpair"}
        isSuperAdmin={isSuperAdmin}
        role={role}
        pendingComplaintsCount={complaintStats.pending}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
