import { Server, Socket } from 'socket.io';
import { prisma } from '../config/database';

export const registerWatchHandlers = (io: Server, socket: Socket) => {
  const getRoom = (sessionId: string, channelId?: string, meetingId?: string) => {
    if (channelId) return channelId;
    if (meetingId) return meetingId;
    return `media_session_${sessionId}`;
  };

  const handlePlay = async ({ sessionId, position }: { sessionId: string, position: number }) => {
    try {
      if (!(socket as any).user) return;
      const watchSession = await prisma.watchSession.findUnique({ where: { id: sessionId } });
      if (!watchSession || watchSession.hostId !== (socket as any).user.userId) return;

      await prisma.watchSession.update({
        where: { id: sessionId },
        data: { status: 'PLAYING', playbackPosition: position, updatedAt: new Date() }
      });

      const room = getRoom(sessionId, watchSession.channelId || undefined, watchSession.meetingId || undefined);
      socket.to(room).emit('media:play', { sessionId, position });
    } catch (err) {
      console.error('Error handling media:play:', err);
    }
  };

  const handlePause = async ({ sessionId, position }: { sessionId: string, position: number }) => {
    try {
      if (!(socket as any).user) return;
      const watchSession = await prisma.watchSession.findUnique({ where: { id: sessionId } });
      if (!watchSession || watchSession.hostId !== (socket as any).user.userId) return;

      await prisma.watchSession.update({
        where: { id: sessionId },
        data: { status: 'PAUSED', playbackPosition: position, updatedAt: new Date() }
      });

      const room = getRoom(sessionId, watchSession.channelId || undefined, watchSession.meetingId || undefined);
      socket.to(room).emit('media:pause', { sessionId, position });
    } catch (err) {
      console.error('Error handling media:pause:', err);
    }
  };

  const handleSeek = async ({ sessionId, position }: { sessionId: string, position: number }) => {
    try {
      if (!(socket as any).user) return;
      const watchSession = await prisma.watchSession.findUnique({ where: { id: sessionId } });
      if (!watchSession || watchSession.hostId !== (socket as any).user.userId) return;

      await prisma.watchSession.update({
        where: { id: sessionId },
        data: { playbackPosition: position, updatedAt: new Date() }
      });

      const room = getRoom(sessionId, watchSession.channelId || undefined, watchSession.meetingId || undefined);
      socket.to(room).emit('media:seek', { sessionId, position });
    } catch (err) {
      console.error('Error handling media:seek:', err);
    }
  };

  const handleSync = async ({ sessionId, position, rate, status }: { sessionId: string, position: number, rate: number, status: string }) => {
    try {
      if (!(socket as any).user) return;
      const watchSession = await prisma.watchSession.findUnique({ where: { id: sessionId } });
      if (!watchSession || watchSession.hostId !== (socket as any).user.userId) return;

      const now = new Date();
      if (now.getTime() - watchSession.updatedAt.getTime() > 5000) {
        await prisma.watchSession.update({
          where: { id: sessionId },
          data: { playbackPosition: position, playbackRate: rate, status: status as any, updatedAt: now }
        });
      }

      const room = getRoom(sessionId, watchSession.channelId || undefined, watchSession.meetingId || undefined);
      socket.to(room).emit('media:sync', { sessionId, position, rate, status, timestamp: Date.now() });
    } catch (err) {
      console.error('Error handling media:sync:', err);
    }
  };

  const handleStart = async (session: any) => {
    try {
      const room = getRoom(session.id, session.channelId, session.meetingId);
      socket.to(room).emit('media:session:create', session);
    } catch (err) {
      console.error('Error handling media:session:create:', err);
    }
  };
  
  const handleEnd = async ({ sessionId }: { sessionId: string }) => {
    try {
      const watchSession = await prisma.watchSession.findUnique({ where: { id: sessionId } });
      if (!watchSession) return;
      const room = getRoom(sessionId, watchSession.channelId || undefined, watchSession.meetingId || undefined);
      socket.to(room).emit('media:session:end', { sessionId });
    } catch (err) {
      console.error('Error handling media:session:end:', err);
    }
  };

  socket.on('media:session:create', handleStart);
  socket.on('media:session:end', handleEnd);
  socket.on('media:play', handlePlay);
  socket.on('media:pause', handlePause);
  socket.on('media:seek', handleSeek);
  socket.on('media:sync', handleSync);
};
