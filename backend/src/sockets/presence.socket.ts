import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socketAuth';
import { prisma } from '../config/database';

export const registerPresenceHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user?.userId;

  if (userId) {
    // When a user connects, mark them online
    prisma.presence.upsert({
      where: { userId },
      update: { status: 'ONLINE', lastSeen: new Date(), lastActiveAt: new Date() },
      create: { userId, status: 'ONLINE', lastActiveAt: new Date() }
    }).then(() => {
      // Broadcast to all (or specific workspaces they are in)
      io.emit('presence:update', { userId, status: 'ONLINE' });
    }).catch(console.error);

    socket.on('disconnect', () => {
      // Mark offline
      prisma.presence.update({
        where: { userId },
        data: { status: 'OFFLINE', lastSeen: new Date() }
      }).then(() => {
        io.emit('presence:update', { userId, status: 'OFFLINE' });
      }).catch(console.error);
    });
  }

  socket.on('presence:set', async (
    data: { status: 'ONLINE' | 'AWAY' | 'DO_NOT_DISTURB', currentWorkspaceId?: string, currentChannelId?: string }, 
    callback?: (response: { status: 'ok' | 'error' }) => void
  ) => {
    if (!userId) return;
    
    try {
      const updateData: any = { 
        status: data.status, 
        lastSeen: new Date(),
        lastActiveAt: new Date()
      };
      
      if (data.currentWorkspaceId !== undefined) {
        updateData.currentWorkspaceId = data.currentWorkspaceId;
      }
      if (data.currentChannelId !== undefined) {
        updateData.currentChannelId = data.currentChannelId;
      }

      await prisma.presence.update({
        where: { userId },
        data: updateData
      });
      io.emit('presence:update', { userId, status: data.status, lastActiveAt: updateData.lastActiveAt });
      
      if (callback) callback({ status: 'ok' });
    } catch (error) {
      console.error('Failed to update presence', error);
      if (callback) callback({ status: 'error' });
    }
  });
};
