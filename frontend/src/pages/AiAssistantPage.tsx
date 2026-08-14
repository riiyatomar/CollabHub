import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { aiApi, type AiConversation, type AiMessage } from '../api/ai';
import { Bot, ChevronLeft, Plus, Send, Trash2, Copy, Check } from 'lucide-react';
import { cn } from '../utils/cn';

export default function AiAssistantPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<AiConversation | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (workspaceId) {
      loadConversations();
    }
  }, [workspaceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const data = await aiApi.getConversations(workspaceId);
      setConversations(data);
      if (data.length > 0) {
        selectConversation(data[0]);
      } else {
        createNewConversation();
      }
    } catch (err) {
      console.error('Failed to load AI conversations', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectConversation = async (conversation: AiConversation) => {
    setCurrentConversation(conversation);
    setIsLoading(true);
    try {
      const msgs = await aiApi.getMessages(conversation.id);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async () => {
    if (!workspaceId) return;
    try {
      const newConv = await aiApi.createConversation(workspaceId, 'New Conversation');
      setConversations([newConv, ...conversations]);
      setCurrentConversation(newConv);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create conversation', err);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // NOTE: backend controller might be missing delete API in ai.ts. Wait, aiApi doesn't have delete. We will add it.
      await (aiApi as any).deleteConversation(id);
      setConversations(conversations.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        if (conversations.length > 1) {
          selectConversation(conversations.find(c => c.id !== id)!);
        } else {
          createNewConversation();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentConversation || !workspaceId) return;

    const userMessage: AiMessage = {
      id: Date.now().toString(),
      role: 'USER',
      content: input,
      createdAt: new Date().toISOString()
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await aiApi.sendMessage(currentConversation.id, workspaceId, userMessage.content);
      setMessages(prev => [...prev, response]);
    } catch (err) {
      console.error('Failed to send message to AI', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex h-full bg-white relative overflow-hidden">
      {/* Sidebar for Conversations */}
      <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <Link 
            to={`/workspaces/${workspaceId}`}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h2 className="font-semibold text-gray-900">AI Assistant</h2>
          <button 
            onClick={createNewConversation}
            className="p-2 text-primary hover:bg-indigo-50 rounded-md transition-colors"
            title="New Conversation"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(conv => (
            <div 
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className={cn(
                "p-3 rounded-lg cursor-pointer flex justify-between items-center group transition-colors",
                currentConversation?.id === conv.id ? "bg-indigo-50 border border-indigo-100" : "hover:bg-gray-100 border border-transparent"
              )}
            >
              <div className="truncate flex-1 text-sm font-medium text-gray-700">
                {conv.title || 'New Conversation'}
              </div>
              <button 
                onClick={(e) => deleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="h-14 border-b border-gray-200 flex items-center px-6">
          <Bot className="w-6 h-6 text-primary mr-3" />
          <h1 className="font-semibold text-lg text-gray-900">
            {currentConversation?.title || 'AI Assistant'}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <Bot className="w-16 h-16 text-indigo-200 mb-4" />
              <p className="text-lg font-medium text-gray-700">How can I help you today?</p>
              <p className="text-sm mt-2 max-w-md text-center">
                I can answer questions about this workspace, summarize channels, or help you find information.
              </p>
            </div>
          )}
          
          {messages.map(msg => (
            <div key={msg.id} className={cn("flex", msg.role === 'USER' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[75%] rounded-2xl p-4 shadow-sm relative group",
                msg.role === 'USER' ? "bg-primary text-white rounded-br-none" : "bg-gray-100 text-gray-800 rounded-bl-none"
              )}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.role === 'MODEL' && (
                  <button 
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="absolute -right-10 top-2 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none p-4 flex space-x-2 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask the AI Assistant..."
              className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-[52px] max-h-32"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="absolute right-2 top-2 p-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:hover:bg-primary transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-xs text-gray-400">AI can make mistakes. Verify important information.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
