/**
 * Domain entity types for DevPair
 */

export type UserRole = "student" | "mentor" | "organizer" | "admin";

export type SkillCategory =
  | "frontend"
  | "backend"
  | "fullstack"
  | "mobile"
  | "ai_ml"
  | "devops_cloud"
  | "data_science"
  | "ui_ux_design"
  | "product_management"
  | "blockchain"
  | "cybersecurity"
  | "other";

export type ProficiencyLevel = "beginner" | "intermediate" | "advanced";

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
}

export interface UserSkill {
  skillId: string;
  name: string;
  category: SkillCategory;
  proficiency: ProficiencyLevel;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  college?: string;
  major?: string;
  graduationYear?: number;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  availabilityHoursPerWeek?: number;
  skills: UserSkill[];
  interests: string[];
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = "draft" | "recruiting" | "in_progress" | "completed" | "archived";

export interface ProjectRoleNeeded {
  id: string;
  roleTitle: string;
  skillsRequired: string[];
  spotsAvailable: number;
  spotsFilled: number;
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  tagline: string;
  description: string;
  status: ProjectStatus;
  isHackathonProject: boolean;
  hackathonName?: string;
  hackathonDeadline?: string;
  teamSizeLimit: number;
  currentTeamSize: number;
  rolesNeeded: ProjectRoleNeeded[];
  tags: string[];
  repoUrl?: string;
  demoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "removed";

export interface ProjectApplication {
  id: string;
  projectId: string;
  applicantId: string;
  roleApplied: string;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export type AuditEventType =
  | "application_withdrawn"
  | "withdrawal_cooldown_created"
  | "team_member_removed"
  | "withdrawal_cooldown_revoked";

export interface AuditLog {
  id: string;
  eventType: AuditEventType;
  actorUserId: string;
  targetUserId?: string | null;
  projectId?: string | null;
  applicationId?: string | null;
  roleId?: string | null;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface WithdrawalCooldown {
  id: string;
  userId: string;
  projectId?: string | null;
  applicationId?: string | null;
  cooldownUntil: string;
  reason?: string | null;
  revokedAt?: string | null;
  revokedBy?: string | null;
  revocationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MatchScore {
  userId: string;
  projectId: string;
  overallScore: number;
  skillOverlapScore: number;
  interestOverlapScore: number;
  availabilityScore: number;
  matchingSkills: string[];
  missingSkills: string[];
}

export type NotificationType =
  | "application_received"
  | "application_status_updated"
  | "team_invitation"
  | "project_update"
  | "match_recommendation";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  itemType: "project" | "profile";
  itemId: string;
  createdAt: string;
}
