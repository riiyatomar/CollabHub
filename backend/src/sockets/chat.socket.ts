import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socketAuth';
import { prisma } from '../config/database';

export const registerChatHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const userId = socket.user?.userId;

  socket.on('channel:join', async (channelId: string) => {
    socket.join(`channel:${channelId}`);
  });

  socket.on('channel:leave', (channelId: string) => {
    socket.leave(`channel:${channelId}`);
  });

  socket.on('typing:start', ({ channelId }) => {
    if (userId) socket.to(`channel:${channelId}`).emit('typing:start', { userId, channelId });
  });

  socket.on('typing:stop', ({ channelId }) => {
    if (userId) socket.to(`channel:${channelId}`).emit('typing:stop', { userId, channelId });
  });

  socket.on('message:send', async (data: { channelId: string, content: string, replyToId?: string | null, attachmentIds?: string[] }) => {
    try {
      if (!userId) return;

      const message = await prisma.message.create({
        data: {
          channelId: data.channelId,
          senderId: userId,
          content: data.content,
          replyToId: data.replyToId || null,
          ...(data.attachmentIds && data.attachmentIds.length > 0 ? {
            attachments: {
              connect: data.attachmentIds.map((id) => ({ id }))
            }
          } : {})
        },
        include: {
          sender: { select: { id: true, name: true, username: true, avatar: true } },
          replyTo: { select: { id: true, content: true, sender: { select: { username: true } } } },
          reactions: true,
          attachments: true,
          pinnedBy: {
            include: { pinnedBy: { select: { id: true, name: true, username: true, avatar: true } } }
          },
          _count: { select: { replies: true } }
        }
      });

      io.to(`channel:${data.channelId}`).emit('message:new', message);

      // Handle mentions
      const mentionRegex = /@(\w+)/g;
      const mentions = data.content.match(mentionRegex);
      if (mentions) {
        const usernames = mentions.map(m => m.substring(1));
        const usersToNotify = await prisma.user.findMany({ where: { username: { in: usernames } } });
        usersToNotify.forEach(user => {
          // Send real-time notification to the mentioned user if they have a personal room
          io.to(`user:${user.id}`).emit('notification:new', {
            title: `Mention in channel`,
            message: `${message.sender.username} mentioned you: ${data.content.substring(0, 50)}...`,
            link: `/app/${data.channelId}`, // simplified link
            type: 'mention'
          });
        });
      }
    } catch (error) {
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('reaction:add', async ({ messageId, channelId, emoji }) => {
    try {
      if (!userId) return;
      const reaction = await prisma.reaction.create({
        data: { messageId, userId, emoji }
      });
      io.to(`channel:${channelId}`).emit('reaction:add', { messageId, reaction });
    } catch (error) {
      socket.emit('error', 'Failed to add reaction');
    }
  });

  socket.on('reaction:remove', async ({ messageId, channelId, emoji }) => {
    try {
      if (!userId) return;
      await prisma.reaction.delete({
        where: { messageId_userId_emoji: { messageId, userId, emoji } }
      });
      io.to(`channel:${channelId}`).emit('reaction:remove', { messageId, userId, emoji });
    } catch (error) {
      socket.emit('error', 'Failed to remove reaction');
    }
  });

  socket.on('message:edit', async ({ messageId, channelId, content }) => {
    try {
      if (!userId) return;
      const message = await prisma.message.update({
        where: { id: messageId, senderId: userId },
        data: { content, isEdited: true, editedAt: new Date() },
        include: {
          sender: { select: { id: true, name: true, username: true, avatar: true } },
          replyTo: { select: { id: true, content: true, sender: { select: { username: true } } } },
          reactions: true,
          attachments: true,
          pinnedBy: {
            include: { pinnedBy: { select: { id: true, name: true, username: true, avatar: true } } }
          },
          _count: { select: { replies: true } }
        }
      });
      io.to(`channel:${channelId}`).emit('message:edited', message);
    } catch (error) {
      socket.emit('error', 'Failed to edit message');
    }
  });

  socket.on('message:delete', async ({ messageId, channelId }) => {
    try {
      if (!userId) return;
      await prisma.message.update({
        where: { id: messageId, senderId: userId },
        data: { isDeleted: true, content: '', deletedAt: new Date() }
      });
      io.to(`channel:${channelId}`).emit('message:deleted', { messageId });
    } catch (error) {
      socket.emit('error', 'Failed to delete message');
    }
  });

  socket.on('message:pin', async ({ messageId, channelId }) => {
    try {
      if (!userId) return;
      const pinned = await prisma.pinnedMessage.create({
        data: { messageId, channelId, pinnedById: userId },
        include: { pinnedBy: { select: { id: true, name: true, username: true, avatar: true } } }
      });
      io.to(`channel:${channelId}`).emit('message:pinned', { messageId, pinnedBy: pinned.pinnedBy });
    } catch (error) {
      socket.emit('error', 'Failed to pin message');
    }
  });

  socket.on('message:unpin', async ({ messageId, channelId }) => {
    try {
      if (!userId) return;
      await prisma.pinnedMessage.delete({ where: { messageId } });
      io.to(`channel:${channelId}`).emit('message:unpinned', { messageId });
    } catch (error) {
      socket.emit('error', 'Failed to unpin message');
    }
  });

  socket.on('message:read', async ({ channelId, messageId }) => {
    try {
      if (!userId) return;
      await prisma.channelReadState.upsert({
        where: { channelId_userId: { channelId, userId } },
        update: { lastReadMessageId: messageId },
        create: { channelId, userId, lastReadMessageId: messageId }
      });
      io.to(`channel:${channelId}`).emit('message:read', { channelId, userId, messageId });
    } catch (error) {
      socket.emit('error', 'Failed to mark message as read');
    }
  });

  socket.on('message:delivered', async ({ channelId, messageId }) => {
    try {
      if (!userId) return;
      await prisma.channelReadState.upsert({
        where: { channelId_userId: { channelId, userId } },
        update: { lastDeliveredMessageId: messageId },
        create: { channelId, userId, lastDeliveredMessageId: messageId }
      });
      io.to(`channel:${channelId}`).emit('message:delivered', { channelId, userId, messageId });
    } catch (error) {
      // silent fail for delivery
    }
  });
};
