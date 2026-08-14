import { Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/authMiddleware';
import { getIO } from '../sockets/socketServer';

export const createChannel = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const { name, description, type } = req.body;

    if (!name) {
      return res.status(400).json(new ApiResponse(400, null, 'Channel name is required'));
    }

    const channel = await prisma.channel.create({
      data: {
        workspaceId,
        name,
        description,
        type: type || 'TEXT',
      }
    });

    getIO().to(workspaceId).emit('channel:created', channel);

    res.status(201).json(new ApiResponse(201, channel, 'Channel created successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error creating channel'));
  }
};

export const getChannels = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;

    const channels = await prisma.channel.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' }
    });

    res.status(200).json(new ApiResponse(200, channels, 'Channels retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error retrieving channels'));
  }
};

export const updateChannel = async (req: AuthRequest, res: Response) => {
  try {
    const channelId = req.params.channelId as string;
    const { name, description, isArchived } = req.body;

    const channel = await prisma.channel.update({
      where: { id: channelId },
      data: { name, description, isArchived },
    });

    res.status(200).json(new ApiResponse(200, channel, 'Channel updated successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error updating channel'));
  }
};

export const deleteChannel = async (req: AuthRequest, res: Response) => {
  try {
    const channelId = req.params.channelId as string;

    await prisma.channel.delete({
      where: { id: channelId },
    });

    res.status(200).json(new ApiResponse(200, null, 'Channel deleted successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error deleting channel'));
  }
};
