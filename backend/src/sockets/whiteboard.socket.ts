import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socketAuth';
import { prisma } from '../config/database';

export const registerWhiteboardHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user?.userId;
  if (!userId) return;

  // --- Legacy Meeting Whiteboard Handlers ---
  socket.on('whiteboard:update', async ({ meetingId, data }) => {
    if (meetingId) {
      const roomName = `meeting_${meetingId}`;
      socket.to(roomName).emit('whiteboard:update', { meetingId, data, userId });
      prisma.meetingWhiteboard.upsert({
        where: { meetingId },
        update: { data },
        create: { meetingId, data }
      }).catch(console.error);
    }
  });
  
  socket.on('whiteboard:get', async ({ meetingId }) => {
    if (meetingId) {
      try {
        const whiteboard = await prisma.meetingWhiteboard.findUnique({
          where: { meetingId }
        });
        if (whiteboard) {
          socket.emit('whiteboard:sync', { meetingId, data: whiteboard.data });
        }
      } catch (error) {
        console.error('Error fetching whiteboard', error);
      }
    }
  });

  // --- Phase 4B: Workspace Whiteboard Handlers ---

  socket.on('whiteboard:join', ({ whiteboardId }) => {
    if (whiteboardId) {
      const roomName = `whiteboard_${whiteboardId}`;
      socket.join(roomName);
      // Optional: Broadcast presence
      socket.to(roomName).emit('whiteboard:collaborator:joined', { userId });
    }
  });

  socket.on('whiteboard:leave', ({ whiteboardId }) => {
    if (whiteboardId) {
      const roomName = `whiteboard_${whiteboardId}`;
      socket.leave(roomName);
      socket.to(roomName).emit('whiteboard:collaborator:left', { userId });
    }
  });

  socket.on('whiteboard:cursor:update', ({ whiteboardId, cursor }) => {
    if (whiteboardId) {
      const roomName = `whiteboard_${whiteboardId}`;
      socket.to(roomName).emit('whiteboard:cursor:update', { userId, cursor });
    }
  });

  // Bulk update (from tldraw)
  socket.on('whiteboard:objects:update', async ({ whiteboardId, added, updated, removed }) => {
    if (!whiteboardId) return;
    const roomName = `whiteboard_${whiteboardId}`;

    // Broadcast changes immediately for low latency
    socket.to(roomName).emit('whiteboard:objects:update', { 
      userId, 
      whiteboardId, 
      added, 
      updated, 
      removed 
    });

    // Persist to DB in the background
    try {
      const isTransient = (record: any) => ['instance', 'instance_presence', 'pointer', 'camera', 'user', 'user_document', 'user_presence', 'document', 'page', 'instance_page_state'].includes(record.typeName);

      if (added && Object.values(added).length > 0) {
        const createData = Object.values(added)
          .filter((record: any) => !isTransient(record))
          .map((record: any) => ({
          id: record.id,
          whiteboardId,
          type: record.typeName || 'unknown',
          data: record,
          createdById: userId,
        }));
        await prisma.whiteboardObject.createMany({
          data: createData,
          skipDuplicates: true
        });
      }

      if (updated && Object.values(updated).length > 0) {
        // Tldraw records are keyed by their ID
        const updatePromises = Object.values(updated)
          .filter((record: any) => !isTransient(record))
          .map((record: any) => {
            return prisma.whiteboardObject.updateMany({
              where: { id: record.id, whiteboardId },
              data: {
                data: record,
              updatedAt: new Date()
            }
          });
        });
        await Promise.all(updatePromises);
      }

      if (removed && Object.values(removed).length > 0) {
        const idsToDelete = Object.values(removed)
          .filter((record: any) => !isTransient(record))
          .map((record: any) => record.id);
        
        if (idsToDelete.length > 0) {
          await prisma.whiteboardObject.deleteMany({
            where: {
              id: { in: idsToDelete },
              whiteboardId
            }
          });
        }
      }
    } catch (err) {
      console.error('Error persisting whiteboard objects:', err);
    }
  });

  socket.on('whiteboard:clear', async ({ whiteboardId }) => {
    if (!whiteboardId) return;
    const roomName = `whiteboard_${whiteboardId}`;
    
    // Broadcast clear event
    socket.to(roomName).emit('whiteboard:clear', { userId, whiteboardId });

    try {
      // Check if user has permission (must be in workspace)
      const whiteboard = await prisma.whiteboard.findUnique({
        where: { id: whiteboardId }
      });
      if (!whiteboard) return;

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: whiteboard.workspaceId, userId } }
      });
      if (!member) return;

      // Delete all objects associated with this whiteboard
      await prisma.whiteboardObject.deleteMany({
        where: { whiteboardId }
      });
    } catch (err) {
      console.error('Error clearing whiteboard:', err);
    }
  });
};
