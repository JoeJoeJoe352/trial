import { SourceType } from '@prisma/client';
import { SourceAdapter } from './types';
import { rssAdapter } from './rss-adapter';

/** Maps each {@link SourceType} to its adapter. Types with no entry (e.g. WEBSOCKET) aren't collectible yet. */
export const sourceAdapters: Partial<Record<SourceType, SourceAdapter>> = {
  RSS: rssAdapter,
};
