import { Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/authMiddleware';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;

    const notifications = await prisma.notification.findMany({
      where: { receiverId: userId, isArchived: false },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true }
        }
      }
    });

    let nextCursor: string | null = null;
    if (notifications.length > limit) {
      const nextItem = notifications.pop();
      nextCursor = nextItem!.id;
    }

    res.status(200).json(new ApiResponse(200, {
      notifications,
      nextCursor
    }, 'Notifications retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error retrieving notifications'));
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = req.params.notificationId as string;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const notification = await prisma.notification.updateMany({
      where: { id: notificationId, receiverId: userId },
      data: { isRead: true, readAt: new Date() }
    });

    if (notification.count === 0) {
      return res.status(404).json(new ApiResponse(404, null, 'Notification not found'));
    }

    res.status(200).json(new ApiResponse(200, null, 'Notification marked as read'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error updating notification'));
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    await prisma.notification.updateMany({
      where: { receiverId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });

    res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error updating notifications'));
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = req.params.notificationId as string;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const notification = await prisma.notification.updateMany({
      where: { id: notificationId, receiverId: userId },
      data: { isArchived: true }
    });

    if (notification.count === 0) {
      return res.status(404).json(new ApiResponse(404, null, 'Notification not found'));
    }

    res.status(200).json(new ApiResponse(200, null, 'Notification deleted successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error deleting notification'));
  }
};
