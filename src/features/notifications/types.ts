import type { Notification, NotificationType } from "@/types";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export type { Notification, NotificationType };
