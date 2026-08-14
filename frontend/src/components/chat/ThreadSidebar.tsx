import { useEffect, useRef } from 'react';
import { useMessageStore } from '../../store/useMessageStore';
import { X, MessageSquare } from 'lucide-react';
import MessageItem from './MessageItem';
import Composer from './Composer';

interface ThreadSidebarProps {
  workspaceId: string;
  channelId: string;
}

export default function ThreadSidebar({ workspaceId, channelId }: ThreadSidebarProps) {
  const { activeThread, threadMessages, isThreadLoading, fetchThreadReplies, setActiveThread } = useMessageStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeThread) {
      fetchThreadReplies(workspaceId, channelId, activeThread.id);
    }
  }, [activeThread, workspaceId, channelId, fetchThreadReplies]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages.length]);

  if (!activeThread) return null;

  return (
    <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col h-full shrink-0 shadow-lg animate-in slide-in-from-right-8 duration-300">
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 shrink-0 bg-white">
        <h3 className="font-bold text-gray-900 flex items-center">
          <MessageSquare className="w-4 h-4 mr-2 text-gray-400" /> Thread
        </h3>
        <button 
          onClick={() => setActiveThread(null)}
          className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
        {/* Parent Message */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-4">
          <MessageItem message={activeThread} showAvatar={true} isThreadParent={true} />
        </div>
        
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {activeThread._count?.replies || threadMessages.length} replies
          </span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* Thread Replies */}
        {isThreadLoading && threadMessages.length === 0 ? (
          <div className="flex justify-center py-4">
            <span className="text-sm text-gray-400 animate-pulse">Loading replies...</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {threadMessages.map((msg, index) => {
              const showAvatar = index === 0 || threadMessages[index - 1].sender.id !== msg.sender.id;
              return (
                <MessageItem key={msg.id} message={msg} showAvatar={showAvatar} isThreadReply={true} />
              );
            })}
            <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-gray-200 shrink-0">
        <Composer channelId={channelId} threadParentId={activeThread.id} />
      </div>
    </div>
  );
}
