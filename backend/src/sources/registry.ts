import { SourceType } from '@prisma/client';
import { SourceAdapter } from './types';
import { rssAdapter } from './rss-adapter';

export const sourceAdapters: Partial<Record<SourceType, SourceAdapter>> = {
  RSS: rssAdapter,
};
