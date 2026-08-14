import { Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/authMiddleware';
import crypto from 'crypto';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService';

export const createWorkspace = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, visibility } = req.body;
    const userId = req.user?.userId;

    if (!name || !userId) {
      return res.status(400).json(new ApiResponse(400, null, 'Name is required'));
    }

    // Auto-generate unique slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let counter = 1;
    
    while (await prisma.workspace.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        description,
        visibility: visibility || 'PRIVATE',
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          }
        },
        channels: {
          create: {
            name: 'general',
            description: 'General discussion',
            type: 'GENERAL'
          }
        }
      },
      include: {
        members: true,
        channels: true,
      }
    });

    res.status(201).json(new ApiResponse(201, workspace, 'Workspace created successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, error.message || 'Error creating workspace'));
  }
};

export const getUserWorkspaces = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId
          }
        }
      },
      include: {
        members: {
          where: { userId },
          select: { role: true }
        }
      }
    });

    res.status(200).json(new ApiResponse(200, workspaces, 'Workspaces retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error retrieving workspaces'));
  }
};

export const getWorkspaceById = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        channels: true,
        members: {
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar: true, presence: true }
            }
          }
        }
      }
    });

    if (!workspace) {
      return res.status(404).json(new ApiResponse(404, null, 'Workspace not found'));
    }

    res.status(200).json(new ApiResponse(200, workspace, 'Workspace retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error retrieving workspace'));
  }
};

export const updateWorkspace = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const { name, description, logo, visibility, isArchived } = req.body;

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { name, description, logo, visibility, isArchived },
    });

    res.status(200).json(new ApiResponse(200, workspace, 'Workspace updated successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error updating workspace'));
  }
};

export const deleteWorkspace = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;

    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    res.status(200).json(new ApiResponse(200, null, 'Workspace deleted successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error deleting workspace'));
  }
};

export const generateInviteLink = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const { email, role } = req.body;
    const userId = req.user?.userId;

    if (!userId || !email) {
      return res.status(400).json(new ApiResponse(400, null, 'Email is required'));
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email,
        token,
        role: role || 'MEMBER',
        invitedById: userId,
        expiresAt,
      }
    });

    // In a real app, send an email here
    const inviteLink = `http://localhost:5173/invite/${token}`;

    res.status(201).json(new ApiResponse(201, { inviteLink, invitation }, 'Invite link generated'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error generating invite link'));
  }
};

export const uploadLogo = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    if (!req.file) {
      return res.status(400).json(new ApiResponse(400, null, 'No file provided'));
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return res.status(403).json(new ApiResponse(403, null, 'Forbidden'));
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (workspace?.logo) {
      const parts = workspace.logo.split('/');
      const fileWithExt = parts[parts.length - 1];
      if (fileWithExt) {
        const publicId = fileWithExt.split('.')[0];
        await deleteFromCloudinary(`collabhub/workspaces/${workspaceId}/logo/${publicId}`, 'image');
      }
    }

    const result = await uploadToCloudinary(req.file.buffer, `workspaces/${workspaceId}/logo`, req.file.originalname);

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { logo: result.secure_url },
    });

    res.status(200).json(new ApiResponse(200, updatedWorkspace, 'Logo uploaded successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error uploading logo'));
  }
};

export const removeLogo = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return res.status(403).json(new ApiResponse(403, null, 'Forbidden'));
    }
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    
    if (workspace?.logo) {
      const parts = workspace.logo.split('/');
      const fileWithExt = parts[parts.length - 1];
      if (fileWithExt) {
        const publicId = fileWithExt.split('.')[0];
        await deleteFromCloudinary(`collabhub/workspaces/${workspaceId}/logo/${publicId}`, 'image');
      }
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { logo: null },
    });

    res.status(200).json(new ApiResponse(200, updatedWorkspace, 'Logo removed successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error removing logo'));
  }
};

export const uploadBanner = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return res.status(403).json(new ApiResponse(403, null, 'Forbidden'));
    }

    if (!req.file) {
      return res.status(400).json(new ApiResponse(400, null, 'No file provided'));
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (workspace?.banner) {
      const parts = workspace.banner.split('/');
      const fileWithExt = parts[parts.length - 1];
      if (fileWithExt) {
        const publicId = fileWithExt.split('.')[0];
        await deleteFromCloudinary(`collabhub/workspaces/${workspaceId}/banner/${publicId}`, 'image');
      }
    }

    const result = await uploadToCloudinary(req.file.buffer, `workspaces/${workspaceId}/banner`, req.file.originalname);

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { banner: result.secure_url },
    });

    res.status(200).json(new ApiResponse(200, updatedWorkspace, 'Banner uploaded successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error uploading banner'));
  }
};

export const removeBanner = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return res.status(403).json(new ApiResponse(403, null, 'Forbidden'));
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    
    if (workspace?.banner) {
      const parts = workspace.banner.split('/');
      const fileWithExt = parts[parts.length - 1];
      if (fileWithExt) {
        const publicId = fileWithExt.split('.')[0];
        await deleteFromCloudinary(`collabhub/workspaces/${workspaceId}/banner/${publicId}`, 'image');
      }
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { banner: null },
    });

    res.status(200).json(new ApiResponse(200, updatedWorkspace, 'Banner removed successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error removing banner'));
  }
};

export const transferOwnership = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const userId = req.user?.userId;
    const { newOwnerId } = req.body;

    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) return res.status(404).json(new ApiResponse(404, null, 'Workspace not found'));

    if (workspace.ownerId !== userId) {
      return res.status(403).json(new ApiResponse(403, null, 'Only the owner can transfer ownership'));
    }

    const newOwnerMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: newOwnerId } }
    });

    if (!newOwnerMember) {
      return res.status(400).json(new ApiResponse(400, null, 'New owner must be a member of the workspace'));
    }

    await prisma.$transaction([
      prisma.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId } },
        data: { role: 'ADMIN' }
      }),
      prisma.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId: newOwnerId } },
        data: { role: 'OWNER' }
      }),
      prisma.workspace.update({
        where: { id: workspaceId },
        data: { ownerId: newOwnerId }
      })
    ]);

    res.status(200).json(new ApiResponse(200, null, 'Ownership transferred successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error transferring ownership'));
  }
};
