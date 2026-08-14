import { Router } from 'express';
import { IntegrationController } from '../controllers/integrationController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { z } from 'zod';

export const workspaceIntegrationRouter = Router({ mergeParams: true });
export const integrationRouter = Router();

workspaceIntegrationRouter.use(authenticate);

workspaceIntegrationRouter.get('/', IntegrationController.getWorkspaceIntegrations);

workspaceIntegrationRouter.post(
  '/',
  validate(z.object({
    body: z.object({
      provider: z.enum(['GOOGLE', 'GITHUB', 'SLACK']),
      accessToken: z.string().optional().nullable(),
      refreshToken: z.string().optional().nullable(),
      config: z.any().optional(),
    }),
  })),
  IntegrationController.connectIntegration
);

// Webhook endpoint (doesn't require standard auth, GitHub handles it via signature)
workspaceIntegrationRouter.post('/github/webhook', IntegrationController.githubWebhookHandler);

integrationRouter.use(authenticate);

integrationRouter.delete('/:integrationId', IntegrationController.disconnectIntegration);
