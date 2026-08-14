import { Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/authMiddleware';

export const getBookmarks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const workspaceId = req.query.workspaceId as string | undefined;

    const bookmarks = await prisma.bookmark.findMany({
      where: { 
        userId,
        ...(workspaceId ? { workspaceId } : {})
      },
      orderBy: { createdAt: 'desc' },
      include: {
        message: {
          include: { sender: { select: { id: true, name: true, avatar: true } } }
        },
        channel: true,
        file: true
      }
    });

    res.status(200).json(new ApiResponse(200, bookmarks, 'Bookmarks retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error retrieving bookmarks'));
  }
};

export const createBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const { messageId, channelId, fileId, workspaceId, category, note } = req.body;

    if (!messageId && !channelId && !fileId) {
      return res.status(400).json(new ApiResponse(400, null, 'Must provide messageId, channelId, or fileId'));
    }

    // Check if already bookmarked
    const existing = await prisma.bookmark.findFirst({
      where: {
        userId,
        messageId: messageId || undefined,
        channelId: channelId || undefined,
        fileId: fileId || undefined
      }
    });

    if (existing) {
      return res.status(400).json(new ApiResponse(400, null, 'Item is already bookmarked'));
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: userId!,
        messageId,
        channelId,
        fileId,
        workspaceId,
        category,
        note
      },
      include: {
        message: true,
        channel: true,
        file: true
      }
    });

    res.status(201).json(new ApiResponse(201, bookmark, 'Bookmark created successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error creating bookmark'));
  }
};

export const deleteBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const bookmarkId = req.params.bookmarkId as string;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const bookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId }
    });

    if (!bookmark) {
      return res.status(404).json(new ApiResponse(404, null, 'Bookmark not found'));
    }

    if (bookmark.userId !== userId) {
      return res.status(403).json(new ApiResponse(403, null, 'Not authorized to delete this bookmark'));
    }

    await prisma.bookmark.delete({
      where: { id: bookmarkId }
    });

    res.status(200).json(new ApiResponse(200, null, 'Bookmark deleted successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error deleting bookmark'));
  }
};
