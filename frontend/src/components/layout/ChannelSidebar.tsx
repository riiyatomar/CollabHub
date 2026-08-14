import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useChannelStore } from '../../store/useChannelStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { Hash, Volume2, Megaphone, ChevronDown, Plus, Settings, Users, ChevronLeft, ChevronRight, PenTool, CheckSquare, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useModalStore } from '../../store/useModalStore';
import { getSocket } from '../../api/socket';
import Tooltip from '../Tooltip';

export default function ChannelSidebar() {
  const { workspaceId, channelId } = useParams();
  const { channels, fetchChannels, pinnedChannels, fetchPinnedChannels } = useChannelStore();
  const { activeWorkspace } = useWorkspaceStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { type, isOpen, onOpen, onClose } = useModalStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (workspaceId) {
      fetchChannels(workspaceId);
      fetchPinnedChannels(workspaceId);
    }
  }, [workspaceId, fetchChannels, fetchPinnedChannels]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !workspaceId) return;

    const handleChannelCreated = (channel: any) => {
      if (channel.workspaceId === workspaceId) {
        useChannelStore.getState().addChannel(channel);
      }
    };

    socket.on('channel:created', handleChannelCreated);
    
    return () => {
      socket.off('channel:created', handleChannelCreated);
    };
  }, [workspaceId]);

  if (!workspaceId) return null;

  return (
    <div className={cn(
      "bg-[#F2F3F5] dark:bg-gray-800 flex flex-col h-full transition-all duration-300 shrink-0",
      isCollapsed ? "w-0 md:w-16 overflow-hidden" : "w-64"
    )}>
      {/* Workspace Header */}
      <div className="relative">
        <div 
          onClick={() => !isCollapsed && (type === 'workspaceMenu' && isOpen ? onClose() : onOpen('workspaceMenu'))}
          className={cn(
            "h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 shrink-0 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors group",
            !isCollapsed ? "cursor-pointer" : "cursor-default"
          )}
        >
          {!isCollapsed ? (
            <>
              <h2 className="font-bold text-gray-900 truncate flex-1">{activeWorkspace?.name || 'Workspace'}</h2>
              <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
            </>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase mx-auto">
              {activeWorkspace?.name?.substring(0, 1)}
            </div>
          )}
        </div>

        {/* Workspace Menu Dropdown */}
        {!isCollapsed && isOpen && type === 'workspaceMenu' && (
          <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="absolute left-4 right-4 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-1.5 font-sans">
              <button 
                onClick={() => {
                  onClose();
                  onOpen('inviteMember', { workspaceId: activeWorkspace?.id });
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <Users className="w-4 h-4 mr-2.5 text-gray-400" />
                Invite Members
              </button>
              <button 
                onClick={() => {
                  onClose();
                  navigate(`/workspaces/${activeWorkspace?.id}`);
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <Settings className="w-4 h-4 mr-2.5 text-gray-400" />
                Workspace Settings
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button 
                onClick={() => {
                  onClose();
                  onOpen('createWorkspace');
                }}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <Plus className="w-4 h-4 mr-2.5 text-gray-400" />
                Create Workspace
              </button>
            </div>
          </>
        )}
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
        
        {pinnedChannels.length > 0 && (
          <div className="mb-4">
            {!isCollapsed && (
              <div className="px-4 mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Pinned
                </span>
              </div>
            )}
            <div className="space-y-[2px]">
              {pinnedChannels.map(pc => {
                const channel = pc.channel;
                return (
                  <Link
                    key={`pinned-${pc.id}`}
                    to={`/workspaces/${workspaceId}/channels/${channel.id}`}
                    className={cn(
                      "flex items-center px-2 py-2 mx-2 rounded-md transition-colors group relative min-h-[44px]",
                      channel.id === channelId 
                        ? "bg-gray-200/80 text-gray-900 font-medium" 
                        : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900"
                    )}
                  >
                    <div className="mr-2 text-primary">
                      {channel.type === 'GENERAL' ? <Volume2 className="w-5 h-5" /> : 
                       channel.type === 'ANNOUNCEMENT' ? <Megaphone className="w-5 h-5" /> : 
                       <Hash className="w-5 h-5" />}
                    </div>
                    {!isCollapsed ? (
                      <>
                        <span className="truncate flex-1 text-sm font-medium">{channel.name}</span>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-gray-200/90 rounded-md transition-opacity">
                        <span className="text-xs font-bold uppercase">{channel.name.substring(0, 2)}</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
        
        {!isCollapsed && (
          <div className="px-4 mb-1 flex items-center justify-between group">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-gray-700 transition-colors">
              Channels
            </span>
            <Tooltip content="Create Channel" position="right">
              <button 
                onClick={() => onOpen('createChannel', { workspaceId })}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        )}
        
        <div className="space-y-[2px]">
          {channels.map(channel => (
            <Link
              key={channel.id}
              to={`/workspaces/${workspaceId}/channels/${channel.id}`}
              className={cn(
                "flex items-center px-2 py-2 mx-2 rounded-md transition-colors group relative min-h-[44px]",
                channel.id === channelId 
                  ? "bg-gray-200/80 text-gray-900 font-medium" 
                  : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900"
              )}
            >
              <div className="mr-2 text-gray-400 group-hover:text-gray-500">
                {channel.type === 'GENERAL' ? <Volume2 className="w-5 h-5" /> : 
                 channel.type === 'ANNOUNCEMENT' ? <Megaphone className="w-5 h-5" /> : 
                 <Hash className="w-5 h-5" />}
              </div>
              {!isCollapsed ? (
                <>
                  <span className="truncate flex-1 text-sm">{channel.name}</span>
                  <Tooltip content="Channel Settings" position="right">
                    <button disabled className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-gray-700 cursor-not-allowed">
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-gray-200/90 rounded-md transition-opacity">
                  <span className="text-xs font-bold uppercase">{channel.name.substring(0, 2)}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
        
        {/* Whiteboards Link */}
        <div className="mt-4">
          <Link
            to={`/workspaces/${workspaceId}/whiteboards`}
            className={cn(
              "flex items-center px-2 py-2 mx-2 rounded-md transition-colors group relative min-h-[44px]",
              window.location.pathname.includes('/whiteboards') 
                ? "bg-gray-200/80 text-gray-900 font-medium" 
                : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900"
            )}
          >
            <div className="mr-2 text-gray-400 group-hover:text-gray-500">
              <PenTool className="w-5 h-5" />
            </div>
            {!isCollapsed ? (
              <span className="truncate flex-1 text-sm">Whiteboards</span>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-gray-200/90 rounded-md transition-opacity">
                <span className="text-xs font-bold uppercase">WB</span>
              </div>
            )}
          </Link>
        </div>

        {/* Tasks Link */}
        <div className="mt-2 mb-4">
          <Link
            to={`/workspaces/${workspaceId}/tasks`}
            className={cn(
              "flex items-center px-2 py-2 mx-2 rounded-md transition-colors group relative min-h-[44px]",
              window.location.pathname.includes('/tasks') 
                ? "bg-gray-200/80 text-gray-900 font-medium" 
                : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900"
            )}
          >
            <div className="mr-2 text-gray-400 group-hover:text-gray-500">
              <CheckSquare className="w-5 h-5" />
            </div>
            {!isCollapsed ? (
              <span className="truncate flex-1 text-sm">Tasks</span>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-gray-200/90 rounded-md transition-opacity">
                <span className="text-xs font-bold uppercase">TSK</span>
              </div>
            )}
          </Link>
        </div>

        {/* Calendar Link */}
        <div className="mb-4">
          <Link
            to={`/workspaces/${workspaceId}/calendar`}
            className={cn(
              "flex items-center px-2 py-2 mx-2 rounded-md transition-colors group relative min-h-[44px]",
              window.location.pathname.includes('/calendar') 
                ? "bg-gray-200/80 text-gray-900 font-medium" 
                : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900"
            )}
          >
            <div className="mr-2 text-gray-400 group-hover:text-gray-500">
              <Calendar className="w-5 h-5" />
            </div>
            {!isCollapsed ? (
              <span className="truncate flex-1 text-sm">Calendar</span>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-gray-200/90 rounded-md transition-opacity">
                <span className="text-xs font-bold uppercase">CAL</span>
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Sidebar Collapse Toggle Button */}
      <div className="p-3 border-t border-gray-200 flex justify-center md:justify-end">
        <Tooltip content={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"} position="right">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
