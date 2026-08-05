import { prisma } from '../db';
import { emailChannel } from './email-channel';

const COOLDOWN_MS = 15 * 60 * 1000;

/** Sends one digest email per user who has PENDING email deliveries and is past their 15-minute cooldown, then marks those deliveries SENT. Call once at server startup. */
export function startEmailDigestScheduler(): void {
  setInterval(() => void flushDueEmailDigests(), 60_000);
  console.log('Email digest scheduler started (checks every 60s, 15min cooldown per user).');
}

/** Finds every user with a queued email and flushes their digest if eligible. */
export async function flushDueEmailDigests(): Promise<void> {
  const queued = await prisma.delivery.findMany({
    where: { channel: 'EMAIL', status: 'PENDING' },
    select: { userId: true },
    distinct: ['userId'],
  });

  for (const { userId } of queued) {
    if (!userId) continue;
    try {
      await flushUserDigest(userId);
    } catch (err) {
      console.error(`Failed to flush email digest for user ${userId}:`, err instanceof Error ? err.message : err);
    }
  }
}

/** Sends one user's queued items as a single digest, if their cooldown since the last email has elapsed. Leaves items PENDING (for retry) if the user isn't eligible yet or the send fails. */
async function flushUserDigest(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt || Date.now() - user.lastEmailSentAt.getTime() < COOLDOWN_MS) return;

  const deliveries = await prisma.delivery.findMany({
    where: { channel: 'EMAIL', status: 'PENDING', userId },
    include: { news: { include: { source: { include: { category: true } } } } },
  });
  if (deliveries.length === 0) return;

  const items = deliveries.map((delivery) => ({
    news: delivery.news,
    categoryName: delivery.news.source.category.name,
  }));

  await emailChannel.sendDigest(items, user.email);

  const sentAt = new Date();
  await prisma.$transaction([
    prisma.delivery.updateMany({
      where: { id: { in: deliveries.map((delivery) => delivery.id) } },
      data: { status: 'SENT', sentAt },
    }),
    prisma.user.update({ where: { id: userId }, data: { lastEmailSentAt: sentAt } }),
  ]);
}
