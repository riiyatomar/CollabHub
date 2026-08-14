import { Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/authMiddleware';

export const getPinnedChannels = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const workspaceId = req.params.workspaceId as string;

    const pinnedChannels = await prisma.pinnedChannel.findMany({
      where: {
        pinnedById: userId,
        channel: { workspaceId }
      },
      include: {
        channel: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(new ApiResponse(200, pinnedChannels, 'Pinned channels retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error retrieving pinned channels'));
  }
};

export const pinChannel = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const channelId = req.params.channelId as string;

    // Check if already pinned
    const existing = await prisma.pinnedChannel.findUnique({
      where: {
        channelId_pinnedById: {
          channelId,
          pinnedById: userId
        }
      }
    });

    if (existing) {
      return res.status(400).json(new ApiResponse(400, null, 'Channel is already pinned'));
    }

    const pinnedChannel = await prisma.pinnedChannel.create({
      data: {
        channelId,
        pinnedById: userId
      },
      include: {
        channel: true
      }
    });

    res.status(201).json(new ApiResponse(201, pinnedChannel, 'Channel pinned successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error pinning channel'));
  }
};

export const unpinChannel = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const channelId = req.params.channelId as string;

    const existing = await prisma.pinnedChannel.findUnique({
      where: {
        channelId_pinnedById: {
          channelId,
          pinnedById: userId
        }
      }
    });

    if (!existing) {
      return res.status(404).json(new ApiResponse(404, null, 'Pinned channel not found'));
    }

    await prisma.pinnedChannel.delete({
      where: { id: existing.id }
    });

    res.status(200).json(new ApiResponse(200, null, 'Channel unpinned successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error unpinning channel'));
  }
};
