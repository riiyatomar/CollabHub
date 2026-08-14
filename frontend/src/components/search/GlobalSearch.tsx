import { useEffect, useState, useRef } from 'react';
import { Search, X, MessageSquare, Hash, FileText, ChevronRight } from 'lucide-react';
import { useSearchStore } from '../../store/useSearchStore';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { cn } from '../../utils/cn';
import { useDebounce } from '../../hooks/useDebounce'; // We need to create this hook if not exists

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  const debouncedQuery = useDebounce(localQuery, 300);
  
  const { results, isLoading, type, setType, performSearch, clearResults } = useSearchStore();
  const activeWorkspace = useWorkspaceStore(state => state.activeWorkspace);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setLocalQuery('');
      clearResults();
    }
  }, [isOpen, clearResults]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      useSearchStore.getState().setQuery(debouncedQuery);
      performSearch(activeWorkspace?.id);
    } else {
      clearResults();
    }
  }, [debouncedQuery, type, activeWorkspace, performSearch, clearResults]);

  if (!isOpen) {
    return (
      <div 
        onClick={() => setIsOpen(true)}
        className="relative w-full max-w-md cursor-text group"
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400 group-hover:text-gray-500 transition-colors" />
        </div>
        <div className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 text-gray-500 sm:text-sm transition-colors group-hover:bg-white group-hover:border-gray-400">
          Search workspaces, channels...
          <span className="absolute right-2 top-1.5 px-1.5 py-0.5 border border-gray-200 rounded text-xs text-gray-400 bg-white">
            ⌘K
          </span>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'messages', label: 'Messages' },
    { id: 'files', label: 'Files' },
    { id: 'channels', label: 'Channels' },
    { id: 'members', label: 'Members' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pb-20 sm:p-0 sm:pt-[10vh]">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsOpen(false)} />
      
      <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-3xl transform transition-all flex flex-col max-h-[80vh]">
        
        {/* Search Header */}
        <div className="relative flex items-center p-4 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-0 focus:ring-0 text-lg text-gray-900 placeholder-gray-400 p-0"
            placeholder="Search for anything..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
          />
          {isLoading && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0 ml-3" />}
          <button 
            onClick={() => setIsOpen(false)}
            className="ml-4 p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex border-b border-gray-100 px-4 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                type === t.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2 bg-gray-50/50 min-h-[300px]">
          {localQuery.length < 2 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
              <Search className="w-12 h-12 mb-4 text-gray-300" />
              <p>Type at least 2 characters to search</p>
            </div>
          ) : (
            <div className="space-y-6 p-2">
              {(type === 'all' || type === 'messages') && results.messages?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Messages</h3>
                  <div className="space-y-1">
                    {results.messages.map((msg) => (
                      <div key={msg.id} className="flex items-start p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all cursor-pointer border border-transparent hover:border-gray-100 group">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {msg.sender.name} <span className="text-gray-500 font-normal ml-1">in #{msg.channel.name}</span>
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{msg.content}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(type === 'all' || type === 'files') && results.files?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Files</h3>
                  <div className="space-y-1">
                    {results.files.map((file) => (
                      <div key={file.id} className="flex items-center p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all cursor-pointer border border-transparent hover:border-gray-100 group">
                        <FileText className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.originalName}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(type === 'all' || type === 'channels') && results.channels?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Channels</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.channels.map((channel) => (
                      <div key={channel.id} className="flex items-center p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all cursor-pointer border border-transparent hover:border-gray-100">
                        <Hash className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{channel.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(type === 'all' || type === 'members') && results.members?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Members</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.members.map((member) => (
                      <div key={member.id} className="flex items-center p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all cursor-pointer border border-transparent hover:border-gray-100">
                        {member.avatar ? (
                          <img src={member.avatar} alt="" className="w-8 h-8 rounded-full mr-3 object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-primary flex items-center justify-center mr-3 font-semibold text-xs">
                            {member.name.substring(0,2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                          <p className="text-xs text-gray-500 truncate">@{member.username}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!isLoading && 
               results.messages?.length === 0 && 
               results.files?.length === 0 && 
               results.channels?.length === 0 && 
               results.members?.length === 0 && (
                <div className="h-32 flex flex-col items-center justify-center text-gray-400">
                  <Search className="w-8 h-8 mb-2 text-gray-300" />
                  <p className="text-sm">No results found for "{localQuery}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
