import { Channel } from '@prisma/client';
import { NotificationChannel } from './types';
import { emailChannel } from './email-channel';
import { slackChannel } from './slack-channel';

export const notificationChannels: Record<Channel, NotificationChannel> = {
  EMAIL: emailChannel,
  SLACK: slackChannel,
};
