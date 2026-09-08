"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ProfileCard } from "./ProfileCard";
import type { Profile } from "../types";
import type { UserSkillWithDetails } from "@/features/skills/types";

interface PublicProfileViewProps {
  profile: Profile;
  skills: UserSkillWithDetails[];
  isOwnProfile?: boolean;
}

export function PublicProfileView({
  profile,
  skills,
  isOwnProfile = false,
}: PublicProfileViewProps) {
  const router = useRouter();

  return (
    <ProfileCard
      profile={profile}
      skills={skills}
      isOwnProfile={isOwnProfile}
      onEditClick={() => router.push("/profile")}
    />
  );
}
