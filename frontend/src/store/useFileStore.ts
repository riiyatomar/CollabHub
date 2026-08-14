import { create } from 'zustand';
import { fileApi } from '../api/file';

export interface UploadedFile {
  id: string;
  publicId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  extension: string;
  secureUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
  uploadedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'ERROR';
  error?: string;
}

interface FileState {
  workspaceFiles: UploadedFile[];
  channelFiles: UploadedFile[];
  uploadQueue: UploadTask[];
  isLoading: boolean;
  
  fetchWorkspaceFiles: (workspaceId: string) => Promise<void>;
  fetchChannelFiles: (channelId: string) => Promise<void>;
  
  addFilesToQueue: (files: File[]) => void;
  startUploads: (workspaceId?: string, channelId?: string, onSuccess?: (files: UploadedFile[]) => void) => Promise<void>;
  removeFileFromQueue: (taskId: string) => void;
  clearQueue: () => void;
  
  deleteFile: (fileId: string) => Promise<void>;
  renameFile: (fileId: string, filename: string) => Promise<void>;
}

export const useFileStore = create<FileState>((set, get) => ({
  workspaceFiles: [],
  channelFiles: [],
  uploadQueue: [],
  isLoading: false,

  fetchWorkspaceFiles: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const res = await fileApi.getWorkspaceFiles(workspaceId);
      set({ workspaceFiles: res.data });
    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchChannelFiles: async (channelId) => {
    set({ isLoading: true });
    try {
      const res = await fileApi.getChannelFiles(channelId);
      set({ channelFiles: res.data });
    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },

  addFilesToQueue: (files) => {
    const tasks: UploadTask[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'PENDING'
    }));
    set(state => ({ uploadQueue: [...state.uploadQueue, ...tasks] }));
  },

  removeFileFromQueue: (taskId) => {
    set(state => ({ uploadQueue: state.uploadQueue.filter(t => t.id !== taskId) }));
  },

  clearQueue: () => set({ uploadQueue: [] }),

  startUploads: async (workspaceId, channelId, onSuccess) => {
    const { uploadQueue } = get();
    const pendingTasks = uploadQueue.filter(t => t.status === 'PENDING' || t.status === 'ERROR');
    
    if (pendingTasks.length === 0) return;

    // Concurrently upload files in the queue
    const uploadedFiles: UploadedFile[] = [];

    await Promise.all(pendingTasks.map(async (task) => {
      set(state => ({
        uploadQueue: state.uploadQueue.map(t => t.id === task.id ? { ...t, status: 'UPLOADING', progress: 0 } : t)
      }));

      try {
        const res = await fileApi.uploadFiles([task.file], workspaceId, channelId, (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          set(state => ({
            uploadQueue: state.uploadQueue.map(t => t.id === task.id ? { ...t, progress } : t)
          }));
        });

        uploadedFiles.push(...res.data);
        
        set(state => ({
          uploadQueue: state.uploadQueue.map(t => t.id === task.id ? { ...t, status: 'COMPLETED', progress: 100 } : t)
        }));
      } catch (error: any) {
        set(state => ({
          uploadQueue: state.uploadQueue.map(t => t.id === task.id ? { ...t, status: 'ERROR', error: error.message } : t)
        }));
      }
    }));

    if (uploadedFiles.length > 0 && onSuccess) {
      onSuccess(uploadedFiles);
    }
    
    // Optionally remove completed from queue after a delay
    setTimeout(() => {
      set(state => ({
        uploadQueue: state.uploadQueue.filter(t => t.status !== 'COMPLETED')
      }));
    }, 3000);
  },

  deleteFile: async (fileId) => {
    await fileApi.deleteFile(fileId);
    set(state => ({
      workspaceFiles: state.workspaceFiles.filter(f => f.id !== fileId),
      channelFiles: state.channelFiles.filter(f => f.id !== fileId)
    }));
  },

  renameFile: async (fileId, filename) => {
    const res = await fileApi.renameFile(fileId, filename);
    const updatedFile = res.data;
    set(state => ({
      workspaceFiles: state.workspaceFiles.map(f => f.id === fileId ? { ...f, filename: updatedFile.filename } : f),
      channelFiles: state.channelFiles.map(f => f.id === fileId ? { ...f, filename: updatedFile.filename } : f)
    }));
  }
}));
