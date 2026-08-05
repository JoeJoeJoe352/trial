import { Category, DeliveryStatus, News, Prisma } from '@prisma/client';
import { prisma } from '../db';
import { notificationChannels } from './registry';

/** Minimal user shape needed to send a notification. */
interface SubscribedUser {
  id: string;
  email: string;
}

/** Fans a news item out to the category's Slack webhook (if set, immediately) and queues an email delivery for every subscribed user. */
export async function dispatchNewsToChannels(news: News, category: Category, users: SubscribedUser[]): Promise<void> {
  if (category.slackWebhookUrl) {
    await sendSlackAndRecord(news, category);
  }

  for (const user of users) {
    await enqueueEmail(news, user.id);
  }
}

/** Records a PENDING email delivery; the digest flusher (see `email-digest.ts`) sends it once the user's cooldown has elapsed. Deduped on (news, channel, user). */
async function enqueueEmail(news: News, userId: string): Promise<void> {
  try {
    await prisma.delivery.create({
      data: { newsId: news.id, channel: 'EMAIL', userId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // Already queued or sent for this (news, user) pair — nothing more to do.
      return;
    }
    throw err;
  }
}

/** Sends the news item to the category's Slack webhook immediately and records the attempt in `Delivery`, deduping on (news, category). */
async function sendSlackAndRecord(news: News, category: Category): Promise<void> {
  let status: DeliveryStatus = 'SENT';
  let error: string | undefined;

  try {
    await notificationChannels.SLACK.send({
      news,
      destination: category.slackWebhookUrl!,
      categoryName: category.name,
    });
  } catch (err) {
    status = 'FAILED';
    error = err instanceof Error ? err.message : String(err);
    console.error(`Failed to send SLACK notification for news ${news.id}:`, error);
  }

  try {
    await prisma.delivery.create({
      data: {
        newsId: news.id,
        channel: 'SLACK',
        categoryId: category.id,
        status,
        error,
        sentAt: status === 'SENT' ? new Date() : null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // Already recorded for this (news, category) pair — nothing more to do.
      return;
    }
    throw err;
  }
}
