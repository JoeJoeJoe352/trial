import { prisma } from '../db';
import { newsBus, NEWS_CREATED_EVENT, NewsCreatedEvent } from '../ingestion/bus';
import { dispatchNewsToChannels } from '../notifications/dispatch';

/** Subscribes to {@link NEWS_CREATED_EVENT} so each freshly ingested news item gets matched to subscribers. Call once at server startup. */
export function startMatcher(): void {
  newsBus.on(NEWS_CREATED_EVENT, (event: NewsCreatedEvent) => {
    void handleNewsCreated(event).catch((err) => console.error(`Matching failed for news ${event.news.id}:`, err));
  });
}

/** Looks up active subscriptions for the news item's category and dispatches it to their notification channels. */
async function handleNewsCreated({ news, categoryId }: NewsCreatedEvent): Promise<void> {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return;

  const subscriptions = await prisma.subscription.findMany({
    where: { categoryId, active: true, user: { deletedAt: null } },
    include: { user: { select: { id: true, email: true } } },
  });

  await dispatchNewsToChannels(
    news,
    category,
    subscriptions.map((s) => s.user),
  );
}
