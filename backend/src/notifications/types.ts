import { News } from '@prisma/client';

/** Everything a {@link NotificationChannel} needs to render and deliver one notification. */
export interface NotificationPayload {
  news: News;
  /** An email address for EMAIL, a webhook URL for SLACK. */
  destination: string;
  categoryName: string;
  categorySlug: string;
}

/** A delivery mechanism (email, Slack, ...) that knows how to send a single {@link NotificationPayload}. */
export interface NotificationChannel {
  send(payload: NotificationPayload): Promise<void>;
}
