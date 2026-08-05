import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

/** GET / — public list of categories (id/name/slug only) for subscribing and filtering news. */
router.get('/', async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });
  res.json(categories);
});

export default router;
