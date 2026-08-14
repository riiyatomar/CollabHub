import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError, ForbiddenError, NotFoundError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

export class CalendarController {
  
  static async getWorkspaceEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId as string;
      const userId = (req as any).user!.userId;

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } }
      });
      if (!member) throw new ForbiddenError('Access denied');

      const events = await prisma.calendarEvent.findMany({
        where: { workspaceId },
        orderBy: { startTime: 'asc' }
      });

      res.status(200).json(new ApiResponse(200, events, 'Calendar events retrieved'));
    } catch (error) {
      next(error);
    }
  }

  static async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = req.params.workspaceId as string;
      const userId = (req as any).user!.userId;
      const { title, description, startTime, endTime, type, entityId, isAllDay } = req.body;

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } }
      });
      if (!member) throw new ForbiddenError('Access denied');
      if (member.role !== 'OWNER' && member.role !== 'ADMIN' && member.role !== 'MODERATOR' && member.role !== 'MEMBER') {
         throw new ForbiddenError('Guests cannot create calendar events');
      }

      const event = await prisma.calendarEvent.create({
        data: {
          workspaceId,
          title,
          description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          type,
          entityId,
          isAllDay
        }
      });

      res.status(201).json(new ApiResponse(201, event, 'Event created'));
    } catch (error) {
      next(error);
    }
  }

  static async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.eventId as string;
      const userId = (req as any).user!.userId;
      const { title, description, startTime, endTime, type, entityId, isAllDay } = req.body;

      const event = await prisma.calendarEvent.findUnique({
        where: { id: eventId }
      });
      if (!event) throw new NotFoundError('Event not found');

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: event.workspaceId, userId } }
      });
      if (!member || (member.role === 'GUEST')) throw new ForbiddenError('Access denied');

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (startTime !== undefined) updateData.startTime = new Date(startTime);
      if (endTime !== undefined) updateData.endTime = new Date(endTime);
      if (type !== undefined) updateData.type = type;
      if (entityId !== undefined) updateData.entityId = entityId;
      if (isAllDay !== undefined) updateData.isAllDay = isAllDay;

      const updatedEvent = await prisma.calendarEvent.update({
        where: { id: eventId },
        data: updateData
      });

      res.status(200).json(new ApiResponse(200, updatedEvent, 'Event updated'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.eventId as string;
      const userId = (req as any).user!.userId;

      const event = await prisma.calendarEvent.findUnique({
        where: { id: eventId }
      });
      if (!event) throw new NotFoundError('Event not found');

      const member = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: event.workspaceId, userId } }
      });
      if (!member || member.role === 'GUEST') throw new ForbiddenError('Access denied');

      await prisma.calendarEvent.delete({
        where: { id: eventId }
      });

      res.status(200).json(new ApiResponse(200, null, 'Event deleted'));
    } catch (error) {
      next(error);
    }
  }
}
