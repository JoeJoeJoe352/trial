import { Router } from 'express';
import { SourceType } from '@prisma/client';
import { prisma } from '../db';
import { handlePrismaError } from '../lib/prisma-errors';
import { schedulePolling, unschedulePolling } from '../ingestion/scheduler';

const router = Router();
const VALID_TYPES: SourceType[] = ['RSS', 'WEBSOCKET'];

router.get('/', async (_req, res) => {
  const sources = await prisma.source.findMany({
    orderBy: { name: 'asc' },
    include: { category: { select: { id: true, name: true } } },
  });
  res.json(sources);
});

router.get('/:id', async (req, res) => {
  const source = await prisma.source.findUnique({ where: { id: req.params.id } });
  if (!source) {
    res.status(404).json({ error: 'Source not found' });
    return;
  }
  res.json(source);
});

router.post('/', async (req, res) => {
  const { name, url, type, categoryId, pollIntervalSeconds, active } = req.body ?? {};

  if (typeof name !== 'string' || typeof url !== 'string' || typeof categoryId !== 'string') {
    res.status(400).json({ error: 'name, url and categoryId are required' });
    return;
  }
  if (type !== undefined && !VALID_TYPES.includes(type)) {
    res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
    return;
  }

  try {
    const source = await prisma.source.create({
      data: {
        name,
        url,
        categoryId,
        type: type ?? 'RSS',
        pollIntervalSeconds: typeof pollIntervalSeconds === 'number' ? pollIntervalSeconds : undefined,
        active: typeof active === 'boolean' ? active : undefined,
      },
    });
    schedulePolling(source);
    res.status(201).json(source);
  } catch (err) {
    if (handlePrismaError(err, res)) return;
    throw err;
  }
});

router.patch('/:id', async (req, res) => {
  const { name, url, type, categoryId, pollIntervalSeconds, active } = req.body ?? {};

  if (type !== undefined && !VALID_TYPES.includes(type)) {
    res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
    return;
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (url !== undefined) data.url = url;
  if (type !== undefined) data.type = type;
  if (categoryId !== undefined) data.categoryId = categoryId;
  if (pollIntervalSeconds !== undefined) data.pollIntervalSeconds = pollIntervalSeconds;
  if (active !== undefined) data.active = active;

  try {
    const source = await prisma.source.update({ where: { id: req.params.id }, data });
    schedulePolling(source);
    res.json(source);
  } catch (err) {
    if (handlePrismaError(err, res)) return;
    throw err;
  }
});

router.delete('/:id', async (req, res) => {
  const newsCount = await prisma.news.count({ where: { sourceId: req.params.id } });
  if (newsCount > 0) {
    res.status(409).json({ error: 'Cannot delete a source with ingested news; deactivate it instead' });
    return;
  }

  unschedulePolling(req.params.id);
  try {
    await prisma.source.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (handlePrismaError(err, res)) return;
    throw err;
  }
});

export default router;
