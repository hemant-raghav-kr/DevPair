import { createClient } from "@/lib/supabase/server";
import { calculateMatch } from "./scoring";
import type {
  CandidateProfile,
  CandidateSkill,
  TargetProject,
  TargetRole,
  ProjectRecommendation,
  RoleMatch,
  MatchResult,
} from "./types";
import type { ProficiencyLevel } from "@/features/skills/types";

interface RawUserSkillQuery {
  user_id: string;
  skill_id: string;
  proficiency: string;
  skill: {
    id: string;
    name: string;
    category: string;
  } | {
    id: string;
    name: string;
    category: string;
  }[] | null;
}

interface RawRoleQuery {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  required_skill_id: string | null;
  slots: number;
  skill: {
    id: string;
    name: string;
    category: string;
  } | {
    id: string;
    name: string;
    category: string;
  }[] | null;
}

interface RawProjectQuery {
  id: string;
  owner_id: string;
  title: string;
  tagline: string | null;
  category: string;
  status: string;
  visibility: string;
  is_hackathon: boolean;
  hackathon_name: string | null;
  hackathon_deadline: string | null;
  owner: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  }[] | null;
  roles: RawRoleQuery[];
}

/**
 * Recommends top matching projects for a student based on ML compatibility scores
 */
export async function getRecommendedProjectsForUser(
  studentId: string,
  limit: number = 6
): Promise<ProjectRecommendation[]> {
  const supabase = await createClient();

  // 1. Fetch student profile under RLS
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, college, availability_hours_per_week")
    .eq("id", studentId)
    .single();

  if (!profile) {
    return [];
  }

  // 2. Fetch student skills joined with skills taxonomy
  const { data: userSkillsData } = await supabase
    .from("user_skills")
    .select("user_id, skill_id, proficiency, skill:skills(id, name, category)")
    .eq("user_id", studentId);

  const formattedSkills: CandidateSkill[] = (
    (userSkillsData as unknown as RawUserSkillQuery[]) || []
  )
    .filter((s) => s.skill !== null)
    .map((s) => {
      const rawSkill = Array.isArray(s.skill) ? s.skill[0] : s.skill;
      return {
        skill_id: s.skill_id,
        name: rawSkill?.name || "Skill",
        category: rawSkill?.category || "other",
        proficiency: s.proficiency as ProficiencyLevel,
      };
    });

  const candidate: CandidateProfile = {
    id: profile.id,
    username: profile.username,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    college: profile.college,
    availability_hours_per_week: profile.availability_hours_per_week ?? 10,
    skills: formattedSkills,
  };

  // 3. Fetch recruiting public projects (excluding projects owned by student)
  const { data: projectsData, error: projErr } = await supabase
    .from("projects")
    .select(`
      id, owner_id, title, tagline, category, status, visibility,
      is_hackathon, hackathon_name, hackathon_deadline,
      owner:profiles!projects_owner_id_fkey(id, username, full_name, avatar_url),
      roles:project_roles(
        id, project_id, title, description, required_skill_id, slots,
        skill:skills(id, name, category)
      )
    `)
    .eq("visibility", "public")
    .eq("status", "recruiting")
    .neq("owner_id", studentId);

  if (projErr || !projectsData || projectsData.length === 0) {
    return [];
  }

  // 4. Fetch accepted applications for all roles across these projects to determine filled slots
  const allRoleIds: string[] = [];
  const rawProjects = projectsData as unknown as RawProjectQuery[];
  for (const p of rawProjects) {
    for (const r of p.roles || []) {
      if (r.id) allRoleIds.push(r.id);
    }
  }

  const roleAcceptedCounts: Record<string, number> = {};
  if (allRoleIds.length > 0) {
    const { data: acceptedApps } = await supabase
      .from("applications")
      .select("role_id")
      .in("role_id", allRoleIds)
      .eq("status", "accepted");

    (acceptedApps || []).forEach((app) => {
      if (app.role_id) {
        roleAcceptedCounts[app.role_id] =
          (roleAcceptedCounts[app.role_id] || 0) + 1;
      }
    });
  }

  // 5. Evaluate ML compatibility for each project
  const recommendations: ProjectRecommendation[] = [];

  for (const rawProj of rawProjects) {
    const targetProject: TargetProject = {
      id: rawProj.id,
      owner_id: rawProj.owner_id,
      title: rawProj.title,
      tagline: rawProj.tagline,
      category: rawProj.category,
      status: rawProj.status,
      visibility: rawProj.visibility,
      is_hackathon: rawProj.is_hackathon,
      hackathon_name: rawProj.hackathon_name,
      hackathon_deadline: rawProj.hackathon_deadline,
    };

    const rawOwner = Array.isArray(rawProj.owner)
      ? rawProj.owner[0]
      : rawProj.owner;

    let projectOpenSlots = 0;
    const roleMatches: RoleMatch[] = [];

    for (const rawRole of rawProj.roles || []) {
      const acceptedCount = roleAcceptedCounts[rawRole.id] || 0;
      const roleSlots = Number(rawRole.slots);
      const openSlots = Math.max(0, roleSlots - acceptedCount);

      projectOpenSlots += openSlots;

      // Only compute match if role is not completely filled
      if (openSlots > 0) {
        const rawRoleSkill = Array.isArray(rawRole.skill)
          ? rawRole.skill[0]
          : rawRole.skill;

        const targetRole: TargetRole = {
          id: rawRole.id,
          project_id: rawRole.project_id,
          title: rawRole.title,
          description: rawRole.description,
          required_skill_id: rawRole.required_skill_id,
          slots: roleSlots,
          skill: rawRoleSkill
            ? {
                id: rawRoleSkill.id,
                name: rawRoleSkill.name,
                category: rawRoleSkill.category,
              }
            : null,
        };

        const matchResult = calculateMatch(candidate, targetRole, targetProject);
        roleMatches.push({
          role: targetRole,
          match: matchResult,
        });
      }
    }

    if (roleMatches.length > 0) {
      // Best-fit role aggregation: highest compatibility score
      roleMatches.sort((a, b) => b.match.score - a.match.score);
      const best = roleMatches[0];

      recommendations.push({
        project: targetProject,
        bestRole: best.role,
        bestMatch: best.match,
        allRoleMatches: roleMatches,
        openSlots: projectOpenSlots,
        owner: rawOwner
          ? {
              id: rawOwner.id,
              username: rawOwner.username,
              full_name: rawOwner.full_name,
              avatar_url: rawOwner.avatar_url,
            }
          : null,
      });
    }
  }

  // Rank projects descending by best-fit compatibility score
  recommendations.sort((a, b) => b.bestMatch.score - a.bestMatch.score);

  return recommendations.slice(0, limit);
}

export interface TeammateRecommendation {
  candidate: CandidateProfile;
  match: MatchResult;
}

/**
 * Recommends top matching candidate students for a specific project role
 */
export async function getRecommendedTeammatesForRole(
  roleId: string,
  limit: number = 8
): Promise<TeammateRecommendation[]> {
  const supabase = await createClient();

  // 1. Fetch role and parent project
  const { data: roleData, error: roleErr } = await supabase
    .from("project_roles")
    .select(`
      id, project_id, title, description, required_skill_id, slots,
      skill:skills(id, name, category),
      project:projects(id, owner_id, title, category, status, visibility, is_hackathon)
    `)
    .eq("id", roleId)
    .single();

  if (roleErr || !roleData) {
    return [];
  }

  interface RawProjectRef {
    id: string;
    owner_id: string;
    title: string;
    category: string;
    status: string;
    visibility: string;
    is_hackathon: boolean;
  }

  const rawProj = (
    Array.isArray(roleData.project) ? roleData.project[0] : roleData.project
  ) as RawProjectRef;

  const rawSkill = Array.isArray(roleData.skill)
    ? roleData.skill[0]
    : roleData.skill;

  const targetRole: TargetRole = {
    id: roleData.id,
    project_id: roleData.project_id,
    title: roleData.title,
    description: roleData.description,
    required_skill_id: roleData.required_skill_id,
    slots: roleData.slots,
    skill: rawSkill,
  };

  const targetProject: TargetProject = {
    id: rawProj.id,
    owner_id: rawProj.owner_id,
    title: rawProj.title,
    category: rawProj.category,
    status: rawProj.status,
    visibility: rawProj.visibility,
    is_hackathon: rawProj.is_hackathon,
  };

  // 2. Fetch active candidate student profiles (excluding project owner)
  const { data: candidatesData } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, college, availability_hours_per_week")
    .neq("id", rawProj.owner_id)
    .limit(50);

  if (!candidatesData || candidatesData.length === 0) {
    return [];
  }

  const candidateIds = candidatesData.map((c) => c.id);

  // 3. Fetch skills for these candidates
  const { data: skillsData } = await supabase
    .from("user_skills")
    .select("user_id, skill_id, proficiency, skill:skills(id, name, category)")
    .in("user_id", candidateIds);

  const candidateSkillsMap: Record<string, CandidateSkill[]> = {};
  ((skillsData as unknown as RawUserSkillQuery[]) || []).forEach((s) => {
    if (!candidateSkillsMap[s.user_id]) {
      candidateSkillsMap[s.user_id] = [];
    }
    const skillItem = Array.isArray(s.skill) ? s.skill[0] : s.skill;
    if (skillItem) {
      candidateSkillsMap[s.user_id].push({
        skill_id: s.skill_id,
        name: skillItem.name,
        category: skillItem.category,
        proficiency: s.proficiency as ProficiencyLevel,
      });
    }
  });

  // 4. Calculate match for each candidate
  const teammateRecs: TeammateRecommendation[] = [];

  for (const c of candidatesData) {
    const candidateProfile: CandidateProfile = {
      id: c.id,
      username: c.username,
      full_name: c.full_name,
      avatar_url: c.avatar_url,
      college: c.college,
      availability_hours_per_week: c.availability_hours_per_week ?? 10,
      skills: candidateSkillsMap[c.id] || [],
    };

    const match = calculateMatch(candidateProfile, targetRole, targetProject);
    teammateRecs.push({
      candidate: candidateProfile,
      match,
    });
  }

  // Rank descending by compatibility score
  teammateRecs.sort((a, b) => b.match.score - a.match.score);

  return teammateRecs.slice(0, limit);
}
