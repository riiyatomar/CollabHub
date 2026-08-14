import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAiStore } from '../../store/useAiStore';
import { Button } from '../Button';
import { Input } from '../Input';
import { MessageSquarePlus, X, Send, Bot, User, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const AiAssistant = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { 
    isOpen, 
    toggleOpen, 
    conversations, 
    activeConversation, 
    isLoading, 
    fetchConversations, 
    createConversation, 
    setActiveConversation, 
    sendMessage,
    loadMessages
  } = useAiStore();
  
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchConversations(workspaceId);
    }
  }, [isOpen, workspaceId, fetchConversations]);

  useEffect(() => {
    if (activeConversation && !activeConversation.messages) {
      loadMessages(activeConversation.id);
    }
  }, [activeConversation, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !workspaceId || !activeConversation) return;
    
    const msg = content;
    setContent('');
    await sendMessage(workspaceId, msg);
  };

  const handleNewConversation = async () => {
    if (workspaceId) {
      await createConversation(workspaceId, 'New Chat');
    }
  };

  return (
    <div className="fixed top-0 right-0 w-80 h-full bg-white border-l border-gray-200 shadow-xl flex flex-col z-40 transition-transform transform translate-x-0">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold flex items-center">
          <Bot className="w-5 h-5 mr-2 text-primary" />
          AI Assistant
        </h2>
        <button onClick={toggleOpen} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      {!activeConversation ? (
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col min-h-0">
          <Button onClick={handleNewConversation} className="w-full mb-4">
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
          <div className="space-y-2">
            {conversations.map(conv => (
              <div 
                key={conv.id} 
                onClick={() => setActiveConversation(conv)}
                className="p-3 bg-white rounded shadow-sm border border-gray-200 cursor-pointer hover:border-primary transition"
              >
                <div className="flex items-center text-sm font-medium">
                  <MessageSquare className="w-4 h-4 mr-2 text-gray-500" />
                  {conv.title}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(conv.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {conversations.length === 0 && !isLoading && (
              <div className="text-center text-gray-500 mt-10 text-sm">
                No conversations yet. Start one!
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-gray-50 relative min-h-0">
          <div className="bg-white border-b border-gray-200 p-2 flex items-center">
            <button 
              onClick={() => setActiveConversation(null)} 
              className="text-gray-500 hover:text-gray-700 text-sm flex items-center"
            >
              <X className="w-4 h-4 mr-1" />
              Back
            </button>
            <span className="ml-4 font-medium text-sm truncate flex-1">{activeConversation.title}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeConversation.messages?.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 ${msg.role === 'USER' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                  <div className="flex items-center mb-1 space-x-2">
                    {msg.role === 'USER' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-primary" />}
                    <span className="text-xs opacity-75 font-semibold">{msg.role === 'USER' ? 'You' : 'AI'}</span>
                  </div>
                  <div className="text-sm prose prose-sm prose-p:leading-snug prose-pre:bg-gray-800 prose-pre:text-gray-100 max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-gray-500 text-sm flex items-center">
                  <Bot className="w-4 h-4 mr-2 animate-bounce" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex items-center space-x-2">
            <Input 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={!content.trim() || isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
