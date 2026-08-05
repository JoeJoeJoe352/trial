import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { signToken } from './jwt';
import { AUTH_COOKIE_NAME, authCookieOptions } from './cookie';
import { requireAuth } from './middleware';
import { toPublicUser } from './public-user';

const router = Router();

/** POST /register — creates a user and logs them in by setting the auth cookie. */
router.post('/register', async (req, res) => {
  const { email, name, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof name !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'email, name and password are required' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'password must be at least 8 characters' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'A user with this email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  const token = signToken({ sub: user.id, role: user.role });
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
  res.status(201).json(toPublicUser(user));
});

/** POST /login — verifies credentials and sets the auth cookie. */
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = signToken({ sub: user.id, role: user.role });
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
  res.json(toPublicUser(user));
});

/** POST /logout — clears the auth cookie. */
router.post('/logout', (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { ...authCookieOptions, maxAge: undefined });
  res.status(204).send();
});

/** GET /me — returns the current authenticated user. */
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(toPublicUser(user));
});

export default router;
