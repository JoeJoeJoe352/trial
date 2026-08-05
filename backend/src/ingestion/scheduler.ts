import { prisma } from '../db';
import { sourceAdapters } from '../sources/registry';
import { ingestItem } from './ingest';

async function pollSource(sourceId: string): Promise<void> {
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source || !source.active) return;

  const adapter = sourceAdapters[source.type];
  if (!adapter || adapter.kind !== 'poll') {
    console.warn(`No poll adapter registered for source type "${source.type}" (source: ${source.name})`);
    return;
  }

  try {
    const items = await adapter.fetch(source.url);
    for (const item of items) {
      await ingestItem(source, item);
    }
  } catch (err) {
    console.error(`Failed to poll source "${source.name}" (${source.url}):`, err instanceof Error ? err.message : err);
  }
}

export async function startScheduler(): Promise<void> {
  const sources = await prisma.source.findMany({ where: { active: true } });

  for (const source of sources) {
    if (sourceAdapters[source.type]?.kind !== 'poll') continue;

    // Poll once immediately, then keep polling on the source's configured interval.
    void pollSource(source.id);
    setInterval(() => void pollSource(source.id), source.pollIntervalSeconds * 1000);
  }

  console.log(`Scheduler started for ${sources.length} active source(s).`);
}
