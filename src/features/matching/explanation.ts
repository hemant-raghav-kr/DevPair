import type {
  CandidateProfile,
  TargetRole,
  TargetProject,
  FeatureVector,
  MatchFactor,
} from "./types";
import type { PredictionOutput } from "./model";

export function generateMatchFactors(
  candidate: CandidateProfile,
  role: TargetRole,
  project: TargetProject,
  featureVector: FeatureVector,
  prediction: PredictionOutput
): MatchFactor[] {
  const factors: MatchFactor[] = [];
  const fm = featureVector.featureMap;
  const contrib = prediction.contributions;

  // 1. Required Skill Analysis
  if (role.skill) {
    const requiredSkillName = role.skill.name;
    const matchingCandidateSkill = candidate.skills?.find(
      (s) => s.skill_id === role.required_skill_id
    );

    if (matchingCandidateSkill) {
      const profLabel =
        matchingCandidateSkill.proficiency.charAt(0).toUpperCase() +
        matchingCandidateSkill.proficiency.slice(1);
      factors.push({
        type: "positive",
        text: `Required skill: ${requiredSkillName} (${profLabel})`,
        feature: "required_skill_match",
        contribution: contrib.required_skill_match ?? 0,
      });
    } else {
      factors.push({
        type: "negative",
        text: `Missing required skill: ${requiredSkillName}`,
        feature: "required_skill_match",
        contribution: contrib.required_skill_match ?? 0,
      });
    }
  } else {
    factors.push({
      type: "positive",
      text: "Role has open technical prerequisites",
      feature: "required_skill_match",
      contribution: contrib.required_skill_match ?? 0,
    });
  }

  // 2. Skill Category & Domain Overlap
  const targetCategory =
    role.skill?.category || project.category.replace(/_/g, " ");

  if (fm.skill_category_overlap_ratio >= 0.5) {
    factors.push({
      type: "positive",
      text: `Strong ${targetCategory.replace(/_/g, " ")} skill alignment`,
      feature: "skill_category_overlap_ratio",
      contribution: contrib.skill_category_overlap_ratio ?? 0,
    });
  } else if (fm.skill_category_overlap_ratio > 0.2) {
    factors.push({
      type: "neutral",
      text: `Moderate background in ${targetCategory.replace(/_/g, " ")}`,
      feature: "skill_category_overlap_ratio",
      contribution: contrib.skill_category_overlap_ratio ?? 0,
    });
  } else {
    factors.push({
      type: "negative",
      text: `Limited overlap with ${targetCategory.replace(/_/g, " ")} focus`,
      feature: "skill_category_overlap_ratio",
      contribution: contrib.skill_category_overlap_ratio ?? 0,
    });
  }

  // 3. Project Category Alignment
  const humanProjectCat = project.category.replace(/_/g, " ");
  if (fm.project_category_alignment >= 0.6) {
    factors.push({
      type: "positive",
      text: `Strong alignment with ${humanProjectCat} projects`,
      feature: "project_category_alignment",
      contribution: contrib.project_category_alignment ?? 0,
    });
  } else if (fm.project_category_alignment < 0.25) {
    factors.push({
      type: "negative",
      text: `Domain divergence from ${humanProjectCat}`,
      feature: "project_category_alignment",
      contribution: contrib.project_category_alignment ?? 0,
    });
  }

  // 4. Availability Fit
  const studentHours = candidate.availability_hours_per_week ?? 10;
  if (fm.availability_fit >= 0.9) {
    factors.push({
      type: "positive",
      text: `Availability (${studentHours} hrs/wk) fits project needs`,
      feature: "availability_fit",
      contribution: contrib.availability_fit ?? 0,
    });
  } else if (fm.availability_fit < 0.6) {
    factors.push({
      type: "negative",
      text: `Limited availability (${studentHours} hrs/wk) for project pace`,
      feature: "availability_fit",
      contribution: contrib.availability_fit ?? 0,
    });
  }

  // 5. Technical Experience / Breadth
  if (fm.advanced_skills_count_norm >= 0.3) {
    factors.push({
      type: "positive",
      text: "Demonstrated advanced depth in core technical skills",
      feature: "advanced_skills_count_norm",
      contribution: contrib.advanced_skills_count_norm ?? 0,
    });
  } else if (fm.total_skills_count_norm < 0.2) {
    factors.push({
      type: "negative",
      text: "Early-stage portfolio with few listed skills",
      feature: "total_skills_count_norm",
      contribution: contrib.total_skills_count_norm ?? 0,
    });
  }

  // Sort factors: positive first by contribution, then negative
  return factors.sort((a, b) => {
    if (a.type === "positive" && b.type !== "positive") return -1;
    if (a.type !== "positive" && b.type === "positive") return 1;
    return b.contribution - a.contribution;
  });
}
