import type { Database } from "@/types/database.types";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
export type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"];

export type NotificationType =
  | "application_received"
  | "application_status_updated"
  | "team_invitation"
  | "project_update"
  | "match_recommendation"
  | "general";

export interface Notification extends NotificationRow {
  type: NotificationType;
}

export type NotificationFilter = "all" | "unread";

export interface NotificationToastItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_project_id?: string | null;
  related_application_id?: string | null;
  timestamp: number;
}
