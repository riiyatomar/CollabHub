import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socketAuth';

export const registerScreenHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user?.userId;
  if (!userId) return;

  socket.on('screen:start', ({ meetingId }) => {
    const roomName = `meeting_${meetingId}`;
    io.to(roomName).emit('screen:start', { presenterId: userId });
  });

  socket.on('screen:stop', ({ meetingId }) => {
    const roomName = `meeting_${meetingId}`;
    io.to(roomName).emit('screen:stop', { presenterId: userId });
  });

  socket.on('screen:replace', ({ meetingId, targetUserId }) => {
    const roomName = `meeting_${meetingId}`;
    io.to(roomName).emit('screen:replace', { presenterId: userId, targetUserId });
  });

  socket.on('disconnecting', () => {
    socket.rooms.forEach(room => {
      if (room.startsWith('meeting_')) {
        socket.to(room).emit('screen:stop', { presenterId: userId });
      }
    });
  });
};
