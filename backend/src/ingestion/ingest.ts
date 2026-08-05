import { Prisma, Source } from '@prisma/client';
import { prisma } from '../db';
import { NormalizedItem } from '../sources/types';
import { publishNewsCreated } from './bus';

/** Stores a normalized feed item as a `News` row and publishes {@link NEWS_CREATED_EVENT} for it; a duplicate (source, externalId) pair is silently ignored. */
export async function ingestItem(source: Source, item: NormalizedItem): Promise<void> {
  try {
    const news = await prisma.news.create({
      data: {
        sourceId: source.id,
        externalId: item.externalId,
        title: item.title,
        summary: item.summary,
        url: item.url,
        publishedAt: item.publishedAt,
      },
    });
    publishNewsCreated(news, source.categoryId);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // Already ingested (sourceId, externalId) pair — not an error, just a repeat poll.
      return;
    }
    throw err;
  }
}
