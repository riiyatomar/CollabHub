import { Router } from 'express';
import { AiController } from '../controllers/aiController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/workspaces/:workspaceId/conversations', AiController.getConversations);
router.post('/conversations', AiController.createConversation);
router.get('/conversations/:conversationId/messages', AiController.getConversationMessages);
router.post('/conversations/:conversationId/messages', AiController.sendMessage);
router.delete('/conversations/:conversationId', AiController.deleteConversation);

router.post('/summarize/channel', AiController.summarizeChannel);

export default router;
