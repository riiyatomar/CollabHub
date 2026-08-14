import { Request, Response, NextFunction } from 'express';
import { AiService } from '../services/AiService';
import { ApiResponse } from '../utils/ApiResponse';
import { prisma } from '../config/database';

export class AiController {
  static async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const workspaceId = req.params.workspaceId as string;

      const conversations = await prisma.aiConversation.findMany({
        where: { userId, workspaceId },
        orderBy: { updatedAt: 'desc' },
      });

      res.status(200).json(new ApiResponse(200, conversations, 'Conversations retrieved'));
    } catch (error) {
      next(error);
    }
  }

  static async getConversationMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const conversationId = req.params.conversationId as string;

      const conversation = await prisma.aiConversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });

      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json(new ApiResponse(404, null, 'Conversation not found'));
      }

      res.status(200).json(new ApiResponse(200, conversation.messages, 'Messages retrieved'));
    } catch (error) {
      next(error);
    }
  }

  static async createConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const workspaceId = req.body.workspaceId as string;
      const title = req.body.title as string;

      const conversation = await AiService.createConversation(userId, workspaceId, title);

      res.status(201).json(new ApiResponse(201, conversation, 'Conversation created'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const conversationId = req.params.conversationId as string;

      const conversation = await prisma.aiConversation.findUnique({
        where: { id: conversationId }
      });

      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json(new ApiResponse(404, null, 'Conversation not found'));
      }

      await prisma.aiConversation.delete({ where: { id: conversationId } });

      res.status(200).json(new ApiResponse(200, null, 'Conversation deleted'));
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const conversationId = req.params.conversationId as string;
      const workspaceId = req.body.workspaceId as string;
      const content = req.body.content as string;

      if (!content) {
         return res.status(400).json(new ApiResponse(400, null, 'Content is required'));
      }

      const aiResponse = await AiService.sendMessage(userId, workspaceId, conversationId, content);

      res.status(200).json(new ApiResponse(200, aiResponse, 'Message sent'));
    } catch (error) {
      next(error);
    }
  }

  static async summarizeChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const workspaceId = req.body.workspaceId as string;
      const channelId = req.body.channelId as string;

      const summary = await AiService.summarizeChannel(userId, workspaceId, channelId);

      res.status(200).json(new ApiResponse(200, summary, 'Channel summarized'));
    } catch (error) {
      next(error);
    }
  }
}
