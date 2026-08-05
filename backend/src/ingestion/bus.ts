import { EventEmitter } from 'node:events';
import { News } from '@prisma/client';

export const NEWS_CREATED_EVENT = 'news:created';

export interface NewsCreatedEvent {
  news: News;
  categoryId: string;
}

export const newsBus = new EventEmitter();

export function publishNewsCreated(news: News, categoryId: string): void {
  const event: NewsCreatedEvent = { news, categoryId };
  newsBus.emit(NEWS_CREATED_EVENT, event);
}
