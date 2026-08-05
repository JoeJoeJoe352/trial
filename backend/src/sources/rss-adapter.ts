import Parser from 'rss-parser';
import { NormalizedItem, PollAdapter } from './types';

const parser = new Parser();

/** Poll adapter for RSS/Atom feeds, using `rss-parser` and normalizing items to {@link NormalizedItem}. */
export const rssAdapter: PollAdapter = {
  kind: 'poll',

  /** Fetches and parses the feed at `sourceUrl`, dropping any item without a usable external id. */
  async fetch(sourceUrl: string): Promise<NormalizedItem[]> {
    const feed = await parser.parseURL(sourceUrl);

    return (feed.items ?? [])
      .map((item): NormalizedItem => {
        const externalId = item.guid ?? item.link ?? item.title ?? '';
        const publishedAt = item.isoDate
          ? new Date(item.isoDate)
          : item.pubDate
            ? new Date(item.pubDate)
            : new Date();

        return {
          externalId,
          title: item.title ?? '(untitled)',
          summary: item.contentSnippet ?? item.content ?? undefined,
          url: item.link ?? sourceUrl,
          publishedAt,
        };
      })
      .filter((item) => item.externalId.length > 0);
  },
};
