import { Category, Channel, DeliveryStatus, News, Prisma } from '@prisma/client';
import { prisma } from '../db';
import { notificationChannels } from './registry';

interface SubscribedUser {
  id: string;
  email: string;
}

export async function dispatchNewsToChannels(news: News, category: Category, users: SubscribedUser[]): Promise<void> {
  if (category.slackWebhookUrl) {
    await sendAndRecord({
      news,
      channel: 'SLACK',
      categoryId: category.id,
      destination: category.slackWebhookUrl,
      categoryName: category.name,
    });
  }

  for (const user of users) {
    await sendAndRecord({
      news,
      channel: 'EMAIL',
      userId: user.id,
      destination: user.email,
      categoryName: category.name,
    });
  }
}

async function sendAndRecord(opts: {
  news: News;
  channel: Channel;
  destination: string;
  categoryName: string;
  userId?: string;
  categoryId?: string;
}): Promise<void> {
  let status: DeliveryStatus = 'SENT';
  let error: string | undefined;

  try {
    await notificationChannels[opts.channel].send({
      news: opts.news,
      destination: opts.destination,
      categoryName: opts.categoryName,
    });
  } catch (err) {
    status = 'FAILED';
    error = err instanceof Error ? err.message : String(err);
    console.error(`Failed to send ${opts.channel} notification for news ${opts.news.id}:`, error);
  }

  try {
    await prisma.delivery.create({
      data: {
        newsId: opts.news.id,
        channel: opts.channel,
        userId: opts.userId,
        categoryId: opts.categoryId,
        status,
        error,
        sentAt: status === 'SENT' ? new Date() : null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // Already recorded for this (news, channel, target) — nothing more to do.
      return;
    }
    throw err;
  }

  if (opts.channel === 'EMAIL' && status === 'SENT' && opts.userId) {
    await prisma.user.update({ where: { id: opts.userId }, data: { lastEmailSentAt: new Date() } });
  }
}
