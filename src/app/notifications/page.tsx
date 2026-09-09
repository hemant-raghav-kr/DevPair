import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationsContainer, type Notification } from "@/features/notifications";

export const metadata = {
  title: "Notifications | DevPair",
  description: "View and manage your DevPair real-time notifications, join requests, and team updates.",
};

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/notifications");
  }

  // Fetch initial notifications and unread count under RLS
  const [notifsRes, countRes] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false),
  ]);

  const initialNotifications = (notifsRes.data as Notification[]) || [];
  const initialUnreadCount = countRes.count || 0;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <NotificationsContainer
        userId={user.id}
        initialNotifications={initialNotifications}
        initialUnreadCount={initialUnreadCount}
      />
    </main>
  );
}
