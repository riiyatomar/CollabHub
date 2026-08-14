import { Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/authMiddleware';

export const getWorkspaceInsights = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const userId = req.user?.userId;

    if (!workspaceId || !userId) {
      return res.status(400).json(new ApiResponse(400, null, 'Missing workspaceId or userId'));
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });

    if (!member) {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied'));
    }

    const isAdmin = member.role === 'ADMIN' || member.role === 'OWNER';
    
    // Get start of day date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const metrics: any = {};

    // Common Metrics (Member level)
    metrics.messagesToday = await prisma.message.count({
      where: {
        senderId: userId,
        channel: { workspaceId },
        createdAt: { gte: today }
      }
    });

    metrics.filesUploaded = await prisma.uploadedFile.count({
      where: {
        uploadedById: userId,
        workspaceId
      }
    });

    metrics.pendingNotifications = await prisma.notification.count({
      where: {
        receiverId: userId,
        workspaceId,
        isRead: false
      }
    });

    // Admin Metrics
    if (isAdmin) {
      metrics.totalMembers = await prisma.workspaceMember.count({
        where: { workspaceId }
      });

      // Simple proxy for online members (active in last 5 mins)
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      metrics.onlineMembers = await prisma.presence.count({
        where: {
          currentWorkspaceId: workspaceId,
          lastActiveAt: { gte: fiveMinsAgo }
        }
      });

      metrics.activeChannels = await prisma.channel.count({
        where: { workspaceId, isArchived: false }
      });

      const files = await prisma.uploadedFile.aggregate({
        where: { workspaceId },
        _sum: { size: true }
      });
      metrics.storageUsed = files._sum.size || 0;
      
      metrics.totalMessageVolume = await prisma.message.count({
        where: { channel: { workspaceId } }
      });
    }

    res.status(200).json(new ApiResponse(200, metrics, 'Insights retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error retrieving insights'));
  }
};
