"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface AvatarPreviewProps {
  avatarUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function AvatarPreview({
  avatarUrl,
  name,
  size = "md",
  className,
}: AvatarPreviewProps) {
  const [imageError, setImageError] = useState(false);

  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "DP";

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-20 w-20 text-xl",
    xl: "h-28 w-28 text-3xl",
  };

  const hasValidImage = Boolean(avatarUrl && !imageError && avatarUrl.trim().length > 0);

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 select-none",
        sizeClasses[size],
        className
      )}
    >
      {hasValidImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl!}
          alt={name || "Avatar"}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-500 font-bold text-white tracking-wider">
          {initials}
        </div>
      )}
    </div>
  );
}
