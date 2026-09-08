import type {
  ProjectFormData,
  ProjectValidationErrors,
  ProjectRoleFormData,
  ProjectRoleValidationErrors,
} from "./types";

export function isValidUrl(url: string): boolean {
  if (!url || url.trim() === "") return true;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateProjectForm(
  data: ProjectFormData
): { isValid: boolean; errors: ProjectValidationErrors } {
  const errors: ProjectValidationErrors = {};

  // Title: 3 - 120 characters
  const trimmedTitle = data.title.trim();
  if (!trimmedTitle) {
    errors.title = "Project title is required.";
  } else if (trimmedTitle.length < 3) {
    errors.title = "Project title must be at least 3 characters.";
  } else if (trimmedTitle.length > 120) {
    errors.title = "Project title cannot exceed 120 characters.";
  }

  // Tagline: max 200 characters
  if (data.tagline && data.tagline.trim().length > 200) {
    errors.tagline = "Tagline cannot exceed 200 characters.";
  }

  // Description: at least 10 characters
  const trimmedDesc = data.description.trim();
  if (!trimmedDesc) {
    errors.description = "Project description is required.";
  } else if (trimmedDesc.length < 10) {
    errors.description =
      "Description must be at least 10 characters to explain the project goals.";
  }

  // Max team size: 1 - 50
  const teamSize = Number(data.max_team_size);
  if (isNaN(teamSize) || !Number.isInteger(teamSize) || teamSize < 1 || teamSize > 50) {
    errors.max_team_size = "Team size must be a whole number between 1 and 50.";
  }

  // Hackathon info
  if (data.is_hackathon) {
    if (data.hackathon_name && data.hackathon_name.trim().length > 120) {
      errors.hackathon_name = "Hackathon name cannot exceed 120 characters.";
    }
  }

  // Links validation
  if (data.repo_url && !isValidUrl(data.repo_url)) {
    errors.repo_url = "Must be a valid URL starting with http:// or https://";
  }
  if (data.demo_url && !isValidUrl(data.demo_url)) {
    errors.demo_url = "Must be a valid URL starting with http:// or https://";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateProjectRoleForm(
  data: ProjectRoleFormData
): { isValid: boolean; errors: ProjectRoleValidationErrors } {
  const errors: ProjectRoleValidationErrors = {};

  const trimmedTitle = data.title.trim();
  if (!trimmedTitle) {
    errors.title = "Role title is required (e.g. Frontend Engineer, ML Researcher).";
  } else if (trimmedTitle.length < 2) {
    errors.title = "Role title must be at least 2 characters.";
  } else if (trimmedTitle.length > 80) {
    errors.title = "Role title cannot exceed 80 characters.";
  }

  if (data.description && data.description.trim().length > 500) {
    errors.description = "Role description cannot exceed 500 characters.";
  }

  const slots = Number(data.slots);
  if (isNaN(slots) || !Number.isInteger(slots) || slots < 1 || slots > 20) {
    errors.slots = "Slots must be an integer between 1 and 20.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
