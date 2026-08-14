import { Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/authMiddleware';

export const createMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const { title, workspaceId, channelId } = req.body;

    if (!title || !workspaceId) {
      return res.status(400).json(new ApiResponse(400, null, 'Title and Workspace ID are required'));
    }

    // Verify user is in workspace
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });

    if (!member) {
      return res.status(403).json(new ApiResponse(403, null, 'Not a member of this workspace'));
    }

    const meeting = await prisma.meeting.create({
      data: {
        title,
        workspaceId,
        channelId: channelId || null,
        hostId: userId,
        status: 'ONGOING',
        startedAt: new Date()
      },
      include: {
        host: {
          select: { id: true, name: true, username: true, avatar: true }
        }
      }
    });

    // Also add the host as a participant immediately
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meeting.id,
        userId: userId
      }
    });

    res.status(201).json(new ApiResponse(201, meeting, 'Meeting created successfully'));
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    res.status(500).json(new ApiResponse(500, null, 'Error creating meeting'));
  }
};

export const getMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const meetingId = req.params.meetingId as string;

    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        host: {
          select: { id: true, name: true, username: true, avatar: true }
        },
        participants: {
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true } }
          }
        },
        channel: { select: { id: true, name: true } },
        watchSession: true
      }
    });

    if (!meeting) {
      return res.status(404).json(new ApiResponse(404, null, 'Meeting not found'));
    }

    // Check workspace membership
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: meeting.workspaceId, userId } }
    });

    if (!member) {
      return res.status(403).json(new ApiResponse(403, null, 'Forbidden'));
    }

    res.status(200).json(new ApiResponse(200, meeting, 'Meeting retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error retrieving meeting'));
  }
};

export const endMeeting = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const meetingId = req.params.meetingId as string;

    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    
    if (!meeting) return res.status(404).json(new ApiResponse(404, null, 'Meeting not found'));

    if (meeting.hostId !== userId) {
      return res.status(403).json(new ApiResponse(403, null, 'Only host can end the meeting'));
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: 'ENDED',
        endedAt: new Date()
      }
    });

    res.status(200).json(new ApiResponse(200, updatedMeeting, 'Meeting ended successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error ending meeting'));
  }
};
