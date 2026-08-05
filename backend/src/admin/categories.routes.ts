import { Router } from 'express';
import { prisma } from '../db';
import { handlePrismaError } from '../lib/prisma-errors';

const router = Router();

/** GET / — lists all categories (admin view, unfiltered fields). */
router.get('/', async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(categories);
});

/** GET /:id — fetches one category by id. */
router.get('/:id', async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  res.json(category);
});

/** POST / — creates a category. */
router.post('/', async (req, res) => {
  const { name, slug, slackWebhookUrl } = req.body ?? {};

  if (typeof name !== 'string' || typeof slug !== 'string') {
    res.status(400).json({ error: 'name and slug are required' });
    return;
  }

  try {
    const category = await prisma.category.create({
      data: { name, slug, slackWebhookUrl: typeof slackWebhookUrl === 'string' ? slackWebhookUrl : null },
    });
    res.status(201).json(category);
  } catch (err) {
    if (handlePrismaError(err, res)) return;
    throw err;
  }
});

/** PATCH /:id — partially updates a category. */
router.patch('/:id', async (req, res) => {
  const { name, slug, slackWebhookUrl } = req.body ?? {};

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (slug !== undefined) data.slug = slug;
  if (slackWebhookUrl !== undefined) data.slackWebhookUrl = slackWebhookUrl;

  try {
    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    res.json(category);
  } catch (err) {
    if (handlePrismaError(err, res)) return;
    throw err;
  }
});

/** DELETE /:id — deletes a category, refusing if any source still references it. */
router.delete('/:id', async (req, res) => {
  const sourceCount = await prisma.source.count({ where: { categoryId: req.params.id } });
  if (sourceCount > 0) {
    res.status(409).json({ error: 'Cannot delete a category with existing sources; reassign or remove them first' });
    return;
  }

  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (handlePrismaError(err, res)) return;
    throw err;
  }
});

export default router;
