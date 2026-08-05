import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../db';
import { handlePrismaError } from '../lib/prisma-errors';
import { toPublicUser } from '../auth/public-user';

const router = Router();
const VALID_ROLES: Role[] = ['ADMIN', 'USER'];

router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(users.map(toPublicUser));
});

router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(toPublicUser(user));
});

router.post('/', async (req, res) => {
  const { email, name, password, role } = req.body ?? {};

  if (typeof email !== 'string' || typeof name !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'email, name and password are required' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'password must be at least 8 characters' });
    return;
  }
  if (role !== undefined && !VALID_ROLES.includes(role)) {
    res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email, name, passwordHash, role: role ?? 'USER' },
    });
    res.status(201).json(toPublicUser(user));
  } catch (err) {
    if (handlePrismaError(err, res)) return;
    throw err;
  }
});

router.patch('/:id', async (req, res) => {
  const { email, name, password, role } = req.body ?? {};

  if (role !== undefined && !VALID_ROLES.includes(role)) {
    res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
    return;
  }
  if (password !== undefined && (typeof password !== 'string' || password.length < 8)) {
    res.status(400).json({ error: 'password must be at least 8 characters' });
    return;
  }

  const data: Record<string, unknown> = {};
  if (email !== undefined) data.email = email;
  if (name !== undefined) data.name = name;
  if (role !== undefined) data.role = role;
  if (password !== undefined) data.passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json(toPublicUser(user));
  } catch (err) {
    if (handlePrismaError(err, res)) return;
    throw err;
  }
});

router.delete('/:id', async (req, res) => {
  if (req.user?.sub === req.params.id) {
    res.status(400).json({ error: 'Cannot delete your own account' });
    return;
  }

  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (handlePrismaError(err, res)) return;
    throw err;
  }
});

export default router;
