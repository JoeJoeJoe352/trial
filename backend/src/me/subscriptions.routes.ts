import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../auth/middleware';
import { handlePrismaError } from '../lib/prisma-errors';

const router = Router();
router.use(requireAuth);

const categorySelect = { id: true, name: true, slug: true } as const;

/** GET / — lists the current user's active subscriptions. */
router.get('/', async (req, res) => {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: req.user!.sub, active: true },
    include: { category: { select: categorySelect } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(subscriptions);
});

/** POST / — subscribes the current user to a category (or reactivates an existing, deactivated subscription). */
router.post('/', async (req, res) => {
  const { categoryId } = req.body ?? {};
  if (typeof categoryId !== 'string') {
    res.status(400).json({ error: 'categoryId is required' });
    return;
  }

  try {
    const subscription = await prisma.subscription.upsert({
      where: { userId_categoryId: { userId: req.user!.sub, categoryId } },
      update: { active: true },
      create: { userId: req.user!.sub, categoryId, active: true },
      include: { category: { select: categorySelect } },
    });
    res.status(201).json(subscription);
  } catch (err) {
    if (handlePrismaError(err, res)) return;
    throw err;
  }
});

/** DELETE /:categoryId — unsubscribes the current user by marking the subscription inactive (soft delete). */
router.delete('/:categoryId', async (req, res) => {
  try {
    await prisma.subscription.update({
      where: { userId_categoryId: { userId: req.user!.sub, categoryId: req.params.categoryId } },
      data: { active: false },
    });
    res.status(204).send();
  } catch (err) {
    if (handlePrismaError(err, res)) return;
    throw err;
  }
});

export default router;
