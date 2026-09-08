import { createClient } from "@/lib/supabase/server";
import { calculateMatch } from "@/features/matching";
import type {
  CandidateProfile,
  CandidateSkill,
  TargetProject,
  TargetRole,
} from "@/features/matching/types";
import type { ProficiencyLevel, Skill } from "@/features/skills/types";
import type { ApplicationStatus } from "@/features/applications/types";
import type {
  DiscoveryFilters,
  DiscoveryProject,
  DiscoveryResult,
  DiscoveryRole,
} from "../types";

interface RawRoleItem {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  required_skill_id: string | null;
  slots: number;
  skill: Skill | Skill[] | null;
}

interface RawOwnerItem {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface RawProjectQuery {
  id: string;
  owner_id: string;
  title: string;
  tagline: string | null;
  description: string;
  category: string;
  status: string;
  visibility: string;
  is_hackathon: boolean;
  hackathon_name: string | null;
  hackathon_deadline: string | null;
  max_team_size: number | null;
  repo_url: string | null;
  demo_url: string | null;
  created_at: string;
  updated_at: string;
  owner: RawOwnerItem | RawOwnerItem[] | null;
  roles: RawRoleItem[];
}

export async function getDiscoverProjects(
  filters: DiscoveryFilters = {}
): Promise<DiscoveryResult> {
  const supabase = await createClient();

  // 1. Get current authenticated user session if available
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // 2. Multi-field search handling
  let matchingProjectIdsFromSearch: string[] | null = null;
  const searchQuery = filters.q?.trim();

  if (searchQuery) {
    // a. Search role titles
    const { data: matchedRoles } = await supabase
      .from("project_roles")
      .select("project_id")
      .ilike("title", `%${searchQuery}%`);

    // b. Search required skills by name
    const { data: matchedSkills } = await supabase
      .from("skills")
      .select("id")
      .ilike("name", `%${searchQuery}%`);

    let matchedRolesFromSkills: { project_id: string }[] = [];
    if (matchedSkills && matchedSkills.length > 0) {
      const skillIds = matchedSkills.map((s) => s.id);
      const { data: rolesWithSkill } = await supabase
        .from("project_roles")
        .select("project_id")
        .in("required_skill_id", skillIds);
      matchedRolesFromSkills = rolesWithSkill || [];
    }

    // c. Search projects directly
    const { data: matchedProjectsDirect } = await supabase
      .from("projects")
      .select("id")
      .eq("visibility", "public")
      .or(
        `title.ilike.%${searchQuery}%,tagline.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`
      );

    const idSet = new Set<string>();
    (matchedProjectsDirect || []).forEach((p) => idSet.add(p.id));
    (matchedRoles || []).forEach((r) => idSet.add(r.project_id));
    matchedRolesFromSkills.forEach((r) => idSet.add(r.project_id));

    matchingProjectIdsFromSearch = Array.from(idSet);

    if (matchingProjectIdsFromSearch.length === 0) {
      return {
        projects: [],
        totalCount: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };
    }
  }

  // 3. Required Skill Filter
  let matchingProjectIdsFromSkillFilter: string[] | null = null;
  if (filters.skill && filters.skill !== "all") {
    const { data: rolesWithFilterSkill } = await supabase
      .from("project_roles")
      .select("project_id")
      .eq("required_skill_id", filters.skill);

    matchingProjectIdsFromSkillFilter = (rolesWithFilterSkill || []).map(
      (r) => r.project_id
    );

    if (matchingProjectIdsFromSkillFilter.length === 0) {
      return {
        projects: [],
        totalCount: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };
    }
  }

  // 4. Build primary project query
  let query = supabase
    .from("projects")
    .select(`
      id, owner_id, title, tagline, description, category, status, visibility,
      is_hackathon, hackathon_name, hackathon_deadline, max_team_size, repo_url, demo_url,
      created_at, updated_at,
      owner:profiles!projects_owner_id_fkey(id, username, full_name, avatar_url),
      roles:project_roles(
        id, project_id, title, description, required_skill_id, slots,
        skill:skills(*)
      )
    `)
    .eq("visibility", "public");

  // Status filter (defaults to 'recruiting')
  const statusFilter = filters.status || "recruiting";
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  // Category filter
  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  // Hackathon filter
  if (filters.hackathon === "hackathon") {
    query = query.eq("is_hackathon", true);
  } else if (filters.hackathon === "non_hackathon") {
    query = query.eq("is_hackathon", false);
  }

  // Combine search and skill filter project IDs
  let intersectIds: string[] | null = null;
  if (matchingProjectIdsFromSearch !== null) {
    intersectIds = matchingProjectIdsFromSearch;
  }
  if (matchingProjectIdsFromSkillFilter !== null) {
    if (intersectIds === null) {
      intersectIds = matchingProjectIdsFromSkillFilter;
    } else {
      intersectIds = intersectIds.filter((id) =>
        matchingProjectIdsFromSkillFilter!.includes(id)
      );
    }
  }

  if (intersectIds !== null) {
    if (intersectIds.length === 0) {
      return {
        projects: [],
        totalCount: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };
    }
    query = query.in("id", intersectIds);
  }

  // Execute database query
  const { data: rawProjectsData, error: queryErr } = await query;
  if (queryErr || !rawProjectsData) {
    return {
      projects: [],
      totalCount: 0,
      page: 1,
      pageSize: 12,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    };
  }

  const rawProjects = rawProjectsData as unknown as RawProjectQuery[];

  // 5. Gather all role IDs to calculate real filled slots
  const allRoleIds: string[] = [];
  const allProjectIds = rawProjects.map((p) => p.id);
  for (const p of rawProjects) {
    for (const r of p.roles || []) {
      if (r.id) allRoleIds.push(r.id);
    }
  }

  const acceptedCountByRole: Record<string, number> = {};
  if (allRoleIds.length > 0) {
    const { data: acceptedApps } = await supabase
      .from("applications")
      .select("role_id")
      .in("role_id", allRoleIds)
      .eq("status", "accepted");

    (acceptedApps || []).forEach((app) => {
      if (app.role_id) {
        acceptedCountByRole[app.role_id] =
          (acceptedCountByRole[app.role_id] || 0) + 1;
      }
    });
  }

  // 6. If user is authenticated, query their applications for these projects
  const userApplicationsByRole: Record<string, ApplicationStatus> = {};
  let candidate: CandidateProfile | null = null;

  if (currentUser) {
    const { data: userApps } = await supabase
      .from("applications")
      .select("role_id, status")
      .eq("applicant_id", currentUser.id)
      .in("project_id", allProjectIds);

    (userApps || []).forEach((app) => {
      if (app.role_id) {
        userApplicationsByRole[app.role_id] = app.status as ApplicationStatus;
      }
    });

    // Fetch user profile and skills for ML compatibility calculation
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, college, availability_hours_per_week")
      .eq("id", currentUser.id)
      .single();

    if (profile) {
      const { data: userSkillsData } = await supabase
        .from("user_skills")
        .select("skill_id, proficiency, skill:skills(id, name, category)");

      interface RawUserSkillItem {
        skill_id: string;
        proficiency: string;
        skill: Skill | Skill[] | null;
      }

      const formattedSkills: CandidateSkill[] = (
        (userSkillsData as unknown as RawUserSkillItem[]) || []
      )
        .filter((s) => s.skill !== null)
        .map((s) => {
          const rawS = Array.isArray(s.skill) ? s.skill[0] : s.skill;
          return {
            skill_id: s.skill_id,
            name: rawS?.name || "Skill",
            category: rawS?.category || "other",
            proficiency: s.proficiency as ProficiencyLevel,
          };
        });

      candidate = {
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        college: profile.college,
        availability_hours_per_week: profile.availability_hours_per_week ?? 10,
        skills: formattedSkills,
      };
    }
  }

  // 7. Format Discovery Projects and compute ML scores
  const discoveryProjects: DiscoveryProject[] = [];

  for (const rawProj of rawProjects) {
    const rawOwner = Array.isArray(rawProj.owner)
      ? rawProj.owner[0]
      : rawProj.owner;
    const isOwner = currentUser?.id === rawProj.owner_id;

    let projectTotalOpenSlots = 0;
    const formattedRoles: DiscoveryRole[] = [];

    for (const rawRole of rawProj.roles || []) {
      const acceptedCount = acceptedCountByRole[rawRole.id] || 0;
      const roleSlots = Number(rawRole.slots);
      const openSlots = Math.max(0, roleSlots - acceptedCount);
      projectTotalOpenSlots += openSlots;

      const rawSkill = Array.isArray(rawRole.skill)
        ? rawRole.skill[0]
        : rawRole.skill;

      formattedRoles.push({
        id: rawRole.id,
        project_id: rawRole.project_id,
        title: rawRole.title,
        description: rawRole.description,
        slots: roleSlots,
        openSlots,
        required_skill_id: rawRole.required_skill_id,
        skill: (rawSkill as Skill | null) || null,
        userApplicationStatus: userApplicationsByRole[rawRole.id] || null,
      });
    }

    // Availability filter
    if (
      filters.availability === "open_roles" &&
      projectTotalOpenSlots === 0
    ) {
      continue;
    }

    // ML Compatibility
    let bestRole: DiscoveryRole | null = null;
    let bestMatch = null;

    if (candidate && !isOwner) {
      const targetProj: TargetProject = {
        id: rawProj.id,
        owner_id: rawProj.owner_id,
        title: rawProj.title,
        category: rawProj.category,
        status: rawProj.status,
        visibility: rawProj.visibility,
        is_hackathon: rawProj.is_hackathon,
      };

      for (const role of formattedRoles) {
        if (role.openSlots > 0) {
          const targetRole: TargetRole = {
            id: role.id,
            project_id: role.project_id,
            title: role.title,
            description: role.description,
            required_skill_id: role.required_skill_id,
            slots: role.slots,
            skill: role.skill,
          };

          const matchResult = calculateMatch(candidate, targetRole, targetProj);
          if (!bestMatch || matchResult.score > bestMatch.score) {
            bestMatch = matchResult;
            bestRole = role;
          }
        }
      }
    }

    discoveryProjects.push({
      id: rawProj.id,
      owner_id: rawProj.owner_id,
      title: rawProj.title,
      tagline: rawProj.tagline,
      description: rawProj.description,
      category: rawProj.category,
      status: rawProj.status,
      visibility: rawProj.visibility,
      is_hackathon: rawProj.is_hackathon,
      hackathon_name: rawProj.hackathon_name,
      hackathon_deadline: rawProj.hackathon_deadline,
      max_team_size: rawProj.max_team_size,
      repo_url: rawProj.repo_url,
      demo_url: rawProj.demo_url,
      created_at: rawProj.created_at,
      updated_at: rawProj.updated_at,
      owner: rawOwner || {
        id: rawProj.owner_id,
        username: "developer",
        full_name: "Project Owner",
        avatar_url: null,
      },
      roles: formattedRoles,
      openSlots: projectTotalOpenSlots,
      match: bestMatch,
      bestRole,
      isOwner,
    });
  }

  // 8. Sorting
  const sortOption =
    filters.sort || (currentUser ? "match" : "newest");

  if (sortOption === "match" && currentUser) {
    discoveryProjects.sort((a, b) => {
      const scoreA = a.match?.score ?? -1;
      const scoreB = b.match?.score ?? -1;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  } else if (sortOption === "roles") {
    discoveryProjects.sort((a, b) => {
      if (a.openSlots !== b.openSlots) return b.openSlots - a.openSlots;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  } else {
    // "newest"
    discoveryProjects.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  // 9. Pagination
  const pageSize = 12;
  const totalCount = discoveryProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(Math.max(1, Number(filters.page) || 1), totalPages);

  const startIndex = (page - 1) * pageSize;
  const paginatedProjects = discoveryProjects.slice(
    startIndex,
    startIndex + pageSize
  );

  return {
    projects: paginatedProjects,
    totalCount,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
