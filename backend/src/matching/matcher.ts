import { prisma } from '../db';
import { newsBus, NEWS_CREATED_EVENT, NewsCreatedEvent } from '../ingestion/bus';
import { dispatchNewsToChannels } from '../notifications/dispatch';

export function startMatcher(): void {
  newsBus.on(NEWS_CREATED_EVENT, (event: NewsCreatedEvent) => {
    void handleNewsCreated(event).catch((err) => console.error(`Matching failed for news ${event.news.id}:`, err));
  });
}

async function handleNewsCreated({ news, categoryId }: NewsCreatedEvent): Promise<void> {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return;

  const subscriptions = await prisma.subscription.findMany({
    where: { categoryId, active: true },
    include: { user: { select: { id: true, email: true } } },
  });

  await dispatchNewsToChannels(
    news,
    category,
    subscriptions.map((s) => s.user),
  );
}
