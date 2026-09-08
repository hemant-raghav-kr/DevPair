import type { Database } from "@/types/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export interface ProfileFormData {
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  college: string;
  course: string;
  graduation_year: string | number;
  availability_hours_per_week: string | number;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
}

export interface ProfileValidationErrors {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  college?: string;
  course?: string;
  graduation_year?: string;
  availability_hours_per_week?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  form?: string;
}
