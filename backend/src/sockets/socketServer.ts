import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { socketAuthMiddleware, AuthenticatedSocket } from './socketAuth';
import { registerChatHandlers } from './chat.socket';
import { registerWorkspaceHandlers } from './workspace.socket';
import { registerPresenceHandlers } from './presence.socket';
import { registerNotificationHandlers } from './notification.socket';
import { registerMeetingHandlers } from './meeting.socket';
import { registerScreenHandlers } from './screen.socket';
import { registerWhiteboardHandlers } from './whiteboard.socket';
import { registerNotesHandlers } from './notes.socket';
import { registerWatchHandlers } from './watch.socket';
import { corsConfig } from '../config/cors';

let io: Server;

export const initSocketServer = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: corsConfig.origin,
      credentials: true
    }
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const userId = authSocket.user?.userId;
    
    console.log(`User connected via socket: ${userId} (Socket ID: ${socket.id})`);

    // Register modular handlers
    registerChatHandlers(io, authSocket);
    registerWorkspaceHandlers(io, authSocket);
    registerPresenceHandlers(io, authSocket);
    registerNotificationHandlers(io, authSocket);
    registerMeetingHandlers(io, authSocket);
    registerScreenHandlers(io, authSocket);
    registerWhiteboardHandlers(io, authSocket);
    registerNotesHandlers(io, authSocket);
    registerWatchHandlers(io, authSocket);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId} (Socket ID: ${socket.id})`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
