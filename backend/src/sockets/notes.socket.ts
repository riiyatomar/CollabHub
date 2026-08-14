import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socketAuth';
import { prisma } from '../config/database';

export const registerNotesHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user?.userId;
  if (!userId) return;

  socket.on('notes:update', async ({ meetingId, content }) => {
    const roomName = `meeting_${meetingId}`;
    // Broadcast to others in the room
    socket.to(roomName).emit('notes:update', { meetingId, content, userId });

    // Persist to database
    prisma.meetingNote.upsert({
      where: { meetingId },
      update: { content },
      create: { meetingId, content }
    }).catch(console.error);
  });

  socket.on('notes:get', async ({ meetingId }) => {
    try {
      const note = await prisma.meetingNote.findUnique({
        where: { meetingId }
      });
      if (note) {
        socket.emit('notes:sync', { meetingId, content: note.content });
      }
    } catch (error) {
      console.error('Error fetching notes', error);
    }
  });
};
