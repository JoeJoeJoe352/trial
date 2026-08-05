import { Source } from '@prisma/client';
import { prisma } from '../db';
import { sourceAdapters } from '../sources/registry';
import { ingestItem } from './ingest';

const timers = new Map<string, NodeJS.Timeout>();

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

/** (Re)schedules polling for a source based on its current active/type/interval. Call after any create/update. */
export function schedulePolling(source: Source): void {
  unschedulePolling(source.id);
  if (!source.active) return;

  const adapter = sourceAdapters[source.type];
  if (!adapter || adapter.kind !== 'poll') {
    console.warn(`No poll adapter registered for source type "${source.type}" (source: ${source.name})`);
    return;
  }

  void pollSource(source.id);
  const timer = setInterval(() => void pollSource(source.id), source.pollIntervalSeconds * 1000);
  timers.set(source.id, timer);
}

/** Stops polling a source. Call after deactivating or deleting it. */
export function unschedulePolling(sourceId: string): void {
  const timer = timers.get(sourceId);
  if (timer) {
    clearInterval(timer);
    timers.delete(sourceId);
  }
}

export async function startScheduler(): Promise<void> {
  const sources = await prisma.source.findMany({ where: { active: true } });
  for (const source of sources) {
    schedulePolling(source);
  }
  console.log(`Scheduler started for ${sources.length} active source(s).`);
}
