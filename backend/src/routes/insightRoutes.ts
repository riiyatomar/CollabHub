import { Router } from 'express';
import { getWorkspaceInsights } from '../controllers/insightController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/:workspaceId', getWorkspaceInsights);

export default router;
