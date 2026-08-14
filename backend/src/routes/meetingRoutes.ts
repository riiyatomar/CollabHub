import { Router } from 'express';
import { createMeeting, getMeeting, endMeeting } from '../controllers/meetingController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Ensure all meeting routes are authenticated
router.use(authenticate);

// Create a meeting
router.post('/', createMeeting);

// Get meeting details
router.get('/:meetingId', getMeeting);

// End a meeting
router.patch('/:meetingId/end', endMeeting);

export default router;
