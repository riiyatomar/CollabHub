import { useEffect, useState } from 'react';
import { useModalStore } from '../../store/useModalStore';
import CreateWorkspaceModal from '../modals/CreateWorkspaceModal';
import JoinWorkspaceModal from '../modals/JoinWorkspaceModal';
import InviteMemberModal from '../modals/InviteMemberModal';
import CreateChannelModal from '../modals/CreateChannelModal';
import CreateTaskModal from '../modals/CreateTaskModal';

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { type, isOpen, onClose, data } = useModalStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <CreateWorkspaceModal 
        isOpen={isOpen && type === 'createWorkspace'} 
        onClose={onClose} 
      />
      <JoinWorkspaceModal 
        isOpen={isOpen && type === 'joinWorkspace'} 
        onClose={onClose} 
      />
      <CreateChannelModal 
        isOpen={isOpen && type === 'createChannel'} 
        onClose={onClose} 
        workspaceId={data?.workspaceId}
      />
      <InviteMemberModal 
        isOpen={isOpen && type === 'inviteMember'} 
        onClose={onClose} 
        workspaceId={data?.workspaceId}
      />
      <CreateTaskModal 
        isOpen={isOpen && type === 'createTask'} 
        onClose={onClose} 
        messageId={data?.messageId}
        initialTitle={data?.initialTitle}
      />
    </>
  );
};
