import { useState } from 'react';
import { X, Search as SearchIcon, MessageSquare, Users } from 'lucide-react';
import { useMessageStore } from '../../../store/useMessageStore';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';

interface Props {
  onClose: () => void;
}

export default function ChatSearchSidebar({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'members'>('messages');
  const { messages } = useMessageStore();
  const { members } = useWorkspaceStore();

  const filteredMessages = query.trim() === '' 
    ? [] 
    : messages.filter(m => m.content.toLowerCase().includes(query.toLowerCase()));

  const filteredMembers = query.trim() === ''
    ? []
    : members.filter((m: any) => 
        m.user.username.toLowerCase().includes(query.toLowerCase()) || 
        m.user.name?.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className="w-80 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] bg-white border border-gray-100 flex flex-col overflow-hidden max-h-[calc(100vh-120px)]">
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white shrink-0">
        <h3 className="font-bold text-gray-900">Search</h3>
        <button 
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-4 border-b border-gray-200 bg-white space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channel..." 
            className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
            autoFocus
          />
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'messages' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Messages
          </button>
          <button 
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'members' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Members
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {query.trim() === '' ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <SearchIcon className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm font-medium">Search {activeTab === 'messages' ? 'Messages' : 'Members'}</p>
            <p className="text-xs mt-1 max-w-[200px]">Find specific {activeTab === 'messages' ? 'messages' : 'members'} in this workspace.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'messages' && (
              <>
                {filteredMessages.map(msg => (
                  <div key={msg.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md cursor-pointer transition-shadow">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-gray-900">{msg.sender?.username || 'User'}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3">{msg.content}</p>
                  </div>
                ))}
                {filteredMessages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">No messages found matching "{query}"</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'members' && (
              <>
                {filteredMembers.map((member: any) => (
                  <div key={member.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mr-3 shrink-0">
                      {member.user.name?.charAt(0).toUpperCase() || member.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{member.user.name}</p>
                      <p className="text-xs text-gray-500 truncate">@{member.user.username}</p>
                    </div>
                  </div>
                ))}
                {filteredMembers.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">No members found matching "{query}"</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
