import { useMeetingStore } from '../../store/useMeetingStore';
import MessageList from '../chat/MessageList';
import Composer from '../chat/Composer';
import { MessageSquare, X } from 'lucide-react';

const ChatSidebar = () => {
  const { currentMeeting, isChatOpen, toggleChat } = useMeetingStore();

  if (!isChatOpen || !currentMeeting || !currentMeeting.channelId) {
    return null;
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <MessageSquare size={18} />
          Meeting Chat
        </h2>
        <button
          onClick={toggleChat}
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 p-1 rounded-md transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* We reuse the MessageList and Composer components by passing the meeting's associated channelId */}
        <MessageList workspaceId={currentMeeting.workspaceId} channelId={currentMeeting.channelId} />
      </div>
      
      <div className="p-3 border-t border-gray-200 shrink-0">
        <Composer channelId={currentMeeting.channelId} />
      </div>
    </div>
  );
};

export default ChatSidebar;
