import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError, ForbiddenError, NotFoundError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import crypto from 'crypto';

export class WebhookController {
  
  static async getWorkspaceWebhooks(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId as string;
      const userId = (req as any).user!.id;

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } }
      });
      if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
        throw new ForbiddenError('Only admins can view webhooks');
      }

      const webhooks = await prisma.webhook.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json(new ApiResponse(200, webhooks, 'Webhooks retrieved'));
    } catch (error) {
      next(error);
    }
  }

  static async createWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId as string;
      const userId = (req as any).user!.id;
      const { name, url, events, isActive } = req.body;

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } }
      });
      if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
        throw new ForbiddenError('Only admins can create webhooks');
      }

      const secret = crypto.randomBytes(32).toString('hex');

      const webhook = await prisma.webhook.create({
        data: {
          workspaceId,
          name,
          url,
          secret,
          events,
          isActive: isActive !== undefined ? isActive : true
        }
      });

      res.status(201).json(new ApiResponse(201, webhook, 'Webhook created'));
    } catch (error) {
      next(error);
    }
  }

  static async updateWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const webhookId = req.params.webhookId as string;
      const userId = (req as any).user!.id;
      const { name, url, events, isActive, rotateSecret } = req.body;

      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId }
      });
      if (!webhook) throw new NotFoundError('Webhook not found');

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: webhook.workspaceId, userId } }
      });
      if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
        throw new ForbiddenError('Only admins can update webhooks');
      }

      let newSecret = webhook.secret;
      if (rotateSecret) {
        newSecret = crypto.randomBytes(32).toString('hex');
      }

      const updated = await prisma.webhook.update({
        where: { id: webhookId },
        data: {
          name,
          url,
          events,
          isActive,
          secret: newSecret
        }
      });

      res.status(200).json(new ApiResponse(200, updated, 'Webhook updated'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const webhookId = req.params.webhookId as string;
      const userId = (req as any).user!.id;

      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId }
      });
      if (!webhook) throw new NotFoundError('Webhook not found');

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: webhook.workspaceId, userId } }
      });
      if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
        throw new ForbiddenError('Only admins can delete webhooks');
      }

      await prisma.webhook.delete({
        where: { id: webhookId }
      });

      res.status(200).json(new ApiResponse(200, null, 'Webhook deleted'));
    } catch (error) {
      next(error);
    }
  }
}
