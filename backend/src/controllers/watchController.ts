import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';

const createSessionSchema = z.object({
  mediaUrl: z.string().url('Invalid media URL'),
  channelId: z.string().optional(),
  workspaceId: z.string(),
});

export const createWatchSession = asyncHandler(async (req: any, res: Response) => {
  const { mediaUrl, channelId, workspaceId } = createSessionSchema.parse(req.body);
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  // Verify workspace membership
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } }
  });

  if (!member) {
    throw new ApiError(403, 'You are not a member of this workspace');
  }

  // If channel is provided, verify channel access
  if (channelId) {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel || channel.workspaceId !== workspaceId) {
      throw new ApiError(404, 'Channel not found in this workspace');
    }
    
    // Check if session already exists for this channel
    const existingSession = await prisma.watchSession.findFirst({
       where: { channelId }
    });

    if (existingSession) {
      const updatedSession = await prisma.watchSession.update({
        where: { id: existingSession.id },
        data: {
          mediaUrl,
          hostId: userId,
          status: 'IDLE',
          playbackPosition: 0,
          playbackRate: 1
        }
      });
      return res.status(200).json(new ApiResponse(200, updatedSession, 'Watch session updated'));
    }
  }

  // Create new session
  const watchSession = await prisma.watchSession.create({
    data: {
      channelId: channelId || null,
      workspaceId,
      mediaUrl,
      hostId: userId,
      status: 'IDLE',
      playbackPosition: 0,
      playbackRate: 1,
    }
  });

  res.status(201).json(new ApiResponse(201, watchSession, 'Watch session created'));
});

export const getWatchSession = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) throw new ApiError(401, 'Unauthorized');

  const watchSession = await prisma.watchSession.findUnique({
    where: { id }
  });

  if (!watchSession) {
    throw new ApiError(404, 'Watch session not found');
  }

  // Verify access
  if (watchSession.workspaceId) {
     const member = await prisma.workspaceMember.findUnique({
       where: { workspaceId_userId: { workspaceId: watchSession.workspaceId, userId } }
     });
     if (!member) throw new ApiError(403, 'Access denied');
  }

  res.status(200).json(new ApiResponse(200, watchSession, 'Watch session retrieved'));
});

export const getChannelWatchSession = asyncHandler(async (req: any, res: Response) => {
  const { channelId } = req.params;
  const userId = req.user?.userId;

  if (!userId) throw new ApiError(401, 'Unauthorized');

  const watchSession = await prisma.watchSession.findFirst({
    where: { channelId }
  });

  if (!watchSession) {
    return res.status(200).json(new ApiResponse(200, null, 'No active watch session'));
  }

  res.status(200).json(new ApiResponse(200, watchSession, 'Watch session retrieved'));
});

export const updateWatchSession = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { status, playbackPosition, playbackRate } = req.body;
  const userId = req.user?.userId;

  if (!userId) throw new ApiError(401, 'Unauthorized');

  const watchSession = await prisma.watchSession.findUnique({
    where: { id }
  });

  if (!watchSession) throw new ApiError(404, 'Watch session not found');
  if (watchSession.hostId !== userId) throw new ApiError(403, 'Only the host can update the watch session');

  const updated = await prisma.watchSession.update({
    where: { id },
    data: {
      status: status !== undefined ? status : watchSession.status,
      playbackPosition: playbackPosition !== undefined ? playbackPosition : watchSession.playbackPosition,
      playbackRate: playbackRate !== undefined ? playbackRate : watchSession.playbackRate
    }
  });

  res.status(200).json(new ApiResponse(200, updated, 'Watch session updated'));
});

export const endWatchSession = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) throw new ApiError(401, 'Unauthorized');

  const watchSession = await prisma.watchSession.findUnique({
    where: { id }
  });

  if (!watchSession) {
    throw new ApiError(404, 'Watch session not found');
  }

  if (watchSession.hostId !== userId) {
    throw new ApiError(403, 'Only the host can end the watch session');
  }

  await prisma.watchSession.delete({
    where: { id }
  });

  res.status(200).json(new ApiResponse(200, null, 'Watch session ended'));
});
