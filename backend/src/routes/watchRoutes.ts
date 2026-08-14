import express from 'express';
import { createWatchSession, getWatchSession, getChannelWatchSession, updateWatchSession, endWatchSession } from '../controllers/watchController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticate);

router.post('/', createWatchSession);
router.get('/:id', getWatchSession);
router.get('/channel/:channelId', getChannelWatchSession);
router.patch('/:id', updateWatchSession);
router.delete('/:id', endWatchSession);

export default router;
