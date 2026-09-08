import type {
  CandidateProfile,
  TargetRole,
  TargetProject,
  FeatureVector,
  MatchFeatureName,
} from "./types";
import type { ProficiencyLevel } from "@/features/skills/types";

export const CATEGORY_ALIGNMENT_MAP: Record<string, string[]> = {
  web_development: ["frontend", "backend", "fullstack", "ui_ux_design", "devops_cloud"],
  mobile_app: ["mobile", "frontend", "backend", "ui_ux_design"],
  ai_machine_learning: ["ai_ml", "data_science", "backend", "devops_cloud"],
  open_source: ["backend", "frontend", "fullstack", "devops_cloud"],
  game_development: ["frontend", "ui_ux_design", "ai_ml"],
  hardware_iot: ["backend", "ai_ml", "devops_cloud"],
  blockchain: ["backend", "fullstack", "cybersecurity"],
  cybersecurity: ["backend", "devops_cloud", "cybersecurity"],
  other: ["frontend", "backend", "fullstack", "ui_ux_design"],
};

export const PROFICIENCY_NUMERIC_MAP: Record<ProficiencyLevel, number> = {
  beginner: 0.333,
  intermediate: 0.667,
  advanced: 1.0,
};

export function extractFeatureVector(
  candidate: CandidateProfile,
  role: TargetRole,
  project: TargetProject
): FeatureVector {
  const candidateSkills = candidate.skills || [];
  const totalSkillsCount = candidateSkills.length;

  // 1. Required Skill Match & Proficiency
  let requiredSkillMatch = 0.0;
  let requiredSkillProficiency = 0.0;

  if (!role.required_skill_id) {
    // If no specific skill is enforced, role is open to all backgrounds
    requiredSkillMatch = 1.0;
    requiredSkillProficiency = 0.667;
  } else {
    const matchingSkill = candidateSkills.find(
      (s) => s.skill_id === role.required_skill_id
    );

    if (matchingSkill) {
      requiredSkillMatch = 1.0;
      requiredSkillProficiency =
        PROFICIENCY_NUMERIC_MAP[matchingSkill.proficiency] ?? 0.333;
    }
  }

  // 2. Skill Category Overlap Ratio
  // If role has a required skill, target category is that skill's category;
  // otherwise fallback to role title inference or project aligned categories
  const targetRoleCategory = role.skill?.category;
  let skillCategoryOverlapRatio = 0.0;

  if (targetRoleCategory && totalSkillsCount > 0) {
    const matchingCategoryCount = candidateSkills.filter(
      (s) => s.category === targetRoleCategory
    ).length;
    skillCategoryOverlapRatio = matchingCategoryCount / totalSkillsCount;
  } else if (totalSkillsCount > 0) {
    // Default overlap to project category alignment if role category is unspecified
    const alignedCats = CATEGORY_ALIGNMENT_MAP[project.category] || [
      "frontend",
      "backend",
      "fullstack",
    ];
    const matchingCount = candidateSkills.filter((s) =>
      alignedCats.includes(s.category)
    ).length;
    skillCategoryOverlapRatio = matchingCount / totalSkillsCount;
  }

  // 3. Project Category Alignment
  const projectAlignedCategories =
    CATEGORY_ALIGNMENT_MAP[project.category] || [
      "frontend",
      "backend",
      "fullstack",
    ];

  let projectCategoryAlignment = 0.0;
  if (totalSkillsCount > 0) {
    const domainMatchingCount = candidateSkills.filter((s) =>
      projectAlignedCategories.includes(s.category)
    ).length;
    projectCategoryAlignment = domainMatchingCount / totalSkillsCount;
  }

  // 4. Availability Fit
  // Hackathons expect ~15h/wk, general projects expect ~10h/wk
  const expectedHours = project.is_hackathon ? 15.0 : 10.0;
  const candidateHours = candidate.availability_hours_per_week ?? 10.0;
  const availabilityFit = Math.min(1.0, Math.max(0.0, candidateHours / expectedHours));

  // 5. Total Skills Count (Normalized up to 10 skills)
  const totalSkillsCountNorm = Math.min(1.0, totalSkillsCount / 10.0);

  // 6. Average Skill Proficiency
  let avgSkillProficiency = 0.0;
  if (totalSkillsCount > 0) {
    const sumProf = candidateSkills.reduce((acc, s) => {
      return acc + (PROFICIENCY_NUMERIC_MAP[s.proficiency] ?? 0.333);
    }, 0);
    avgSkillProficiency = sumProf / totalSkillsCount;
  }

  // 7. Advanced Skills Ratio
  let advancedSkillsCountNorm = 0.0;
  if (totalSkillsCount > 0) {
    const advancedCount = candidateSkills.filter(
      (s) => s.proficiency === "advanced"
    ).length;
    advancedSkillsCountNorm = advancedCount / totalSkillsCount;
  }

  const featureMap: Record<MatchFeatureName, number> = {
    required_skill_match: Number(requiredSkillMatch.toFixed(4)),
    required_skill_proficiency: Number(requiredSkillProficiency.toFixed(4)),
    skill_category_overlap_ratio: Number(skillCategoryOverlapRatio.toFixed(4)),
    project_category_alignment: Number(projectCategoryAlignment.toFixed(4)),
    availability_fit: Number(availabilityFit.toFixed(4)),
    total_skills_count_norm: Number(totalSkillsCountNorm.toFixed(4)),
    avg_skill_proficiency: Number(avgSkillProficiency.toFixed(4)),
    advanced_skills_count_norm: Number(advancedSkillsCountNorm.toFixed(4)),
  };

  const values: number[] = [
    featureMap.required_skill_match,
    featureMap.required_skill_proficiency,
    featureMap.skill_category_overlap_ratio,
    featureMap.project_category_alignment,
    featureMap.availability_fit,
    featureMap.total_skills_count_norm,
    featureMap.avg_skill_proficiency,
    featureMap.advanced_skills_count_norm,
  ];

  return { values, featureMap };
}
