import type { ApplicationFormData, ApplicationValidationErrors } from "./types";

export function validateApplicationForm(
  data: ApplicationFormData
): { isValid: boolean; errors: ApplicationValidationErrors } {
  const errors: ApplicationValidationErrors = {};

  const trimmedMessage = data.message.trim();
  if (!trimmedMessage) {
    errors.message = "Application message is required.";
  } else if (trimmedMessage.length < 5) {
    errors.message = "Message must be at least 5 characters.";
  } else if (trimmedMessage.length > 1000) {
    errors.message = "Message cannot exceed 1000 characters.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
