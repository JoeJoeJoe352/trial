import { Channel } from '@prisma/client';
import { NotificationChannel } from './types';
import { emailChannel } from './email-channel';
import { slackChannel } from './slack-channel';

/** Maps each {@link Channel} to its {@link NotificationChannel} implementation. */
export const notificationChannels: Record<Channel, NotificationChannel> = {
  EMAIL: emailChannel,
  SLACK: slackChannel,
};
