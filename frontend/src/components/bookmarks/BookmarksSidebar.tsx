import { useEffect } from 'react';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import { Bookmark, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useModalStore } from '../../store/useModalStore';

export default function BookmarksSidebar() {
  const { bookmarks, fetchBookmarks, deleteBookmark, isLoading } = useBookmarkStore();
  const { type, isOpen, onClose } = useModalStore();

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const isSidebarOpen = isOpen && type === 'bookmarksDrawer';

  if (!isSidebarOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/10 transition-opacity" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2.5 w-80 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] bg-white border border-gray-100 z-50 flex flex-col overflow-hidden max-h-[calc(100vh-120px)] animate-in fade-in slide-in-from-top-1 origin-top-right">
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white shrink-0">
          <h3 className="font-bold text-gray-900 flex items-center">
            <Bookmark className="w-5 h-5 mr-2 text-primary" />
            Bookmarks
          </h3>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/50">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 py-12">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100">
                <Bookmark className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium">No bookmarks yet</p>
              <p className="text-xs mt-1 max-w-[200px]">Save important messages to find them easily later.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bookmark) => (
                <div key={bookmark.id} className="bg-white border border-gray-200 rounded-lg p-3 relative group shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {bookmark.message.sender.avatar ? (
                        <img src={bookmark.message.sender.avatar} alt={bookmark.message.sender.username} className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] uppercase">
                          {bookmark.message.sender.username?.substring(0, 2)}
                        </div>
                      )}
                      <span className="font-bold text-xs text-gray-900 truncate max-w-[100px]">{bookmark.message.sender.username}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{format(new Date(bookmark.message.createdAt), 'MMM d')}</span>
                    </div>
                    <button 
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Remove bookmark"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-700 line-clamp-4 bg-gray-50 p-2 rounded-md border border-gray-100">
                    {bookmark.message.content}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-gray-500 flex items-center bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      #{bookmark.message.channel.name}
                    </span>
                    <button className="text-[11px] font-medium text-primary hover:text-primary-dark flex items-center">
                      Jump to <ExternalLink className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
