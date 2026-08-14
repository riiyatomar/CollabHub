import { useRef, useEffect, useState } from 'react';
import { useMessageStore } from '../../store/useMessageStore';
import MessageItem from './MessageItem';
import { MessageSquare } from 'lucide-react';

interface MessageListProps {
  workspaceId: string;
  channelId: string;
}

export default function MessageList({ workspaceId, channelId }: MessageListProps) {
  const { messages, isLoading, hasMore, nextCursor, fetchMessages } = useMessageStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const prevMessagesLength = useRef(messages.length);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNewMessageIndicator(false);
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    if (isNearBottom && showNewMessageIndicator) {
      setShowNewMessageIndicator(false);
    }
  };

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
        
        if (isNearBottom) {
          scrollToBottom();
        } else {
          setShowNewMessageIndicator(true);
        }
      }
    } else if (messages.length > 0 && prevMessagesLength.current === 0) {
      // First load, scroll to bottom
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 flex flex-col custom-scrollbar relative" ref={containerRef} onScroll={handleScroll}>
      {showNewMessageIndicator && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <button 
            onClick={scrollToBottom}
            className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg hover:bg-primary-dark transition-colors animate-bounce"
          >
            New Messages ↓
          </button>
        </div>
      )}
      
      {hasMore && (
        <div className="text-center py-4">
          <button 
            onClick={() => fetchMessages(workspaceId, channelId, nextCursor!)}
            disabled={isLoading}
            className="text-sm font-medium text-primary hover:underline"
          >
            {isLoading ? 'Loading older messages...' : 'Load Older Messages'}
          </button>
        </div>
      )}

      {messages.length === 0 && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto h-full my-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Start the conversation</h3>
          <p className="text-gray-500 mb-6">
            This is the very beginning of the channel. Send a message to break the ice!
          </p>
        </div>
      )}

      {isLoading && messages.length === 0 && (
        <div className="space-y-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0 mr-4" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col justify-end min-h-full">
        {messages.map((msg, index) => {
          const showAvatar = index === 0 || messages[index - 1].sender.id !== msg.sender.id;
          
          // Basic Date Separator logic (only checking day change)
          let showDateSeparator = false;
          if (index > 0) {
            const prevDate = new Date(messages[index - 1].createdAt).toDateString();
            const currDate = new Date(msg.createdAt).toDateString();
            showDateSeparator = prevDate !== currDate;
          } else {
            showDateSeparator = true;
          }

          return (
            <div key={msg.id}>
              {showDateSeparator && (
                <div className="flex items-center my-6">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-4 text-xs font-semibold text-gray-500">
                    {new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
              )}
              <MessageItem message={msg} showAvatar={showAvatar || showDateSeparator} />
            </div>
          );
        })}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
