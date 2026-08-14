import { Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/authMiddleware';

export const getWorkspaceMembers = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true, presence: true }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });

    res.status(200).json(new ApiResponse(200, members, 'Members retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error retrieving members'));
  }
};

export const acceptInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.params.token as string;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));
    }

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token }
    });

    if (!invitation || invitation.status !== 'PENDING') {
      return res.status(400).json(new ApiResponse(400, null, 'Invalid or expired invitation'));
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json(new ApiResponse(400, null, 'Invitation expired'));
    }

    // Add to workspace
    await prisma.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId,
        role: invitation.role
      }
    });

    // Update invitation status
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    });

    res.status(200).json(new ApiResponse(200, { workspaceId: invitation.workspaceId }, 'Invitation accepted'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error accepting invitation'));
  }
};

export const updateMemberRole = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const memberId = req.params.memberId as string;
    const { role } = req.body;

    // memberId here is the userId of the member to update
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: memberId } }
    });

    if (!member) {
      return res.status(404).json(new ApiResponse(404, null, 'Member not found'));
    }

    if (member.role === 'OWNER') {
      return res.status(400).json(new ApiResponse(400, null, 'Cannot change role of the owner'));
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: memberId } },
      data: { role }
    });

    res.status(200).json(new ApiResponse(200, updatedMember, 'Member role updated'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error updating member role'));
  }
};

export const moderateMember = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const memberId = req.params.memberId as string;
    const { isMuted, isSuspended, isBanned } = req.body;

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: memberId } }
    });

    if (!member) {
      return res.status(404).json(new ApiResponse(404, null, 'Member not found'));
    }

    if (member.role === 'OWNER') {
      return res.status(400).json(new ApiResponse(400, null, 'Cannot moderate the owner'));
    }

    const data: any = {};
    if (isMuted !== undefined) data.isMuted = isMuted;
    if (isSuspended !== undefined) data.isSuspended = isSuspended;
    if (isBanned !== undefined) data.isBanned = isBanned;

    const updatedMember = await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId: memberId } },
      data
    });

    res.status(200).json(new ApiResponse(200, updatedMember, 'Member moderation updated'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error moderating member'));
  }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const memberId = req.params.memberId as string;

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: memberId } }
    });

    if (!member) {
      return res.status(404).json(new ApiResponse(404, null, 'Member not found'));
    }

    if (member.role === 'OWNER') {
      return res.status(400).json(new ApiResponse(400, null, 'Cannot remove the owner'));
    }

    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId: memberId } }
    });

    res.status(200).json(new ApiResponse(200, null, 'Member removed'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error removing member'));
  }
};
