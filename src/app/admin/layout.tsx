import { requireAdmin } from "@/lib/auth/admin";
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
  const { user } = await requireAdmin();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <AdminSidebar adminEmail={user.email || "admin@devpair"} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
