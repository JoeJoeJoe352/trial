import Parser from 'rss-parser';
import { NormalizedItem, PollAdapter } from './types';

const parser = new Parser();

export const rssAdapter: PollAdapter = {
  kind: 'poll',

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
