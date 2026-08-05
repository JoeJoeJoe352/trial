import { News } from '@prisma/client';

export interface NotificationPayload {
  news: News;
  /** An email address for EMAIL, a webhook URL for SLACK. */
  destination: string;
  categoryName: string;
}

export interface NotificationChannel {
  send(payload: NotificationPayload): Promise<void>;
}
