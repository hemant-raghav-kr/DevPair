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
  avatar_url: string | null;
  college: string | null;
  course: string | null;
  graduation_year: number | null;
  created_at: string;
  skillCount: number;
  projectCount: number;
  applicationCount: number;
  isAdmin: boolean;
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
