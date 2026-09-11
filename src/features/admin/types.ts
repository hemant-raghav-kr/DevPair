import type { AdminRole } from "@/lib/auth/admin";
import type { AuditEventType } from "@/types";

export interface AdminOverviewMetrics {
  totalUsers: number;
  recentUsers: number;
  totalProjects: number;
  publicProjects: number;
  recruitingProjects: number;
  hackathonProjects: number;
  completedProjects: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  withdrawnApplications: number;
  projectsByCategory: { category: string; count: number }[];
}

export interface AdminUserItem {
  id: string;
  username: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  college: string | null;
  course: string | null;
  graduation_year: number | null;
  created_at: string;
  skillCount: number;
  projectCount: number;
  applicationCount: number;
  isAdmin: boolean;
  adminRole: AdminRole | null;
  isBanned: boolean;
  banReason: string | null;
  bannedAt: string | null;
  activeCooldown?: {
    id: string;
    cooldownUntil: string;
    projectId: string | null;
    createdAt: string;
  } | null;
}

export interface AdminListItem {
  userId: string;
  email: string | null;
  full_name: string;
  username: string;
  avatar_url: string | null;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  isCanonical: boolean;
}

export interface AdminProjectItem {
  id: string;
  title: string;
  tagline: string | null;
  category: string;
  status: string;
  visibility: string;
  is_hackathon: boolean;
  created_at: string;
  roleCount: number;
  slotsTotal: number;
  owner: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface AdminApplicationItem {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  message: string;
  applicant: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    college: string | null;
  };
  project: {
    id: string;
    title: string;
    owner_id: string;
  };
  projectOwner: {
    id: string;
    full_name: string;
    username: string;
  };
  role: {
    id: string;
    title: string;
  } | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminAuditLogItem {
  id: string;
  eventType: AuditEventType;
  actorUserId: string | null;
  targetUserId: string | null;
  projectId: string | null;
  applicationId: string | null;
  roleId: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
  target?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
  project?: {
    id: string;
    title: string;
  } | null;
}
