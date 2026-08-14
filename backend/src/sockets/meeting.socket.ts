import { Server, Socket } from 'socket.io';
import { AuthenticatedSocket } from './socketAuth';
import { prisma } from '../config/database';

export const registerMeetingHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user?.userId;
  if (!userId) return;

  socket.on('meeting:join', async ({ meetingId }) => {
    try {
      // Validate meeting exists
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: { participants: true }
      });
      if (!meeting) return;

      const roomName = `meeting_${meetingId}`;
      socket.join(roomName);

      // Save participant if not exists
      const existing = meeting.participants.find(p => p.userId === userId);
      if (!existing) {
        await prisma.meetingParticipant.create({
          data: {
            meetingId,
            userId
          }
        });
      }

      // Notify others in room
      socket.to(roomName).emit('meeting:user-joined', { userId, socketId: socket.id });
    } catch (error) {
      console.error('Error in meeting:join', error);
    }
  });

  socket.on('meeting:leave', async ({ meetingId }) => {
    const roomName = `meeting_${meetingId}`;
    socket.leave(roomName);

    // Broadcast to room
    socket.to(roomName).emit('meeting:user-left', { userId, socketId: socket.id });

    // Update leftAt
    await prisma.meetingParticipant.updateMany({
      where: { meetingId, userId, leftAt: null },
      data: { leftAt: new Date() }
    });
  });

  socket.on('meeting:signal', ({ to, signal, fromUserId }) => {
    // Relays SDP offers, answers, and ICE candidates
    io.to(to).emit('meeting:signal', { signal, fromUserId, socketId: socket.id });
  });

  socket.on('meeting:toggle-media', ({ meetingId, type, isMuted }) => {
    const roomName = `meeting_${meetingId}`;
    socket.to(roomName).emit('meeting:media-toggled', { userId, type, isMuted });
  });

  socket.on('meeting:raise-hand', ({ meetingId, isRaised }) => {
    const roomName = `meeting_${meetingId}`;
    socket.to(roomName).emit('meeting:hand-raised', { userId, isRaised });
  });

  // Host Controls
  socket.on('meeting:kick', async ({ meetingId, targetUserId }) => {
    try {
      const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
      if (meeting?.hostId === userId) {
        const roomName = `meeting_${meetingId}`;
        io.to(roomName).emit('meeting:kicked', { targetUserId });
      }
    } catch (error) {
      console.error('Error kicking user', error);
    }
  });

  socket.on('meeting:force-mute', async ({ meetingId, targetUserId }) => {
    try {
      const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
      if (meeting?.hostId === userId) {
        const roomName = `meeting_${meetingId}`;
        io.to(roomName).emit('meeting:force-muted', { targetUserId });
      }
    } catch (error) {
      console.error('Error force muting user', error);
    }
  });

  socket.on('meeting:end-session', async ({ meetingId }) => {
    try {
      const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
      if (meeting?.hostId === userId) {
        const roomName = `meeting_${meetingId}`;
        io.to(roomName).emit('meeting:ended-by-host');
      }
    } catch (error) {
      console.error('Error ending meeting session', error);
    }
  });

  // Handle disconnect
  socket.on('disconnecting', () => {
    socket.rooms.forEach(room => {
      if (room.startsWith('meeting_')) {
        const meetingId = room.replace('meeting_', '');
        socket.to(room).emit('meeting:user-left', { userId, socketId: socket.id });
        // Fire and forget updating the db
        prisma.meetingParticipant.updateMany({
          where: { meetingId, userId, leftAt: null },
          data: { leftAt: new Date() }
        }).catch(console.error);
      }
    });
  });
};
