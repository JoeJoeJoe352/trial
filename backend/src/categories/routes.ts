import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/', async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });
  res.json(categories);
});

export default router;
