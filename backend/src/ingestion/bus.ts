import { EventEmitter } from 'node:events';
import { News } from '@prisma/client';

/** Event name emitted on {@link newsBus} whenever a news item is ingested. */
export const NEWS_CREATED_EVENT = 'news:created';

/** Payload emitted with {@link NEWS_CREATED_EVENT}: the ingested news row and the category of the source it came from. */
export interface NewsCreatedEvent {
  news: News;
  categoryId: string;
}

/** In-memory, unpersisted event bus connecting ingestion to downstream consumers (e.g. subscription matching). */
export const newsBus = new EventEmitter();

/** Emits {@link NEWS_CREATED_EVENT} on {@link newsBus} for a freshly ingested news item. */
export function publishNewsCreated(news: News, categoryId: string): void {
  const event: NewsCreatedEvent = { news, categoryId };
  newsBus.emit(NEWS_CREATED_EVENT, event);
}
