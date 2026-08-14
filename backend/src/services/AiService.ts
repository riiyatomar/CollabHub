import { GoogleGenAI, Type } from '@google/genai';
import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, ServiceUnavailableError } from '../utils/ApiError';
import { AiMessageRole } from '@prisma/client';

const MODEL_NAME = 'gemini-3.5-flash';

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.GOOGLE_API_KEY || '';
  return {
    client: new GoogleGenAI({ apiKey: apiKey }),
    apiKey,
  };
}

const aiTools = {
  functionDeclarations: [
    {
      name: 'get_tasks',
      description: 'Get tasks assigned to users in the current workspace.',
    },
    {
      name: 'create_task',
      description: 'Create a new task in the current workspace.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Title of the task' },
          description: { type: Type.STRING, description: 'Optional description of the task' }
        },
        required: ['title']
      }
    },
    {
      name: 'delete_task',
      description: 'Delete a specific task by ID. DO NOT use this tool unless explicitly confirmed by the user.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          taskId: { type: Type.STRING, description: 'The ID of the task to delete' }
        },
        required: ['taskId']
      }
    },
    {
      name: 'get_workspace_members',
      description: 'Get a list of members in the current workspace.',
    },
    {
      name: 'get_channels',
      description: 'Get a list of channels in the current workspace.',
    },
    {
      name: 'get_recent_messages',
      description: 'Get recent messages from a specific channel.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          channelId: { type: Type.STRING, description: 'The ID of the channel' }
        },
        required: ['channelId']
      }
    },
    {
      name: 'get_files',
      description: 'Get a list of files in the current workspace.',
    },
    {
      name: 'get_media_sessions',
      description: 'Get active CollabHub Media Sessions (Watch Together / WatchSession) in the workspace.',
    }
  ]
};

async function executeAiTool(name: string, args: any, userId: string, workspaceId: string) {
  try {
    switch (name) {
      case 'get_tasks': {
        const tasks = await prisma.task.findMany({ where: { workspaceId }, orderBy: { updatedAt: 'desc' }, take: 20 });
        return { tasks };
      }
      case 'create_task': {
        const task = await prisma.task.create({
          data: {
            workspaceId,
            creatorId: userId,
            title: args.title,
            description: args.description || '',
          }
        });
        return { success: true, task };
      }
      case 'delete_task': {
        return { error: 'Delete task operation is currently disabled in this phase.' };
      }
      case 'get_workspace_members': {
        const members = await prisma.workspaceMember.findMany({
          where: { workspaceId },
          include: { user: { select: { id: true, name: true, username: true } } }
        });
        return { members: members.map(m => ({ id: m.user.id, name: m.user.name, username: m.user.username, role: m.role })) };
      }
      case 'get_channels': {
        const channels = await prisma.channel.findMany({ where: { workspaceId }});
        return { channels };
      }
      case 'get_recent_messages': {
        const channel = await prisma.channel.findUnique({ where: { id: args.channelId }});
        if (!channel || channel.workspaceId !== workspaceId) return { error: 'Channel not found or permission denied' };
        
        // Removed invalid isPrivate check

        const messages = await prisma.message.findMany({
          where: { channelId: args.channelId, isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { sender: { select: { name: true, username: true } } }
        });
        return { messages: messages.reverse().map(m => ({ sender: m.sender.name || m.sender.username, content: m.content, createdAt: m.createdAt })) };
      }
      case 'get_files': {
        const files = await prisma.uploadedFile.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' }, take: 20 });
        return { files };
      }
      case 'get_media_sessions': {
        const sessions = await prisma.watchSession.findMany({
          where: { meeting: { workspaceId } },
          include: { host: { select: { name: true, username: true } } }
        });
        return { activeSessions: sessions.map(s => ({ id: s.id, status: s.status, mediaUrl: s.mediaUrl, host: s.host.name || s.host.username })) };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export class AiService {
  static async createConversation(userId: string, workspaceId: string, title?: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenError('Not a member of this workspace');

    return await prisma.aiConversation.create({
      data: {
        userId,
        workspaceId,
        title: title || 'New Conversation',
      },
    });
  }

  static async sendMessage(userId: string, workspaceId: string, conversationId: string, content: string) {
    const conversation = await prisma.aiConversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) throw new NotFoundError('Conversation not found');
    if (conversation.userId !== userId || conversation.workspaceId !== workspaceId) {
      throw new ForbiddenError('Unauthorized access to conversation');
    }

    const { client, apiKey } = getAiClient();
    if (!apiKey || apiKey === 'mock-key' || apiKey === 'your_ai_api_key_here') {
      throw new ServiceUnavailableError('AI Assistant is currently unavailable. Please configure the AI provider.');
    }

    await prisma.aiMessage.create({
      data: {
        conversationId,
        role: AiMessageRole.USER,
        content,
      },
    });

    const systemPrompt = `You are CollabHub AI Assistant.
You operate exclusively within the CollabHub collaboration platform.
Your domain includes:
- Workspaces, Channels, Members, Messages, Files, Tasks, Notifications, Activity, Meetings, Whiteboard, Shared Media Sessions / Watch Together

You must use available CollabHub tools to retrieve factual workspace information.
Never invent workspace data, users, tasks, messages, files, IDs, dates, permissions, or activity.
If information cannot be obtained from an authorized CollabHub tool, say that you do not have that information.

CollabHub 'Media Session', 'Watch Together', 'Watch Session', and synchronized media playback refer to CollabHub's shared-media functionality.
They do NOT refer to Android MediaSession, JNI, C++, Android NDK, or MediaSessionCompat unless the user explicitly asks about those technologies.

You are helping user ID ${userId} in workspace ${workspaceId}.`;

    const chat = client.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemPrompt,
        tools: [aiTools]
      }
    });

    let fullPrompt = "";
    for (const msg of conversation.messages) {
       fullPrompt += `${msg.role}: ${msg.content}\n`;
    }
    fullPrompt += `USER: ${content}\n`;

    let responseText = 'Sorry, I am unable to respond at this time.';

    try {
      let response = await chat.sendMessage({ message: fullPrompt });
      
      let iters = 0;
      while (response.functionCalls && response.functionCalls.length > 0 && iters < 5) {
        iters++;
        const call = response.functionCalls[0];
        if (!call || !call.name) break;
        const result = await executeAiTool(call.name, call.args as Record<string, any>, userId, workspaceId);
        response = await chat.sendMessage([{
          functionResponse: {
            name: call.name,
            response: result
          }
        }] as any);
      }
      
      responseText = response.text || responseText;
    } catch (err) {
      console.error("AI API Error:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new ServiceUnavailableError(`Failed to communicate with AI API: ${errorMsg}`);
    }

    const aiMsg = await prisma.aiMessage.create({
      data: {
        conversationId,
        role: AiMessageRole.MODEL,
        content: responseText,
      },
    });

    return aiMsg;
  }

  static async summarizeChannel(userId: string, workspaceId: string, channelId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenError('Not a member of this workspace');

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!channel || channel.workspaceId !== workspaceId) throw new NotFoundError('Channel not found');

    const messages = await prisma.message.findMany({
      where: { channelId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { sender: { select: { name: true, username: true } } }
    });

    const formattedMessages = messages.reverse().map(m => `${m.sender.name || m.sender.username}: ${m.content}`).join('\n');

    const { client, apiKey } = getAiClient();
    if (!apiKey || apiKey === 'mock-key' || apiKey === 'your_ai_api_key_here') {
      throw new ServiceUnavailableError('AI Assistant is currently unavailable. Please configure the AI provider.');
    }

    const response = await client.models.generateContent({
      model: MODEL_NAME,
      contents: `Summarize the following recent channel chat history:\n\n${formattedMessages}`
    });

    return { summary: response.text };
  }

  static async extractTasksFromMessage(content: string): Promise<string[]> {
    const { client, apiKey } = getAiClient();
    if (!apiKey || apiKey === 'mock-key' || apiKey === 'your_ai_api_key_here') {
      throw new ServiceUnavailableError('AI Assistant is currently unavailable. Please configure the AI provider.');
    }
    
    try {
      const response = await client.models.generateContent({
        model: MODEL_NAME,
        contents: `Extract action items or tasks from the following message. Return a JSON array of strings representing the tasks. Do not return markdown blocks, only raw JSON array.\nMessage: ${content}`
      });
      let text = response.text || "[]";
      if (text.startsWith("```json")) {
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      }
      return JSON.parse(text);
    } catch (err) {
      console.error("AI extraction failed:", err);
      return [];
    }
  }
}