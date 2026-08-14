import { create } from 'zustand';
import { type ActivityLog, activityApi } from '../api/activity';

interface ActivityState {
  activities: ActivityLog[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
  
  fetchActivities: (workspaceId: string, cursor?: string) => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  isLoading: false,
  error: null,
  hasMore: true,
  nextCursor: null,

  fetchActivities: async (workspaceId: string, cursor?: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await activityApi.getWorkspaceActivity(workspaceId, cursor);
      const newActivities = response.data.data.activities;
      const next = response.data.data.nextCursor;
      
      set((state) => {
        const all = cursor ? [...state.activities, ...newActivities] : newActivities;
        return {
          activities: all,
          hasMore: !!next,
          nextCursor: next,
          isLoading: false
        };
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch activities', isLoading: false });
    }
  }
}));
