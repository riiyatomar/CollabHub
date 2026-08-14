import { Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/authMiddleware';

export const getWorkspaceInvitations = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;

    const invitations = await prisma.workspaceInvitation.findMany({
      where: { workspaceId },
      include: {
        invitedBy: {
          select: { id: true, name: true, username: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(new ApiResponse(200, invitations, 'Invitations retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error retrieving invitations'));
  }
};

export const revokeInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const invitationId = req.params.invitationId as string;

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation || invitation.workspaceId !== workspaceId) {
      return res.status(404).json(new ApiResponse(404, null, 'Invitation not found'));
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json(new ApiResponse(400, null, 'Only pending invitations can be revoked'));
    }

    await prisma.workspaceInvitation.delete({
      where: { id: invitationId }
    });

    res.status(200).json(new ApiResponse(200, null, 'Invitation revoked successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error revoking invitation'));
  }
};
