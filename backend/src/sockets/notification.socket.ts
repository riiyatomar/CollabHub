import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socketAuth';
import { prisma } from '../config/database';

export const registerNotificationHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user?.userId;

  socket.on('notification:read', async (
    notificationId: string, 
    callback?: (response: { status: 'ok' | 'error' }) => void
  ) => {
    if (!userId) return;
    try {
      await prisma.notification.updateMany({
        where: { id: notificationId, receiverId: userId },
        data: { isRead: true, readAt: new Date() }
      });
      if (callback) callback({ status: 'ok' });
    } catch (e) {
      console.error(e);
      if (callback) callback({ status: 'error' });
    }
  });

  socket.on('notification:delete', async (
    notificationId: string, 
    callback?: (response: { status: 'ok' | 'error' }) => void
  ) => {
    if (!userId) return;
    try {
      await prisma.notification.updateMany({
        where: { id: notificationId, receiverId: userId },
        data: { isArchived: true }
      });
      if (callback) callback({ status: 'ok' });
    } catch (e) {
      console.error(e);
      if (callback) callback({ status: 'error' });
    }
  });
};
