import { Router } from 'express';
import { getWorkspaceActivity } from '../controllers/activityController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/:workspaceId', getWorkspaceActivity);

export default router;
