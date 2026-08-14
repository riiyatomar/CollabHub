import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { Permission, hasPermission } from '../constants/permissions';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from './authMiddleware';

/**
 * Middleware to ensure the authenticated user has a specific permission in the workspace.
 */
export const requireWorkspacePermission = (permission: Permission) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.params.workspaceId || req.body.workspaceId;
      
      if (!workspaceId) {
        return res.status(400).json(new ApiResponse(400, null, 'Workspace ID is required for authorization'));
      }

      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));
      }

      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId,
          },
        },
      });

      if (!member) {
        return res.status(403).json(new ApiResponse(403, null, 'You are not a member of this workspace'));
      }

      if (!hasPermission(member.role, permission)) {
        return res.status(403).json(new ApiResponse(403, null, `Forbidden: Requires ${permission} permission`));
      }

      (req as any).workspaceMember = member;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to ensure the authenticated user is at least a member of the workspace.
 */
export const requireWorkspaceMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspaceId;
    
    if (!workspaceId) {
      return res.status(400).json(new ApiResponse(400, null, 'Workspace ID is required'));
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json(new ApiResponse(401, null, 'Unauthorized'));
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(403).json(new ApiResponse(403, null, 'You are not a member of this workspace'));
    }

    (req as any).workspaceMember = member;
    next();
  } catch (error) {
    next(error);
  }
};
