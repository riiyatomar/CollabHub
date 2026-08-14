import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requireWorkspacePermission, requireWorkspaceMember } from '../middleware/rbacMiddleware';
import { Permissions } from '../constants/permissions';
import { workspaceWhiteboardRouter } from './whiteboardRoutes';
import { workspaceTaskRouter } from './taskRoutes';
import { workspaceCalendarRouter } from './calendarRoutes';
import { workspaceWebhookRouter } from './webhookRoutes';
import { workspaceIntegrationRouter } from './integrationRoutes';

import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  generateInviteLink,
  uploadLogo,
  removeLogo,
  uploadBanner,
  removeBanner,
  transferOwnership
} from '../controllers/workspaceController';

import { uploadMiddleware } from '../middleware/uploadMiddleware';

import {
  createChannel,
  getChannels,
  updateChannel,
  deleteChannel
} from '../controllers/channelController';

import {
  getChannelMessages,
  sendMessage,
  getThreadReplies,
  getLinkPreview
} from '../controllers/messageController';

import {
  getWorkspaceMembers,
  acceptInvitation,
  updateMemberRole,
  moderateMember,
  removeMember
} from '../controllers/memberController';

import {
  getWorkspaceInvitations,
  revokeInvitation
} from '../controllers/invitationController';

import {
  getPinnedChannels,
  pinChannel,
  unpinChannel
} from '../controllers/pinnedItemController';

const router = Router();

// Protect all routes
router.use(authenticate);

// --- Workspace Routes ---
router.post('/', createWorkspace);
router.get('/me', getUserWorkspaces);
router.get('/:workspaceId', requireWorkspaceMember, getWorkspaceById);
router.put('/:workspaceId', requireWorkspacePermission(Permissions.WORKSPACE_UPDATE), updateWorkspace);
router.delete('/:workspaceId', requireWorkspacePermission(Permissions.WORKSPACE_DELETE), deleteWorkspace);

// Invites
router.get('/:workspaceId/invitations', requireWorkspacePermission(Permissions.WORKSPACE_INVITE), getWorkspaceInvitations);
router.post('/:workspaceId/invite', requireWorkspacePermission(Permissions.WORKSPACE_INVITE), generateInviteLink);
router.delete('/:workspaceId/invitations/:invitationId', requireWorkspacePermission(Permissions.WORKSPACE_INVITE), revokeInvitation);

// Logos/Banners
router.post('/:workspaceId/logo', requireWorkspacePermission(Permissions.WORKSPACE_UPDATE), uploadMiddleware.single('logo'), uploadLogo);
router.delete('/:workspaceId/logo', requireWorkspacePermission(Permissions.WORKSPACE_UPDATE), removeLogo);
router.post('/:workspaceId/banner', requireWorkspacePermission(Permissions.WORKSPACE_UPDATE), uploadMiddleware.single('banner'), uploadBanner);
router.delete('/:workspaceId/banner', requireWorkspacePermission(Permissions.WORKSPACE_UPDATE), removeBanner);
router.post('/:workspaceId/transfer-ownership', requireWorkspacePermission(Permissions.WORKSPACE_TRANSFER_OWNERSHIP), transferOwnership);

// Global invite accept route (does not require workspace member check beforehand)
router.post('/invite/:token/accept', acceptInvitation);

// --- Channel Routes ---
router.post('/:workspaceId/channels', requireWorkspacePermission(Permissions.CHANNEL_CREATE), createChannel);
router.get('/:workspaceId/channels', requireWorkspaceMember, getChannels);
router.put('/:workspaceId/channels/:channelId', requireWorkspacePermission(Permissions.CHANNEL_UPDATE), updateChannel);
router.delete('/:workspaceId/channels/:channelId', requireWorkspacePermission(Permissions.CHANNEL_DELETE), deleteChannel);

// Pinned Channels
router.get('/:workspaceId/pinned-channels', requireWorkspaceMember, getPinnedChannels);
router.post('/:workspaceId/channels/:channelId/pin', requireWorkspaceMember, pinChannel);
router.delete('/:workspaceId/channels/:channelId/pin', requireWorkspaceMember, unpinChannel);

// --- Message Routes ---
router.get('/:workspaceId/channels/:channelId/messages', requireWorkspaceMember, getChannelMessages);
router.post('/:workspaceId/channels/:channelId/messages', requireWorkspaceMember, sendMessage);
router.get('/:workspaceId/channels/:channelId/messages/:messageId/thread', requireWorkspaceMember, getThreadReplies);
router.post('/messages/link-preview', getLinkPreview); // Global route, doesn't need workspace perms

// --- Channel Whiteboard Route ---
import { WhiteboardController } from '../controllers/WhiteboardController';
router.get('/:workspaceId/channels/:channelId/whiteboard', requireWorkspaceMember, WhiteboardController.getChannelWhiteboard);

// --- Member Routes ---
router.get('/:workspaceId/members', requireWorkspaceMember, getWorkspaceMembers);
router.put('/:workspaceId/members/:memberId/role', requireWorkspacePermission(Permissions.WORKSPACE_CHANGE_ROLE), updateMemberRole);
router.put('/:workspaceId/members/:memberId/moderate', requireWorkspacePermission(Permissions.WORKSPACE_MODERATE_MEMBER), moderateMember);
router.delete('/:workspaceId/members/:memberId', requireWorkspacePermission(Permissions.WORKSPACE_REMOVE_MEMBER), removeMember);

// --- Whiteboard Routes ---
router.use('/:workspaceId/whiteboards', workspaceWhiteboardRouter);

// --- Task Routes ---
router.use('/:workspaceId/tasks', workspaceTaskRouter);

// --- Calendar Routes ---
router.use('/:workspaceId/calendar', workspaceCalendarRouter);

// --- Webhook Routes ---
router.use('/:workspaceId/webhooks', workspaceWebhookRouter);

// --- Integration Routes ---
router.use('/:workspaceId/integrations', workspaceIntegrationRouter);

export default router;
