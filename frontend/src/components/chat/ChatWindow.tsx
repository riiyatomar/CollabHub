import { useEffect, useState, useRef } from 'react';
import { useMessageStore } from '../../store/useMessageStore';
import { useChannelStore } from '../../store/useChannelStore';
import { getSocket } from '../../api/socket';
import MessageList from './MessageList';
import Composer from './Composer';
import { Hash, Users, Search, Info, Video, Wand2, PlaySquare } from 'lucide-react';
import ChatMembersSidebar from './sidebars/ChatMembersSidebar';
import ChatSearchSidebar from './sidebars/ChatSearchSidebar';
import ChatInfoSidebar from './sidebars/ChatInfoSidebar';
import ThreadSidebar from './ThreadSidebar';
import { cn } from '../../utils/cn';
import { useModalStore } from '../../store/useModalStore';
import { useWatchStore } from '../../store/useWatchStore';
import Tooltip from '../Tooltip';
import { useNavigate } from 'react-router-dom';
import { meetingApi } from '../../api/meeting';
import { aiApi } from '../../api/ai';
import { toast } from 'sonner';
import WatchTogetherModal from './WatchTogetherModal';
import ChannelWatchTogether from './ChannelWatchTogether';
import ChannelWhiteboard from '../whiteboard/ChannelWhiteboard';
import NotificationCenter from '../notifications/NotificationCenter';
import { PenTool } from 'lucide-react';

interface ChatWindowProps {
  workspaceId: string;
  channelId: string;
}

export default function ChatWindow({ workspaceId, channelId }: ChatWindowProps) {
  const { fetchMessages, addMessage, updateMessage, deleteMessageLocally, addReactionLocally, removeReactionLocally, activeThread, updateMessageStatus } = useMessageStore();
  const { activeChannel } = useChannelStore();
  const { setWatchModalOpen } = useWatchStore();
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const navigate = useNavigate();
  
  const { type, isOpen, onOpen, onClose } = useModalStore();
  
  const activePanel = isOpen ? (
    type === 'notificationDrawer' ? 'NOTIFICATIONS' :
    type === 'membersDrawer' ? 'MEMBERS' :
    type === 'searchPanel' ? 'SEARCH' :
    type === 'channelInfoDrawer' ? 'INFO' : null
  ) : null;

  const notificationsTriggerRef = useRef<HTMLButtonElement>(null);
  const membersTriggerRef = useRef<HTMLButtonElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const infoTriggerRef = useRef<HTMLButtonElement>(null);

  // Focus-return trackers
  const prevPanel = useRef(activePanel);
  useEffect(() => {
    if (prevPanel.current && !activePanel) {
      if (prevPanel.current === 'NOTIFICATIONS') notificationsTriggerRef.current?.focus();
      else if (prevPanel.current === 'MEMBERS') membersTriggerRef.current?.focus();
      else if (prevPanel.current === 'SEARCH') searchTriggerRef.current?.focus();
      else if (prevPanel.current === 'INFO') infoTriggerRef.current?.focus();
    }
    prevPanel.current = activePanel;
  }, [activePanel]);
  
  const togglePanel = (panel: 'NOTIFICATIONS' | 'MEMBERS' | 'SEARCH' | 'INFO') => {
    const overlayMap = {
      NOTIFICATIONS: 'notificationDrawer',
      MEMBERS: 'membersDrawer',
      SEARCH: 'searchPanel',
      INFO: 'channelInfoDrawer'
    } as const;

    const targetType = overlayMap[panel];
    if (isOpen && type === targetType) {
      onClose();
    } else {
      onOpen(targetType);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    fetchMessages(workspaceId, channelId);

    const socket = getSocket();
    if (socket) {
      socket.emit('channel:join', channelId);

      socket.on('message:new', (msg) => {
        addMessage(msg);
      });

      socket.on('message:typing', ({ userId, isTyping }) => {
        setTypingUsers(prev => ({ ...prev, [userId]: isTyping }));
      });

      socket.on('reaction:add', ({ messageId, reaction }) => {
        addReactionLocally(messageId, reaction);
      });

      socket.on('reaction:remove', ({ messageId, userId, emoji }) => {
        removeReactionLocally(messageId, emoji, userId);
      });

      socket.on('message:edited', (msg) => {
        updateMessage(msg.id, msg);
      });

      socket.on('message:deleted', ({ messageId }) => {
        deleteMessageLocally(messageId);
      });

      socket.on('message:pinned', ({ messageId, pinnedBy }) => {
        updateMessage(messageId, { pinnedBy: { messageId, pinnedBy, id: '', channelId: '' } });
      });

      socket.on('message:unpinned', ({ messageId }) => {
        updateMessage(messageId, { pinnedBy: undefined });
      });

      socket.on('message:read', ({ messageId }) => {
        updateMessageStatus(messageId, 'read');
      });

      socket.on('message:delivered', ({ messageId }) => {
        updateMessageStatus(messageId, 'delivered');
      });
    }

    return () => {
      if (socket) {
        socket.emit('channel:leave', channelId);
        socket.off('message:new');
        socket.off('message:typing');
        socket.off('reaction:add');
        socket.off('reaction:remove');
        socket.off('message:edited');
        socket.off('message:deleted');
        socket.off('message:pinned');
        socket.off('message:unpinned');
        socket.off('message:read');
        socket.off('message:delivered');
      }
    };
  }, [workspaceId, channelId, fetchMessages, addMessage, updateMessage, deleteMessageLocally, addReactionLocally, removeReactionLocally, updateMessageStatus]);

  const activeTypers = Object.entries(typingUsers).filter(([_, isTyping]) => isTyping).map(([id]) => id);

  const startMeeting = async () => {
    try {
      const title = activeChannel?.name ? `${activeChannel.name} Meeting` : 'Quick Meeting';
      const res = await meetingApi.create(title, workspaceId, channelId);
      navigate(`/workspaces/${workspaceId}/meeting/${res.data.data.id}`);
    } catch (error) {
      console.error('Failed to start meeting:', error);
    }
  };

  const startWatchSession = async () => {
    setWatchModalOpen(true);
  };

  const handleSummarize = async () => {
    try {
      setIsSummarizing(true);
      const res = await aiApi.summarizeChannel(workspaceId, channelId);
      toast.success('Channel Summarized', {
        description: res.summary,
        duration: 10000,
      });
    } catch (error) {
      toast.error('Failed to summarize channel');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white relative">
      {/* Channel Header */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 shrink-0 bg-white/80 backdrop-blur-sm z-10">
        <div className="flex items-center">
          <Hash className="w-5 h-5 text-gray-400 mr-2" />
          <h2 className="font-bold text-gray-900">{activeChannel?.name || 'Channel'}</h2>
          {activeChannel?.description && (
            <>
              <div className="w-px h-4 bg-gray-300 mx-3" />
              <p className="text-sm text-gray-500 truncate max-w-sm">{activeChannel.description}</p>
            </>
          )}
        </div>
        <div className="flex items-center space-x-1.5 text-gray-400">
          <Tooltip content="Summarize Channel with AI" position="bottom">
            <button 
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg w-11 h-11 flex items-center justify-center text-primary/80 hover:bg-primary/5 disabled:opacity-50"
            >
              <Wand2 className={cn("w-5 h-5", isSummarizing && "animate-pulse")} />
            </button>
          </Tooltip>

          <Tooltip content="Start Media Session" position="bottom">
            <button 
              onClick={startWatchSession}
              className="hover:text-indigo-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg w-11 h-11 flex items-center justify-center text-indigo-500 hover:bg-indigo-50"
            >
              <PlaySquare className="w-5 h-5" />
            </button>
          </Tooltip>

          <Tooltip content="Open Whiteboard" position="bottom">
            <button 
              onClick={() => setShowWhiteboard(!showWhiteboard)}
              className={cn(
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg w-11 h-11 flex items-center justify-center",
                showWhiteboard ? "text-purple-700 bg-purple-100" : "text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              )}
            >
              <PenTool className="w-5 h-5" />
            </button>
          </Tooltip>

          <Tooltip content="Start Meeting" position="bottom">
            <button 
              onClick={startMeeting}
              className="hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg w-11 h-11 flex items-center justify-center text-primary/80 hover:bg-primary/5"
            >
              <Video className="w-5 h-5" />
            </button>
          </Tooltip>

          <div className="relative flex items-center z-50">
            <NotificationCenter />
          </div>
          
          <div className="relative flex items-center z-50">
            <Tooltip content="Members" position="bottom">
              <button 
                ref={membersTriggerRef}
                onClick={() => togglePanel('MEMBERS')}
                className={cn("hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg w-11 h-11 flex items-center justify-center", activePanel === 'MEMBERS' && "text-gray-900 bg-gray-100")}
              >
                <Users className="w-5 h-5" />
              </button>
            </Tooltip>
            {activePanel === 'MEMBERS' && (
              <>
                <div className="fixed inset-0 z-40" onClick={onClose} />
                <div className="absolute right-0 top-full mt-2.5 z-50 origin-top-right animate-in fade-in slide-in-from-top-1">
                  <ChatMembersSidebar workspaceId={workspaceId} onClose={onClose} />
                </div>
              </>
            )}
          </div>
          
          <div className="relative flex items-center z-50">
            <Tooltip content="Search" position="bottom">
              <button 
                ref={searchTriggerRef}
                onClick={() => togglePanel('SEARCH')}
                className={cn("hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg w-11 h-11 flex items-center justify-center", activePanel === 'SEARCH' && "text-gray-900 bg-gray-100")}
              >
                <Search className="w-5 h-5" />
              </button>
            </Tooltip>
            {activePanel === 'SEARCH' && (
              <>
                <div className="fixed inset-0 z-40" onClick={onClose} />
                <div className="absolute right-0 top-full mt-2.5 z-50 origin-top-right animate-in fade-in slide-in-from-top-1">
                  <ChatSearchSidebar onClose={onClose} />
                </div>
              </>
            )}
          </div>
          
          <div className="relative flex items-center z-50">
            <Tooltip content="Channel Info" position="bottom">
              <button 
                ref={infoTriggerRef}
                onClick={() => togglePanel('INFO')}
                className={cn("hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg w-11 h-11 flex items-center justify-center", activePanel === 'INFO' && "text-gray-900 bg-gray-100")}
              >
                <Info className="w-5 h-5" />
              </button>
            </Tooltip>
            {activePanel === 'INFO' && (
              <>
                <div className="fixed inset-0 z-40" onClick={onClose} />
                <div className="absolute right-0 top-full mt-2.5 z-50 origin-top-right animate-in fade-in slide-in-from-top-1">
                  <ChatInfoSidebar onClose={onClose} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className={cn("flex flex-col min-w-0 h-full transition-all duration-300", showWhiteboard ? "w-1/3" : "flex-1")}>
          <ChannelWatchTogether channelId={channelId} />
          
          <MessageList workspaceId={workspaceId} channelId={channelId} />
          
          <div className="px-6 pb-2 shrink-0">
            {activeTypers.length > 0 && (
              <div className="px-2 py-1 text-xs text-gray-500 italic h-5 flex items-center">
                <div className="flex space-x-1 mr-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                {activeTypers.length === 1 ? 'Someone is typing...' : 'Several people are typing...'}
              </div>
            )}
            <Composer channelId={channelId} />
          </div>
        </div>
        
        {showWhiteboard && (
          <div className="flex-1 h-full shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
            <ChannelWhiteboard workspaceId={workspaceId} channelId={channelId} />
          </div>
        )}
        
        {activeThread && !showWhiteboard && (
          <ThreadSidebar workspaceId={workspaceId} channelId={channelId} />
        )}
      </div>
      
      <WatchTogetherModal workspaceId={workspaceId} channelId={channelId} />
    </div>
  );
}
