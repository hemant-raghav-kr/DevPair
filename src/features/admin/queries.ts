import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";
import type {
  AdminOverviewMetrics,
  AdminUserItem,
  AdminProjectItem,
  AdminApplicationItem,
  PaginatedResult,
} from "./types";

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
  const [skillsRes, projectsRes, appsRes, adminsRes] = await Promise.all([
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
      .select("user_id")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("is_active", true),
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

  const adminSet = new Set(adminsRes.data?.map((a) => a.user_id) || []);

  const data: AdminUserItem[] = profiles.map((p) => ({
    id: p.id,
    username: p.username,
    full_name: p.full_name,
    avatar_url: p.avatar_url,
    college: p.college,
    course: p.course,
    graduation_year: p.graduation_year,
    created_at: p.created_at,
    skillCount: skillCounts.get(p.id) || 0,
    projectCount: projectCounts.get(p.id) || 0,
    applicationCount: appCounts.get(p.id) || 0,
    isAdmin: adminSet.has(p.id),
  }));

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
