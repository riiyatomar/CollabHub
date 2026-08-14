import { Router } from 'express';
import { globalSearch } from '../controllers/searchController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', globalSearch);

export default router;
