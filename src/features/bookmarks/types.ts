import type { Bookmark } from "@/types";

export interface ToggleBookmarkInput {
  userId: string;
  itemType: "project" | "profile";
  itemId: string;
}

export type { Bookmark };
