import { Router } from 'express';
import { getBookmarks, createBookmark, deleteBookmark } from '../controllers/bookmarkController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getBookmarks);
router.post('/', createBookmark);
router.delete('/:bookmarkId', deleteBookmark);

export default router;
