import { create } from 'zustand';
import { tasksApi } from '../api/tasks';
import type { Task } from '../api/tasks';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  
  fetchTasks: (workspaceId: string) => Promise<void>;
  createTask: (workspaceId: string, data: Partial<Task>) => Promise<void>;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksApi.getWorkspaceTasks(workspaceId);
      set({ tasks: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch tasks', isLoading: false });
    }
  },

  createTask: async (workspaceId: string, data: Partial<Task>) => {
    try {
      const response = await tasksApi.createTask(workspaceId, data);
      set(state => ({ tasks: [response.data.data, ...state.tasks] }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create task');
    }
  },

  updateTask: async (taskId: string, data: Partial<Task>) => {
    try {
      const response = await tasksApi.updateTask(taskId, data);
      set(state => ({
        tasks: state.tasks.map(t => (t.id === taskId ? response.data.data : t))
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update task');
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      await tasksApi.deleteTask(taskId);
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== taskId)
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete task');
    }
  }
}));
