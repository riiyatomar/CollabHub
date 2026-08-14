import { Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/authMiddleware';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { LinkPreviewService } from '../services/linkPreviewService';

export const getChannelMessages = async (req: AuthRequest, res: Response) => {
  try {
    const channelId = req.params.channelId as string;
    const cursor = req.query.cursor as string | undefined;
    const limit = parseInt(req.query.limit as string) || 25;

    const messages = await prisma.message.findMany({
      where: { channelId },
      take: limit + 1, // Fetch one extra to know if there are more
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), // Skip the cursor itself
      orderBy: { createdAt: 'desc' }, // Get newest first
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true }
        },
        replyTo: {
          select: { id: true, content: true, sender: { select: { username: true } } }
        },
        reactions: true,
        pinnedBy: {
          include: { pinnedBy: { select: { id: true, name: true, username: true, avatar: true } } }
        },
        attachments: true,
        _count: { select: { replies: true } }
      }
    });

    let nextCursor: string | null = null;
    if (messages.length > limit) {
      const nextItem = messages.pop(); // Remove the extra item
      nextCursor = nextItem!.id;
    }

    res.status(200).json(new ApiResponse(200, {
      messages: messages.reverse(), // Reverse so they are ordered old to new in the UI
      nextCursor
    }, 'Messages retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error retrieving messages'));
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const channelId = req.params.channelId as string;
    const { content, replyToId, attachmentIds } = req.body;
    const userId = req.user?.userId;

    if ((!content && (!attachmentIds || attachmentIds.length === 0)) || !userId) {
      return res.status(400).json(new ApiResponse(400, null, 'Content or attachments are required'));
    }

    const message = await prisma.message.create({
      data: {
        channelId,
        senderId: userId,
        content: content || '',
        replyToId,
        ...(attachmentIds && attachmentIds.length > 0 ? {
          attachments: {
            connect: attachmentIds.map((id: string) => ({ id }))
          }
        } : {})
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true }
        },
        replyTo: {
          select: { id: true, content: true, sender: { select: { username: true } } }
        },
        reactions: true,
        pinnedBy: {
          include: { pinnedBy: { select: { id: true, name: true, username: true, avatar: true } } }
        },
        attachments: true,
        _count: { select: { replies: true } }
      }
    });

    res.status(201).json(new ApiResponse(201, message, 'Message sent successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error sending message'));
  }
};

export const getThreadReplies = async (req: AuthRequest, res: Response) => {
  try {
    const channelId = req.params.channelId as string;
    const messageId = req.params.messageId as string;
    const limit = parseInt(req.query.limit as string) || 50;

    const replies = await prisma.message.findMany({
      where: { channelId, replyToId: messageId },
      orderBy: { createdAt: 'asc' }, // Get oldest first for threads
      take: limit,
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true }
        },
        reactions: true,
        attachments: true
      }
    });

    res.status(200).json(new ApiResponse(200, replies, 'Thread replies retrieved successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error retrieving thread replies'));
  }
};

export const getLinkPreview = async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json(new ApiResponse(400, null, 'URL is required'));
    }

    const preview = await LinkPreviewService.getPreview(url);
    if (!preview) {
      return res.status(400).json(new ApiResponse(400, null, 'Failed to generate link preview'));
    }

    res.status(200).json(new ApiResponse(200, preview, 'Link preview generated'));
  } catch (error: any) {
    // Return a 200 with null preview if the URL can't be fetched, rather than a 500
    // so the frontend doesn't crash or show error toasts for bad links
    res.status(200).json(new ApiResponse(200, null, 'Link preview could not be generated'));
  }
};
