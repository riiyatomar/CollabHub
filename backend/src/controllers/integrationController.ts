import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError, ForbiddenError, NotFoundError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

export class IntegrationController {
  
  static async getWorkspaceIntegrations(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId as string;
      const userId = (req as any).user!.id;

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } }
      });
      if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
        throw new ForbiddenError('Only admins can view integrations');
      }

      const integrations = await prisma.integration.findMany({
        where: { workspaceId }
      });

      res.status(200).json(new ApiResponse(200, integrations, 'Integrations retrieved'));
    } catch (error) {
      next(error);
    }
  }

  static async connectIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId as string;
      const userId = (req as any).user!.id;
      const { provider, accessToken, refreshToken, config } = req.body;

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } }
      });
      if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
        throw new ForbiddenError('Only admins can manage integrations');
      }

      const integration = await prisma.integration.upsert({
        where: { workspaceId_provider: { workspaceId, provider } },
        update: { accessToken, refreshToken, config },
        create: {
          workspaceId,
          provider,
          accessToken,
          refreshToken,
          config
        }
      });

      res.status(200).json(new ApiResponse(200, integration, 'Integration connected'));
    } catch (error) {
      next(error);
    }
  }

  static async disconnectIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const integrationId = req.params.integrationId as string;
      const userId = (req as any).user!.id;

      const integration = await prisma.integration.findUnique({
        where: { id: integrationId }
      });
      if (!integration) throw new NotFoundError('Integration not found');

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: integration.workspaceId, userId } }
      });
      if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
        throw new ForbiddenError('Only admins can manage integrations');
      }

      await prisma.integration.delete({
        where: { id: integrationId }
      });

      res.status(200).json(new ApiResponse(200, null, 'Integration disconnected'));
    } catch (error) {
      next(error);
    }
  }

  static async githubWebhookHandler(req: Request, res: Response, next: NextFunction) {
    // Basic GitHub webhook handler
    try {
      const headerVal = req.headers['x-github-event'];
      const event = Array.isArray(headerVal) ? headerVal[0] : (headerVal as string | undefined);
      const workspaceId = req.params.workspaceId as string;
      // In a real scenario, we'd verify x-hub-signature-256 here

      // Just create an activity log for demonstration
      await prisma.activityLog.create({
        data: {
          workspaceId,
          action: `GITHUB_EVENT_${event?.toUpperCase() || 'UNKNOWN'}`,
          details: req.body
        }
      });
      
      res.status(200).send('OK');
    } catch (error) {
      next(error);
    }
  }
}
