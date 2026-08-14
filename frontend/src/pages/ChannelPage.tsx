import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChannelStore } from '../store/useChannelStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import ChatWindow from '../components/chat/ChatWindow';

export default function ChannelPage() {
  const { workspaceId, channelId } = useParams();
  const { channels, setActiveChannel } = useChannelStore();
  const { workspaces, setActiveWorkspace } = useWorkspaceStore();

  // Set active workspace and channel
  useEffect(() => {
    if (workspaceId && workspaces.length > 0) {
      const ws = workspaces.find(w => w.id === workspaceId);
      if (ws) setActiveWorkspace(ws);
    }
    if (channelId && channels.length > 0) {
      const ch = channels.find(c => c.id === channelId);
      if (ch) setActiveChannel(ch);
    }
  }, [workspaceId, channelId, workspaces, channels, setActiveWorkspace, setActiveChannel]);

  if (!workspaceId || !channelId) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      <ChatWindow workspaceId={workspaceId} channelId={channelId} />
    </div>
  );
}
