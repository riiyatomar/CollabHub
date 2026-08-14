import { Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/authMiddleware';

export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));

    const query = req.query.q as string;
    const type = req.query.type as string; // 'all', 'messages', 'files', 'channels', 'members'
    const workspaceId = req.query.workspaceId as string | undefined;

    if (!query || query.trim().length < 2) {
      return res.status(200).json(new ApiResponse(200, {
        messages: [], files: [], channels: [], members: [], tasks: [], calendar: []
      }, 'Search query too short'));
    }

    const searchStr = query.trim();

    // Verify user's accessible workspaces
    const memberWorkspaces = await prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true }
    });
    const accessibleWorkspaceIds = memberWorkspaces.map(m => m.workspaceId);

    // If workspaceId is provided, check if user has access to it
    if (workspaceId && !accessibleWorkspaceIds.includes(workspaceId)) {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied to workspace'));
    }

    const targetWorkspaces = workspaceId ? [workspaceId] : accessibleWorkspaceIds;

    const results: any = { messages: [], files: [], channels: [], members: [], tasks: [], calendar: [] };

    // Search Messages
    if (!type || type === 'all' || type === 'messages') {
      results.messages = await prisma.message.findMany({
        where: {
          content: { contains: searchStr, mode: 'insensitive' },
          channel: { workspaceId: { in: targetWorkspaces } },
          isDeleted: false
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
          channel: { select: { id: true, name: true, workspaceId: true } }
        },
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Search Files
    if (!type || type === 'all' || type === 'files') {
      results.files = await prisma.uploadedFile.findMany({
        where: {
          originalName: { contains: searchStr, mode: 'insensitive' },
          workspaceId: { in: targetWorkspaces }
        },
        include: {
          uploadedBy: { select: { id: true, name: true, avatar: true } }
        },
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Search Channels
    if (!type || type === 'all' || type === 'channels') {
      results.channels = await prisma.channel.findMany({
        where: {
          name: { contains: searchStr, mode: 'insensitive' },
          workspaceId: { in: targetWorkspaces },
          isArchived: false
        },
        take: 10,
        orderBy: { name: 'asc' }
      });
    }

    // Search Members (Users within accessible workspaces)
    if (!type || type === 'all' || type === 'members') {
      results.members = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { username: { contains: searchStr, mode: 'insensitive' } },
            { email: { contains: searchStr, mode: 'insensitive' } }
          ],
          workspaceMembers: {
            some: { workspaceId: { in: targetWorkspaces } }
          },
          isActive: true
        },
        select: { id: true, name: true, username: true, avatar: true },
        take: 10
      });
    }

    // Search Tasks
    if (!type || type === 'all' || type === 'tasks') {
      results.tasks = await prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: searchStr, mode: 'insensitive' } },
            { description: { contains: searchStr, mode: 'insensitive' } }
          ],
          workspaceId: { in: targetWorkspaces }
        },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Search Calendar
    if (!type || type === 'all' || type === 'calendar') {
      results.calendar = await prisma.calendarEvent.findMany({
        where: {
          OR: [
            { title: { contains: searchStr, mode: 'insensitive' } },
            { description: { contains: searchStr, mode: 'insensitive' } }
          ],
          workspaceId: { in: targetWorkspaces }
        },
        take: 10,
        orderBy: { startTime: 'asc' }
      });
    }

    res.status(200).json(new ApiResponse(200, results, 'Search completed successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(500, null, 'Error performing search'));
  }
};
