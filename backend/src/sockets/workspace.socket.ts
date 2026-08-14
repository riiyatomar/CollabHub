import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socketAuth';

export const registerWorkspaceHandlers = (io: Server, socket: AuthenticatedSocket) => {
  // const userId = socket.user?.userId;

  socket.on('workspace:join', (workspaceId: string) => {
    socket.join(`workspace:${workspaceId}`);
  });

  socket.on('workspace:leave', (workspaceId: string) => {
    socket.leave(`workspace:${workspaceId}`);
  });

  // e.g., an admin changes someone's role
  socket.on('workspace:role_changed', (data: { workspaceId: string, targetUserId: string, newRole: string }) => {
    // Notify the specific user or the whole workspace
    io.to(`workspace:${data.workspaceId}`).emit('workspace:role_changed', data);
  });
};
