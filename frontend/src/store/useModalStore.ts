import { create } from 'zustand';

export type OverlayType = 
  | 'createWorkspace' 
  | 'createChannel'
  | 'joinWorkspace' 
  | 'inviteMember' 
  | 'notificationDrawer' 
  | 'membersDrawer' 
  | 'searchPanel' 
  | 'channelInfoDrawer' 
  | 'userProfileDropdown' 
  | 'workspaceMenu' 
  | 'bookmarksDrawer'
  | 'createTask'
  | null;

interface ModalState {
  type: OverlayType;
  isOpen: boolean;
  data: any;
  onOpen: (type: OverlayType, data?: any) => void;
  onClose: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  type: null,
  isOpen: false,
  data: {},
  onOpen: (type, data = {}) => set({ type, isOpen: true, data }),
  onClose: () => set({ type: null, isOpen: false, data: {} })
}));
