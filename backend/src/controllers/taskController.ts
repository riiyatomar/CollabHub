import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError, ForbiddenError, NotFoundError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

export class TaskController {
  
  static async getWorkspaceTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId as string;
      const userId = (req as any).user!.userId;

      // Check RBAC
      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } }
      });
      if (!member) throw new ForbiddenError('Access denied');

      const tasks = await prisma.task.findMany({
        where: { workspaceId },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          labels: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json(new ApiResponse(200, tasks, 'Tasks retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId as string;
      const userId = (req as any).user!.userId;
      const { title, description, status, priority, dueDate, assigneeId, channelId, messageId, labelIds } = req.body;

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } }
      });
      if (!member) throw new ForbiddenError('Access denied');

      const taskData: any = {
        workspaceId,
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        creatorId: userId,
        assigneeId,
        channelId,
        messageId,
      };
      if (labelIds && labelIds.length > 0) {
        taskData.labels = { connect: labelIds.map((id: string) => ({ id })) };
      }

      const task = await prisma.task.create({
        data: taskData,
        include: {
          creator: { select: { id: true, name: true, avatar: true } },
          assignee: { select: { id: true, name: true, avatar: true } },
          labels: true,
        },
      });

      // Optionally, create a notification for assignee
      if (assigneeId && assigneeId !== userId) {
        await prisma.notification.create({
          data: {
            receiverId: assigneeId,
            senderId: userId,
            title: 'New Task Assigned',
            message: `You were assigned a new task: ${title}`,
            type: 'TASK_ASSIGNED',
            entityId: task.id,
            entityType: 'TASK',
            workspaceId
          }
        });
      }

      res.status(201).json(new ApiResponse(201, task, 'Task created successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = req.params.taskId as string;
      const userId = (req as any).user!.userId;
      const { title, description, status, priority, dueDate, assigneeId, labelIds } = req.body;

      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });
      if (!task) throw new NotFoundError('Task not found');

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: task.workspaceId, userId } }
      });
      if (!member) throw new ForbiddenError('Access denied');

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
      if (labelIds !== undefined) {
        updateData.labels = { set: labelIds.map((id: string) => ({ id })) };
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          creator: { select: { id: true, name: true, avatar: true } },
          assignee: { select: { id: true, name: true, avatar: true } },
          labels: true,
        },
      });

      // Notification if assignee changed
      if (assigneeId && assigneeId !== task.assigneeId && assigneeId !== userId) {
         await prisma.notification.create({
          data: {
            receiverId: assigneeId,
            senderId: userId,
            title: 'Task Assigned to You',
            message: `You were assigned to task: ${updatedTask.title}`,
            type: 'TASK_ASSIGNED',
            entityId: task.id,
            entityType: 'TASK',
            workspaceId: task.workspaceId
          }
        });
      }

      res.status(200).json(new ApiResponse(200, updatedTask, 'Task updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = req.params.taskId as string;
      const userId = (req as any).user!.userId;

      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });
      if (!task) throw new NotFoundError('Task not found');

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: task.workspaceId, userId } }
      });
      
      if (!member) throw new ForbiddenError('Access denied');
      if (member.role === 'MEMBER' || member.role === 'GUEST') {
        if (task.creatorId !== userId) throw new ForbiddenError('Only creator or admin can delete task');
      }

      await prisma.task.delete({
        where: { id: taskId }
      });

      res.status(200).json(new ApiResponse(200, null, 'Task deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
