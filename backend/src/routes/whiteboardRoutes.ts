import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { WhiteboardController } from '../controllers/WhiteboardController';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Workspace specific endpoints
// These will be mounted on /api/v1/workspaces/:workspaceId/whiteboards but handled here
// Or they could be handled by workspaceRoutes. But let's assume they are mounted on /api/v1/whiteboards
// Wait, the plan was to mount this on /api/v1/whiteboards
// and the workspace ones on /workspaces/:workspaceId/whiteboards.
// Let's just handle both using standard routing.

// GET /api/v1/workspaces/:workspaceId/whiteboards
// POST /api/v1/workspaces/:workspaceId/whiteboards
// We'll export a separate router for workspace-nested routes

const workspaceWhiteboardRouter = express.Router({ mergeParams: true });

workspaceWhiteboardRouter.get('/', WhiteboardController.getWorkspaceWhiteboards);

workspaceWhiteboardRouter.post(
  '/',
  validate(z.object({
    body: z.object({
      name: z.string().min(1, 'Name is required').max(100).optional(),
    }),
  })),
  WhiteboardController.createWhiteboard
);

const whiteboardRouter = express.Router();

whiteboardRouter.use(authenticate);

whiteboardRouter.get('/:whiteboardId', WhiteboardController.getWhiteboard);

whiteboardRouter.patch(
  '/:whiteboardId',
  validate(z.object({
    body: z.object({
      name: z.string().min(1).max(100),
    }),
  })),
  WhiteboardController.updateWhiteboard
);

whiteboardRouter.delete('/:whiteboardId', WhiteboardController.deleteWhiteboard);

export { whiteboardRouter, workspaceWhiteboardRouter };
