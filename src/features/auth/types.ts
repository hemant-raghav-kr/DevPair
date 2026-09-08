import type { UserRole } from "@/types";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  emailConfirmedAt?: string;
}

export interface SignInCredentials {
  email: string;
  password?: string;
}

export interface SignUpCredentials {
  email: string;
  password?: string;
  fullName: string;
  college?: string;
}
