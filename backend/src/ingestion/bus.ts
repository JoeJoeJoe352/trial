import { EventEmitter } from 'node:events';
import { News } from '@prisma/client';

export const NEWS_CREATED_EVENT = 'news:created';

export const newsBus = new EventEmitter();

export function publishNewsCreated(news: News): void {
  newsBus.emit(NEWS_CREATED_EVENT, news);
}
