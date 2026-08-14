import { Router } from 'express';
import { uploadFiles, deleteFile, renameFile, getWorkspaceFiles, getChannelFiles } from '../controllers/fileController';
import { authenticate } from '../middleware/authMiddleware';
import { uploadMiddleware } from '../middleware/uploadMiddleware';

const router = Router();

// Ensure all file routes are authenticated
router.use(authenticate);

// Upload endpoint supporting up to 10 files at once
router.post('/upload', uploadMiddleware.array('files', 10), uploadFiles);

// Get files for a specific workspace
router.get('/workspaces/:workspaceId', getWorkspaceFiles);

// Get files for a specific channel
router.get('/channels/:channelId', getChannelFiles);

// File specific operations
router.delete('/:fileId', deleteFile);
router.patch('/:fileId/rename', renameFile);

export default router;
