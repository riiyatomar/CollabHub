import { X, Hash, Clock, Users, Pin, FileText } from 'lucide-react';
import { useChannelStore } from '../../../store/useChannelStore';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';
import { useMessageStore } from '../../../store/useMessageStore';
import { format } from 'date-fns';

interface Props {
  onClose: () => void;
}

export default function ChatInfoSidebar({ onClose }: Props) {
  const { activeChannel } = useChannelStore();
  const { members } = useWorkspaceStore();
  const { messages } = useMessageStore();

  const pinnedMessages = (messages || []).filter((m: any) => m.pinnedBy);

  return (
    <div className="w-80 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] bg-white border border-gray-100 flex flex-col overflow-hidden max-h-[calc(100vh-120px)]">
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white shrink-0">
        <h3 className="font-bold text-gray-900">Channel Details</h3>
        <button 
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-5 border-b border-gray-200 bg-white">
          <div className="w-16 h-16 bg-indigo-50 text-primary rounded-xl flex items-center justify-center mb-4">
            <Hash className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{activeChannel?.name || 'Channel'}</h2>
          <p className="text-sm text-gray-500 mb-4">{activeChannel?.description || 'No description provided.'}</p>
          
          <div className="flex items-center text-xs text-gray-400 font-medium">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Created recently
          </div>
        </div>

        <div className="p-5 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3 text-sm font-semibold text-gray-900">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-gray-400" />
                Members
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{members.length}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 text-sm font-semibold text-gray-900">
              <div className="flex items-center">
                <Pin className="w-4 h-4 mr-2 text-gray-400" />
                Pinned Messages
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{pinnedMessages.length}</span>
            </div>
            
            {pinnedMessages.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">No pinned messages.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pinnedMessages.map((msg: any) => (
                  <div key={msg.id} className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 relative group">
                    <div className="flex items-center mb-1 space-x-2">
                      <span className="font-bold text-xs text-gray-900 truncate">{msg.sender.username}</span>
                      <span className="text-[10px] text-gray-500">{format(new Date(msg.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3">{msg.content}</p>
                    <div className="text-[10px] text-amber-600 mt-2 font-medium">
                      Pinned by {msg.pinnedBy?.username || 'Unknown'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 text-sm font-semibold text-gray-900">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2 text-gray-400" />
                Shared Files
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-2">File sharing is disabled.</p>
              <span className="inline-block bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
