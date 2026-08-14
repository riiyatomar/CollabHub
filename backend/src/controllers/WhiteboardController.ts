import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError, ForbiddenError, NotFoundError } from '../utils/ApiError';

export class WhiteboardController {
  
  static async createWhiteboard(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId as string;
      const { name } = req.body;
      const userId = (req as any).user!.userId;

      // Check RBAC: Must be member
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId }
        }
      });
      if (!member) throw new ForbiddenError('Access denied');

      const whiteboard = await prisma.whiteboard.create({
        data: {
          name: name || 'New Whiteboard',
          workspaceId,
          createdById: userId,
        }
      });

      res.status(201).json({
        success: true,
        data: whiteboard
      });
    } catch (error) {
      next(error);
    }
  }

  static async getWorkspaceWhiteboards(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId as string;
      const userId = (req as any).user!.userId;

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } }
      });
      if (!member) throw new ForbiddenError('Access denied');

      const whiteboards = await prisma.whiteboard.findMany({
        where: { workspaceId, channelId: null },
        orderBy: { updatedAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true, avatar: true }
          }
        }
      });

      res.status(200).json({
        success: true,
        data: whiteboards
      });
    } catch (error) {
      next(error);
    }
  }

  static async getChannelWhiteboard(req: Request, res: Response, next: NextFunction) {
    try {
      const channelId = req.params.channelId as string;
      const userId = (req as any).user!.userId;

      // Ensure the user has access to this channel via the workspace
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { workspace: true }
      });

      if (!channel) throw new NotFoundError('Channel not found');

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: channel.workspaceId, userId } }
      });

      if (!member) throw new ForbiddenError('Access denied');

      // Fetch existing or create one
      let whiteboard = await prisma.whiteboard.findUnique({
        where: { channelId },
        include: {
          objects: true
        }
      });

      if (!whiteboard) {
        whiteboard = await prisma.whiteboard.create({
          data: {
            name: `${channel.name} Whiteboard`,
            workspaceId: channel.workspaceId,
            channelId,
            createdById: userId,
          },
          include: {
            objects: true
          }
        });
      }

      res.status(200).json({
        success: true,
        data: whiteboard
      });
    } catch (error) {
      next(error);
    }
  }

  static async getWhiteboard(req: Request, res: Response, next: NextFunction) {
    try {
      const whiteboardId = req.params.whiteboardId as string;
      const userId = (req as any).user!.userId;

      const whiteboard = await prisma.whiteboard.findUnique({
        where: { id: whiteboardId },
        include: {
          objects: true
        }
      });
      if (!whiteboard) throw new NotFoundError('Whiteboard not found');

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: whiteboard.workspaceId, userId } }
      });
      if (!member) throw new ForbiddenError('Access denied');

      res.status(200).json({
        success: true,
        data: whiteboard
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateWhiteboard(req: Request, res: Response, next: NextFunction) {
    try {
      const whiteboardId = req.params.whiteboardId as string;
      const { name } = req.body;
      const userId = (req as any).user!.userId;

      const whiteboard = await prisma.whiteboard.findUnique({
        where: { id: whiteboardId }
      });
      if (!whiteboard) throw new NotFoundError('Whiteboard not found');

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: whiteboard.workspaceId, userId } }
      });
      if (!member) throw new ForbiddenError('Access denied');

      const updated = await prisma.whiteboard.update({
        where: { id: whiteboardId },
        data: { name }
      });

      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteWhiteboard(req: Request, res: Response, next: NextFunction) {
    try {
      const whiteboardId = req.params.whiteboardId as string;
      const userId = (req as any).user!.userId;

      const whiteboard = await prisma.whiteboard.findUnique({
        where: { id: whiteboardId }
      });
      if (!whiteboard) throw new NotFoundError('Whiteboard not found');

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: whiteboard.workspaceId, userId } }
      });
      
      if (!member) {
        throw new ForbiddenError('Access denied');
      }
      if (member.role === 'MEMBER' || member.role === 'GUEST') {
        if (whiteboard.createdById !== userId) {
          throw new ForbiddenError('Access denied');
        }
      }

      await prisma.whiteboard.delete({
        where: { id: whiteboardId }
      });

      res.status(200).json({
        success: true,
        data: null
      });
    } catch (error) {
      next(error);
    }
  }
}
