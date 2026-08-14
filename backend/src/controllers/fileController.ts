import { Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/authMiddleware';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService';
import crypto from 'crypto';
import path from 'path';

export const uploadFiles = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { workspaceId, channelId } = req.body; // Can be optional depending on context

    if (!userId) {
      return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));
    }

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json(new ApiResponse(400, null, 'No files uploaded'));
    }

    const files = req.files as Express.Multer.File[];
    const uploadedFiles = [];

    for (const file of files) {
      // Calculate checksum
      const hash = crypto.createHash('sha256');
      hash.update(file.buffer);
      const checksum = hash.digest('hex');

      // Upload to Cloudinary
      const folder = workspaceId ? `workspaces/${workspaceId}` : 'general';
      const extension = path.extname(file.originalname).substring(1);
      const result = await uploadToCloudinary(file.buffer, folder, file.originalname);

      // Save to database
      const uploadedFile = await prisma.uploadedFile.create({
        data: {
          publicId: result.public_id,
          filename: result.original_filename || file.originalname,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          extension: extension || result.format || '',
          checksum,
          folder: `collabhub/${folder}`,
          secureUrl: result.secure_url,
          thumbnailUrl: file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') ? cloudinaryThumbnailUrl(result.public_id, file.mimetype.startsWith('video/')) : null,
          uploadedById: userId,
          workspaceId: workspaceId || null,
          channelId: channelId || null,
        }
      });

      uploadedFiles.push(uploadedFile);
    }

    res.status(201).json(new ApiResponse(201, uploadedFiles, 'Files uploaded successfully'));
  } catch (error: any) {
    console.error('Upload Error:', error);
    res.status(500).json(new ApiResponse(500, null, error.message || 'Error uploading files'));
  }
};

const cloudinaryThumbnailUrl = (publicId: string, isVideo: boolean) => {
  // Generate a transformed URL for thumbnails
  const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}`;
  const transformation = 'c_thumb,w_200,h_200';
  if (isVideo) {
    return `${baseUrl}/video/upload/${transformation}/${publicId}.jpg`;
  }
  return `${baseUrl}/image/upload/${transformation}/${publicId}`;
};

export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    const fileId = req.params.fileId as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const file = await prisma.uploadedFile.findUnique({
      where: { id: fileId },
      include: { workspace: { include: { members: true } } }
    }) as any; // Cast as any because workspace is optional relation, Prisma might complain but it works based on schema

    if (!file) {
      return res.status(404).json(new ApiResponse(404, null, 'File not found'));
    }

    // Check permissions (uploader or workspace admin/owner)
    const isUploader = file.uploadedById === userId;
    const isWorkspaceAdmin = file.workspace?.members?.some(
      (m: any) => m.userId === userId && ['ADMIN', 'OWNER'].includes(m.role)
    );

    if (!isUploader && !isWorkspaceAdmin) {
      return res.status(403).json(new ApiResponse(403, null, 'Forbidden'));
    }

    // Determine resource type
    const resourceType = file.mimeType.startsWith('image/') ? 'image' : 
                         file.mimeType.startsWith('video/') || file.mimeType.startsWith('audio/') ? 'video' : 'raw';
    
    // Delete from Cloudinary
    await deleteFromCloudinary(file.publicId, resourceType);

    // Delete from DB
    await prisma.uploadedFile.delete({ where: { id: fileId } });

    res.status(200).json(new ApiResponse(200, null, 'File deleted successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error deleting file'));
  }
};

export const renameFile = async (req: AuthRequest, res: Response) => {
  try {
    const fileId = req.params.fileId as string;
    const { filename } = req.body;
    const userId = req.user?.userId;

    if (!filename) return res.status(400).json(new ApiResponse(400, null, 'Filename is required'));

    const file = await prisma.uploadedFile.findUnique({ where: { id: fileId } });
    if (!file) return res.status(404).json(new ApiResponse(404, null, 'File not found'));

    // Only uploader can rename
    if (file.uploadedById !== userId) {
      return res.status(403).json(new ApiResponse(403, null, 'Forbidden'));
    }

    const updatedFile = await prisma.uploadedFile.update({
      where: { id: fileId },
      data: { filename }
    });

    res.status(200).json(new ApiResponse(200, updatedFile, 'File renamed successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error renaming file'));
  }
};

export const getWorkspaceFiles = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    // Check if user is member
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });

    if (!member) {
      return res.status(403).json(new ApiResponse(403, null, 'Forbidden'));
    }

    const files = await prisma.uploadedFile.findMany({
      where: { workspaceId },
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } },
        channel: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(new ApiResponse(200, files, 'Files retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error retrieving files'));
  }
};

export const getChannelFiles = async (req: AuthRequest, res: Response) => {
  try {
    const channelId = req.params.channelId as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        workspace: {
          include: {
            members: { where: { userId } }
          }
        }
      }
    }) as any;

    if (!channel || !channel.workspace || !channel.workspace.members || channel.workspace.members.length === 0) {
      return res.status(403).json(new ApiResponse(403, null, 'Forbidden'));
    }

    const files = await prisma.uploadedFile.findMany({
      where: { channelId },
      include: {
        uploadedBy: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(new ApiResponse(200, files, 'Channel files retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error retrieving channel files'));
  }
};
