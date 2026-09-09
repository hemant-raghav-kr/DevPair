import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";
import type {
  ComplaintSummary,
  ComplaintDetail,
  AdminComplaintFilter,
  PaginatedComplaintsResult,
  ComplaintCategory,
  ComplaintStatus,
  ComplaintPriority,
} from "./types";

interface StudentComplaintRow {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  reported_user_id: string | null;
  reported_project_id: string | null;
  reported_application_id: string | null;
  reported_user: { username: string; full_name: string } | null;
  reported_project: { title: string } | null;
}

interface AdminComplaintQueryRow {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_project_id: string | null;
  reported_application_id: string | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  reporter: { username: string; full_name: string } | null;
  reported_user: { username: string; full_name: string } | null;
  reported_project: { title: string } | null;
}

/**
 * Retrieves the authenticated student's own submitted complaints.
 * Excludes internal admin_notes to prevent information leakage.
 */
export async function getMyComplaints(): Promise<ComplaintSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Explicitly omit admin_notes from the projection
  const { data, error } = await supabase
    .from("complaints")
    .select(`
      id,
      category,
      subject,
      description,
      status,
      priority,
      created_at,
      updated_at,
      resolved_at,
      reported_user_id,
      reported_project_id,
      reported_application_id,
      reported_user:profiles!complaints_reported_user_id_fkey(username, full_name),
      reported_project:projects!complaints_reported_project_id_fkey(title)
    `)
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[DevPair Complaints] Error fetching user complaints:", error);
    return [];
  }

  const rows = (data as unknown as StudentComplaintRow[]) || [];
  return rows.map((row) => ({
    id: row.id,
    category: row.category as ComplaintCategory,
    subject: row.subject,
    description: row.description,
    status: row.status as ComplaintStatus,
    priority: row.priority as ComplaintPriority,
    created_at: row.created_at,
    updated_at: row.updated_at,
    resolved_at: row.resolved_at,
    reported_user_id: row.reported_user_id,
    reported_project_id: row.reported_project_id,
    reported_application_id: row.reported_application_id,
    reportedUserName: row.reported_user?.full_name || null,
    reportedUserUsername: row.reported_user?.username || null,
    reportedProjectTitle: row.reported_project?.title || null,
  }));
}

/**
 * Retrieves a single complaint by ID for an administrator, with complete context.
 * Enforces requireAdmin() server-side.
 */
export async function getAdminComplaintById(complaintId: string): Promise<ComplaintDetail | null> {
  await requireAdmin();
  const adminSupabase = createAdminClient();

  const { data: row, error } = await adminSupabase
    .from("complaints")
    .select(`
      id,
      reporter_id,
      reported_user_id,
      reported_project_id,
      reported_application_id,
      category,
      subject,
      description,
      status,
      priority,
      admin_notes,
      resolved_by,
      resolved_at,
      created_at,
      updated_at,
      reporter:profiles!complaints_reporter_id_fkey(username, full_name),
      reported_user:profiles!complaints_reported_user_id_fkey(username, full_name),
      reported_project:projects!complaints_reported_project_id_fkey(title)
    `)
    .eq("id", complaintId)
    .maybeSingle();

  if (error || !row) {
    return null;
  }

  const raw = row as unknown as AdminComplaintQueryRow;

  // Fetch emails from auth.admin
  let reporterEmail: string | null = null;
  let reportedUserEmail: string | null = null;
  let resolverEmail: string | null = null;

  try {
    const [repUser, targetUser, resUser] = await Promise.all([
      adminSupabase.auth.admin.getUserById(raw.reporter_id),
      raw.reported_user_id ? adminSupabase.auth.admin.getUserById(raw.reported_user_id) : Promise.resolve({ data: { user: null } }),
      raw.resolved_by ? adminSupabase.auth.admin.getUserById(raw.resolved_by) : Promise.resolve({ data: { user: null } }),
    ]);

    reporterEmail = repUser.data?.user?.email || null;
    reportedUserEmail = targetUser.data?.user?.email || null;
    resolverEmail = resUser.data?.user?.email || null;
  } catch (err) {
    console.error("[DevPair Complaints] Error resolving auth emails:", err);
  }

  return {
    id: raw.id,
    reporter_id: raw.reporter_id,
    reported_user_id: raw.reported_user_id,
    reported_project_id: raw.reported_project_id,
    reported_application_id: raw.reported_application_id,
    category: raw.category as ComplaintCategory,
    subject: raw.subject,
    description: raw.description,
    status: raw.status as ComplaintStatus,
    priority: raw.priority as ComplaintPriority,
    admin_notes: raw.admin_notes,
    resolved_by: raw.resolved_by,
    resolved_at: raw.resolved_at,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    reporterName: raw.reporter?.full_name || null,
    reporterUsername: raw.reporter?.username || null,
    reporterEmail,
    reportedUserName: raw.reported_user?.full_name || null,
    reportedUserUsername: raw.reported_user?.username || null,
    reportedUserEmail,
    reportedProjectTitle: raw.reported_project?.title || null,
    resolverEmail,
  };
}

/**
 * Retrieves paginated complaints for the Admin Moderation Queue.
 * Supports status, priority, category filtering and keyword search.
 * Enforces requireAdmin() server-side.
 */
export async function getAdminComplaints(
  filter: AdminComplaintFilter = {}
): Promise<PaginatedComplaintsResult> {
  await requireAdmin();
  const adminSupabase = createAdminClient();

  const page = Math.max(1, filter.page || 1);
  const pageSize = Math.min(50, Math.max(1, filter.pageSize || 15));
  const offset = (page - 1) * pageSize;

  let query = adminSupabase.from("complaints").select(
    `
      id,
      reporter_id,
      reported_user_id,
      reported_project_id,
      reported_application_id,
      category,
      subject,
      description,
      status,
      priority,
      admin_notes,
      resolved_by,
      resolved_at,
      created_at,
      updated_at,
      reporter:profiles!complaints_reporter_id_fkey(username, full_name),
      reported_user:profiles!complaints_reported_user_id_fkey(username, full_name),
      reported_project:projects!complaints_reported_project_id_fkey(title)
    `,
    { count: "exact" }
  );

  if (filter.status && filter.status !== "all") {
    query = query.eq("status", filter.status);
  }

  if (filter.priority && filter.priority !== "all") {
    query = query.eq("priority", filter.priority);
  }

  if (filter.category && filter.category !== "all") {
    query = query.eq("category", filter.category);
  }

  if (filter.search && filter.search.trim()) {
    const term = `%${filter.search.trim()}%`;
    query = query.or(`subject.ilike.${term},description.ilike.${term}`);
  }

  if (filter.sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    // Default newest first, with critical/high prioritized if in pending status
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("[DevPair Complaints] Error querying admin complaints queue:", error);
    return {
      complaints: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  const rows = (data as unknown as AdminComplaintQueryRow[]) || [];
  const complaints: ComplaintDetail[] = rows.map((row) => ({
    id: row.id,
    reporter_id: row.reporter_id,
    reported_user_id: row.reported_user_id,
    reported_project_id: row.reported_project_id,
    reported_application_id: row.reported_application_id,
    category: row.category as ComplaintCategory,
    subject: row.subject,
    description: row.description,
    status: row.status as ComplaintStatus,
    priority: row.priority as ComplaintPriority,
    admin_notes: row.admin_notes,
    resolved_by: row.resolved_by,
    resolved_at: row.resolved_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    reporterName: row.reporter?.full_name || null,
    reporterUsername: row.reporter?.username || null,
    reportedUserName: row.reported_user?.full_name || null,
    reportedUserUsername: row.reported_user?.username || null,
    reportedProjectTitle: row.reported_project?.title || null,
  }));

  const total = count || 0;
  return {
    complaints,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Returns aggregate metrics for the complaints moderation queue.
 */
export async function getAdminComplaintStats() {
  await requireAdmin();
  const adminSupabase = createAdminClient();

  const [totalRes, pendingRes, underReviewRes, resolvedRes, highPriorityRes] =
    await Promise.all([
      adminSupabase.from("complaints").select("id", { count: "exact", head: true }),
      adminSupabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "pending"),
      adminSupabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "under_review"),
      adminSupabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "resolved"),
      adminSupabase.from("complaints").select("id", { count: "exact", head: true }).in("priority", ["high", "critical"]).in("status", ["pending", "under_review"]),
    ]);

  return {
    total: totalRes.count || 0,
    pending: pendingRes.count || 0,
    underReview: underReviewRes.count || 0,
    resolved: resolvedRes.count || 0,
    activeUrgent: highPriorityRes.count || 0,
  };
}
