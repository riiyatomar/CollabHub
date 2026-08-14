import { Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/authMiddleware';

export const getWorkspaceActivity = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;

    // Check RBAC - mostly admins/owners should see this, but depending on requirements, members might see basic activity.
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });

    if (!member) {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied'));
    }

    const activities = await prisma.activityLog.findMany({
      where: { workspaceId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true }
        },
        channel: {
          select: { id: true, name: true, type: true }
        }
      }
    });

    let nextCursor: string | null = null;
    if (activities.length > limit) {
      const nextItem = activities.pop();
      nextCursor = nextItem!.id;
    }

    res.status(200).json(new ApiResponse(200, {
      activities,
      nextCursor
    }, 'Activity log retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error retrieving activity log'));
  }
};
