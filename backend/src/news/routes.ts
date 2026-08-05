import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/** GET / — latest news (newest first), optionally filtered by categoryId, paginated via `limit` (default 50, max 100). Backs the main page's news feed. */
router.get('/', async (req, res) => {
  const { categoryId } = req.query;
  const limitParam = Number(req.query.limit);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;

  const news = await prisma.news.findMany({
    where: typeof categoryId === 'string' ? { source: { categoryId } } : undefined,
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      summary: true,
      url: true,
      publishedAt: true,
      source: {
        select: {
          id: true,
          name: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  res.json(news);
});

export default router;
