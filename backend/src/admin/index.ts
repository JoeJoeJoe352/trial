import { Router } from 'express';
import { requireAuth, requireRole } from '../auth/middleware';
import categoriesRoutes from './categories.routes';
import sourcesRoutes from './sources.routes';
import usersRoutes from './users.routes';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));
router.use('/categories', categoriesRoutes);
router.use('/sources', sourcesRoutes);
router.use('/users', usersRoutes);

export default router;
