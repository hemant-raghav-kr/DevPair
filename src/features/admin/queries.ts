import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireAdmin,
  CANONICAL_SUPER_ADMIN_UUID,
  CANONICAL_SUPER_ADMIN_EMAIL,
  type AdminRole,
} from "@/lib/auth/admin";
import type {
  AdminOverviewMetrics,
  AdminUserItem,
  AdminListItem,
  AdminProjectItem,
  AdminApplicationItem,
  AdminAuditLogItem,
  AdminRevocationRequestItem,
  PaginatedResult,
} from "./types";
import type { AuditEventType } from "@/types";

/**
 * Fetch high-level platform metrics for the Admin Overview dashboard.
 * Enforces requireAdmin() server-side.
 */
export async function getAdminOverviewMetrics(): Promise<AdminOverviewMetrics> {
  await requireAdmin();
  const supabase = createAdminClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  const [
    usersTotalRes,
    recentUsersRes,
    projectsTotalRes,
    publicProjectsRes,
    recruitingProjectsRes,
    hackathonProjectsRes,
    completedProjectsRes,
    applicationsTotalRes,
    pendingAppsRes,
    acceptedAppsRes,
    rejectedAppsRes,
    withdrawnAppsRes,
    categoriesRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgoIso),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("visibility", "public"),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "recruiting"),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("is_hackathon", true),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase.from("applications").select("id", { count: "exact", head: true }),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted"),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "rejected"),
    supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "withdrawn"),
    supabase.from("projects").select("category"),
  ]);

  // Aggregate category counts
  const categoryMap = new Map<string, number>();
  if (categoriesRes.data) {
    for (const p of categoriesRes.data) {
      if (p.category) {
        categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1);
      }
    }
  }

  const projectsByCategory = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalUsers: usersTotalRes.count || 0,
    recentUsers: recentUsersRes.count || 0,
    totalProjects: projectsTotalRes.count || 0,
    publicProjects: publicProjectsRes.count || 0,
    recruitingProjects: recruitingProjectsRes.count || 0,
    hackathonProjects: hackathonProjectsRes.count || 0,
    completedProjects: completedProjectsRes.count || 0,
    totalApplications: applicationsTotalRes.count || 0,
    pendingApplications: pendingAppsRes.count || 0,
    acceptedApplications: acceptedAppsRes.count || 0,
    rejectedApplications: rejectedAppsRes.count || 0,
    withdrawnApplications: withdrawnAppsRes.count || 0,
    projectsByCategory,
  };
}

/**
 * Fetch a paginated, searchable list of student users with aggregate stats.
 */
export async function getAdminUsersList({
  page = 1,
  pageSize = 15,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedResult<AdminUserItem>> {
  await requireAdmin();
  const supabase = createAdminClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("profiles").select("*", { count: "exact" });

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    query = query.or(
      `full_name.ilike.%${trimmedSearch}%,username.ilike.%${trimmedSearch}%,college.ilike.%${trimmedSearch}%,course.ilike.%${trimmedSearch}%`
    );
  }

  const { data: profiles, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !profiles) {
    console.error("[Admin Users Query Error]", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const userIds = profiles.map((p) => p.id);

  // Fetch relational aggregates for this page of users
  const [skillsRes, projectsRes, appsRes, adminsRes, bansRes, authUsersRes, cooldownsRes] = await Promise.all([
    supabase
      .from("user_skills")
      .select("user_id")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("projects")
      .select("owner_id")
      .in("owner_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("applications")
      .select("applicant_id")
      .in("applicant_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("admin_users")
      .select("user_id, role, is_active")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("user_bans")
      .select("user_id, banned, ban_reason, banned_at")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("banned", true),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase
      .from("withdrawal_cooldowns")
      .select("id, user_id, cooldown_until, project_id, created_at")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"])
      .is("revoked_at", null)
      .gt("cooldown_until", new Date().toISOString())
      .order("cooldown_until", { ascending: false }),
  ]);

  const skillCounts = new Map<string, number>();
  skillsRes.data?.forEach((s) => {
    skillCounts.set(s.user_id, (skillCounts.get(s.user_id) || 0) + 1);
  });

  const projectCounts = new Map<string, number>();
  projectsRes.data?.forEach((p) => {
    projectCounts.set(p.owner_id, (projectCounts.get(p.owner_id) || 0) + 1);
  });

  const appCounts = new Map<string, number>();
  appsRes.data?.forEach((a) => {
    appCounts.set(a.applicant_id, (appCounts.get(a.applicant_id) || 0) + 1);
  });

  const adminMap = new Map<string, { role: AdminRole; is_active: boolean }>();
  adminsRes.data?.forEach((a) => {
    adminMap.set(a.user_id, {
      role: (a.role as AdminRole) || "admin",
      is_active: a.is_active,
    });
  });

  const banMap = new Map<string, { ban_reason: string; banned_at: string }>();
  bansRes.data?.forEach((b) => {
    banMap.set(b.user_id, {
      ban_reason: b.ban_reason,
      banned_at: b.banned_at,
    });
  });

  const emailMap = new Map<string, string>();
  authUsersRes.data?.users?.forEach((u) => {
    if (u.email) emailMap.set(u.id, u.email);
  });

  const cooldownMap = new Map<
    string,
    { id: string; cooldownUntil: string; projectId: string | null; createdAt: string }
  >();
  cooldownsRes.data?.forEach((c) => {
    if (!cooldownMap.has(c.user_id)) {
      cooldownMap.set(c.user_id, {
        id: c.id,
        cooldownUntil: c.cooldown_until,
        projectId: c.project_id,
        createdAt: c.created_at,
      });
    }
  });

  const data: AdminUserItem[] = profiles.map((p) => {
    const adminInfo = adminMap.get(p.id);
    const banInfo = banMap.get(p.id);
    const cooldownInfo = cooldownMap.get(p.id) || null;

    return {
      id: p.id,
      username: p.username,
      full_name: p.full_name,
      email: emailMap.get(p.id) || null,
      avatar_url: p.avatar_url,
      college: p.college,
      course: p.course,
      graduation_year: p.graduation_year,
      created_at: p.created_at,
      skillCount: skillCounts.get(p.id) || 0,
      projectCount: projectCounts.get(p.id) || 0,
      applicationCount: appCounts.get(p.id) || 0,
      isAdmin: !!adminInfo?.is_active,
      adminRole: adminInfo ? adminInfo.role : null,
      isBanned: !!banInfo,
      banReason: banInfo ? banInfo.ban_reason : null,
      bannedAt: banInfo ? banInfo.banned_at : null,
      activeCooldown: cooldownInfo,
    };
  });

  const total = count || 0;
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Fetch all registered administrators.
 * Used for /admin/admins directory view.
 */
export async function getAdminsList(): Promise<AdminListItem[]> {
  await requireAdmin();
  const supabase = createAdminClient();

  const [adminUsersRes, authUsersRes] = await Promise.all([
    supabase
      .from("admin_users")
      .select("user_id, role, is_active, created_at")
      .order("created_at", { ascending: true }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  if (adminUsersRes.error || !adminUsersRes.data) {
    return [];
  }

  const userIds = adminUsersRes.data.map((a) => a.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map<string, { full_name: string; username: string; avatar_url: string | null }>();
  profiles?.forEach((p) => {
    profileMap.set(p.id, {
      full_name: p.full_name,
      username: p.username,
      avatar_url: p.avatar_url,
    });
  });

  const emailMap = new Map<string, string>();
  authUsersRes.data?.users?.forEach((u) => {
    if (u.email) emailMap.set(u.id, u.email);
  });

  return adminUsersRes.data.map((a) => {
    const prof = profileMap.get(a.user_id);
    const isCanonical = a.user_id === CANONICAL_SUPER_ADMIN_UUID;

    return {
      userId: a.user_id,
      email: emailMap.get(a.user_id) || (isCanonical ? CANONICAL_SUPER_ADMIN_EMAIL : null),
      full_name: prof?.full_name || (isCanonical ? "hk9981" : "Admin User"),
      username: prof?.username || (isCanonical ? "hk9981" : "admin"),
      avatar_url: prof?.avatar_url || null,
      role: (a.role as AdminRole) || "admin",
      is_active: a.is_active,
      created_at: a.created_at,
      isCanonical,
    };
  });
}

/**
 * Fetch a paginated, filterable list of all projects across the platform.
 */
export async function getAdminProjectsList({
  page = 1,
  pageSize = 15,
  search = "",
  status,
  hackathon,
  visibility,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  hackathon?: string;
  visibility?: string;
}): Promise<PaginatedResult<AdminProjectItem>> {
  await requireAdmin();
  const supabase = createAdminClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("projects")
    .select(
      `
      id,
      title,
      tagline,
      category,
      status,
      visibility,
      is_hackathon,
      created_at,
      owner:profiles!projects_owner_id_fkey(id, full_name, username, avatar_url),
      roles:project_roles(id, slots)
    `,
      { count: "exact" }
    );

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    query = query.or(`title.ilike.%${trimmedSearch}%,category.ilike.%${trimmedSearch}%`);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (hackathon && hackathon !== "all") {
    query = query.eq("is_hackathon", hackathon === "true");
  }

  if (visibility && visibility !== "all") {
    query = query.eq("visibility", visibility);
  }

  const { data: projects, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !projects) {
    console.error("[Admin Projects Query Error]", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  interface RawProjectQueryResult {
    id: string;
    title: string;
    tagline: string | null;
    category: string;
    status: string;
    visibility: string;
    is_hackathon: boolean;
    created_at: string;
    owner: { id: string; full_name: string; username: string; avatar_url: string | null } | { id: string; full_name: string; username: string; avatar_url: string | null }[] | null;
    roles: { id: string; slots: number }[] | null;
  }

  const rawList = (projects as unknown as RawProjectQueryResult[]) || [];

  const data: AdminProjectItem[] = rawList.map((p) => {
    const rawOwner = Array.isArray(p.owner) ? p.owner[0] : p.owner;
    const roles = p.roles || [];
    const roleCount = roles.length;
    const slotsTotal = roles.reduce((sum, r) => sum + (r.slots || 1), 0);

    return {
      id: p.id,
      title: p.title,
      tagline: p.tagline,
      category: p.category,
      status: p.status,
      visibility: p.visibility,
      is_hackathon: p.is_hackathon,
      created_at: p.created_at,
      roleCount,
      slotsTotal,
      owner: rawOwner || {
        id: "",
        full_name: "Unknown",
        username: "unknown",
        avatar_url: null,
      },
    };
  });

  const total = count || 0;
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Fetch platform-wide application activity.
 */
export async function getAdminApplicationsList({
  page = 1,
  pageSize = 15,
  search = "",
  status,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResult<AdminApplicationItem>> {
  await requireAdmin();
  const supabase = createAdminClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("applications")
    .select(
      `
      id,
      status,
      created_at,
      updated_at,
      message,
      applicant:profiles!applications_applicant_id_fkey(id, full_name, username, avatar_url, college),
      project:projects!applications_project_id_fkey(
        id,
        title,
        owner_id,
        owner:profiles!projects_owner_id_fkey(id, full_name, username)
      ),
      role:project_roles!applications_role_id_fkey(id, title)
    `,
      { count: "exact" }
    );

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    // PostgREST filtering on joined or parent fields
    query = query.or(`message.ilike.%${trimmedSearch}%`);
  }

  const { data: applications, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !applications) {
    console.error("[Admin Applications Query Error]", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  interface RawAppQuery {
    id: string;
    status: string;
    created_at: string;
    updated_at: string;
    message: string;
    applicant: { id: string; full_name: string; username: string; avatar_url: string | null; college: string | null } | { id: string; full_name: string; username: string; avatar_url: string | null; college: string | null }[] | null;
    project: {
      id: string;
      title: string;
      owner_id: string;
      owner: { id: string; full_name: string; username: string } | { id: string; full_name: string; username: string }[] | null;
    } | {
      id: string;
      title: string;
      owner_id: string;
      owner: { id: string; full_name: string; username: string } | { id: string; full_name: string; username: string }[] | null;
    }[] | null;
    role: { id: string; title: string } | { id: string; title: string }[] | null;
  }

  const rawList = (applications as unknown as RawAppQuery[]) || [];

  const data: AdminApplicationItem[] = rawList.map((a) => {
    const rawApplicant = Array.isArray(a.applicant) ? a.applicant[0] : a.applicant;
    const rawProj = Array.isArray(a.project) ? a.project[0] : a.project;
    const rawOwner = rawProj ? (Array.isArray(rawProj.owner) ? rawProj.owner[0] : rawProj.owner) : null;
    const rawRole = Array.isArray(a.role) ? a.role[0] : a.role;

    return {
      id: a.id,
      status: a.status,
      created_at: a.created_at,
      updated_at: a.updated_at,
      message: a.message,
      applicant: rawApplicant || {
        id: "",
        full_name: "Unknown",
        username: "unknown",
        avatar_url: null,
        college: null,
      },
      project: {
        id: rawProj?.id || "",
        title: rawProj?.title || "Untitled Project",
        owner_id: rawProj?.owner_id || "",
      },
      projectOwner: rawOwner || {
        id: "",
        full_name: "Unknown",
        username: "unknown",
      },
      role: rawRole || null,
    };
  });

  const total = count || 0;
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Fetch a paginated, filterable list of internal audit logs.
 * Enforces requireAdmin() server-side.
 */
export async function getAdminAuditLogs({
  page = 1,
  pageSize = 20,
  eventType,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  eventType?: AuditEventType | "all";
  search?: string;
}): Promise<PaginatedResult<AdminAuditLogItem>> {
  await requireAdmin();
  const supabase = createAdminClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("audit_logs").select("*", { count: "exact" });

  if (eventType && eventType !== "all") {
    query = query.eq("event_type", eventType);
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    query = query.ilike("description", `%${trimmedSearch}%`);
  }

  const { data: logs, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !logs) {
    console.error("[Admin Audit Logs Query Error]", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  // Collect actor, target, and project IDs
  const userIds = Array.from(
    new Set(
      logs
        .flatMap((l) => [l.actor_user_id, l.target_user_id])
        .filter((id): id is string => Boolean(id))
    )
  );

  const projectIds = Array.from(
    new Set(logs.map((l) => l.project_id).filter((id): id is string => Boolean(id)))
  );

  const [profilesRes, projectsRes] = await Promise.all([
    userIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .in("id", userIds)
      : Promise.resolve({ data: [] }),
    projectIds.length > 0
      ? supabase.from("projects").select("id, title").in("id", projectIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map<
    string,
    { id: string; full_name: string; username: string; avatar_url: string | null }
  >();
  profilesRes.data?.forEach((p) => profileMap.set(p.id, p));

  const projectMap = new Map<string, { id: string; title: string }>();
  projectsRes.data?.forEach((p) => projectMap.set(p.id, p));

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  const data: AdminAuditLogItem[] = logs.map((log) => ({
    id: log.id,
    eventType: log.event_type as AuditEventType,
    actorUserId: log.actor_user_id,
    targetUserId: log.target_user_id,
    projectId: log.project_id,
    applicationId: log.application_id,
    roleId: log.role_id,
    description: log.description,
    metadata: (log.metadata as Record<string, unknown>) || null,
    createdAt: log.created_at,
    actor: log.actor_user_id ? profileMap.get(log.actor_user_id) || null : null,
    target: log.target_user_id ? profileMap.get(log.target_user_id) || null : null,
    project: log.project_id ? projectMap.get(log.project_id) || null : null,
  }));

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Get count of pending restriction revocation requests (for badge display).
 */
export async function getPendingRevocationCount(): Promise<number> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("restriction_revoke_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    console.error("[getPendingRevocationCount Error]", error);
    return 0;
  }
  return count || 0;
}

/**
 * Fetch summary statistics for the Revocation Requests queue.
 */
export async function getRevocationRequestStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  bans: number;
  cooldowns: number;
}> {
  await requireAdmin();
  const supabase = createAdminClient();

  const [totalRes, pendingRes, approvedRes, rejectedRes, bansRes, cooldownsRes] =
    await Promise.all([
      supabase.from("restriction_revoke_requests").select("id", { count: "exact", head: true }),
      supabase.from("restriction_revoke_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("restriction_revoke_requests").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("restriction_revoke_requests").select("id", { count: "exact", head: true }).eq("status", "rejected"),
      supabase.from("restriction_revoke_requests").select("id", { count: "exact", head: true }).eq("restriction_type", "ban"),
      supabase.from("restriction_revoke_requests").select("id", { count: "exact", head: true }).eq("restriction_type", "cooldown"),
    ]);

  return {
    total: totalRes.count || 0,
    pending: pendingRes.count || 0,
    approved: approvedRes.count || 0,
    rejected: rejectedRes.count || 0,
    bans: bansRes.count || 0,
    cooldowns: cooldownsRes.count || 0,
  };
}

/**
 * Fetch paginated list of revocation requests with student and reviewer info.
 */
export async function getRevocationRequests({
  status,
  restrictionType,
  search = "",
  page = 1,
  pageSize = 20,
}: {
  status?: string;
  restrictionType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<PaginatedResult<AdminRevocationRequestItem>> {
  await requireAdmin();
  const supabase = createAdminClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("restriction_revoke_requests")
    .select("*", { count: "exact" });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (restrictionType && restrictionType !== "all") {
    query = query.eq("restriction_type", restrictionType);
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    query = query.ilike("reason", `%${trimmedSearch}%`);
  }

  const { data: requests, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !requests) {
    console.error("[Admin Revocation Requests Query Error]", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const userIds = Array.from(
    new Set(
      requests
        .flatMap((r) => [r.user_id, r.reviewed_by])
        .filter((id): id is string => Boolean(id))
    )
  );

  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .in("id", userIds)
      : { data: [] };

  const profileMap = new Map<
    string,
    { id: string; full_name: string; username: string; avatar_url: string | null }
  >();
  profiles?.forEach((p) => profileMap.set(p.id, p));

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  const data: AdminRevocationRequestItem[] = requests.map((req) => {
    const userProf = profileMap.get(req.user_id);
    const reviewerProf = req.reviewed_by ? profileMap.get(req.reviewed_by) : null;

    return {
      id: req.id,
      userId: req.user_id,
      restrictionType: req.restriction_type as "ban" | "cooldown",
      status: req.status as "pending" | "approved" | "rejected",
      reason: req.reason,
      reviewedBy: req.reviewed_by,
      reviewedAt: req.reviewed_at,
      reviewReason: req.review_reason,
      createdAt: req.created_at,
      updatedAt: req.updated_at,
      user: {
        id: req.user_id,
        full_name: userProf?.full_name || "Unknown Student",
        username: userProf?.username || "unknown",
        email: null,
        avatar_url: userProf?.avatar_url || null,
      },
      reviewer: reviewerProf
        ? {
            id: reviewerProf.id,
            full_name: reviewerProf.full_name,
            username: reviewerProf.username,
          }
        : null,
    };
  });

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  };
}

