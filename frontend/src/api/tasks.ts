import api from './axios';

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  creatorId: string;
  assigneeId: string | null;
  channelId: string | null;
  messageId: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; name: string; avatar: string | null } | null;
  labels?: { id: string; name: string; color: string }[];
}

export const tasksApi = {
  getWorkspaceTasks: (workspaceId: string) => 
    api.get(`/workspaces/${workspaceId}/tasks`),
  
  createTask: (workspaceId: string, data: Partial<Task>) => 
    api.post(`/workspaces/${workspaceId}/tasks`, data),
  
  updateTask: (taskId: string, data: Partial<Task>) => 
    api.patch(`/tasks/${taskId}`, data),
  
  deleteTask: (taskId: string) => 
    api.delete(`/tasks/${taskId}`)
};
