import { useAuthStore } from '../store/useAuthStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useModalStore } from '../store/useModalStore';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Plus, Users, Search, Bell, Sparkles, Server, Bookmark, CheckSquare } from 'lucide-react';
import { useBookmarkStore } from '../store/useBookmarkStore';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { workspaces, fetchWorkspaces } = useWorkspaceStore();
  const { onOpen } = useModalStore();
  const { bookmarks, fetchBookmarks } = useBookmarkStore();

  useEffect(() => {
    fetchWorkspaces();
    fetchBookmarks();
  }, [fetchWorkspaces, fetchBookmarks]);

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F9FAFB] p-6 lg:p-10 relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary to-indigo-700 rounded-2xl p-8 shadow-sm text-white">
          <div className="relative z-10">
            <p className="text-indigo-100 font-medium mb-1 tracking-wide uppercase text-sm">{currentDate}</p>
            <h1 className="text-3xl lg:text-4xl font-bold mb-3 flex items-center">
              Welcome back, {user?.name?.split(' ')[0] || 'User'} <Sparkles className="w-6 h-6 ml-3 text-yellow-300" />
            </h1>
            <p className="text-indigo-100 max-w-xl text-lg">
              Ready to collaborate? Jump back into your workspaces or create a new one to get started.
            </p>
          </div>
          {/* Abstract background graphics */}
          <div className="absolute right-0 top-0 w-64 h-full bg-white opacity-5 -skew-x-12 translate-x-10"></div>
          <div className="absolute right-32 top-0 w-32 h-full bg-white opacity-10 -skew-x-12 translate-x-10"></div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => onOpen('createWorkspace')}
              className="flex items-start p-5 bg-white border border-gray-200 rounded-xl hover:border-primary hover:shadow-md hover:ring-1 hover:ring-primary transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="bg-indigo-50 p-3 rounded-lg mr-4 group-hover:bg-primary transition-colors">
                <Plus className="w-6 h-6 text-primary group-hover:text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Create Workspace</h3>
                <p className="text-sm text-gray-500">Start a new community or team space.</p>
              </div>
            </button>
            <button 
              onClick={() => onOpen('joinWorkspace')}
              className="flex items-start p-5 bg-white border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md hover:ring-1 hover:ring-green-500 transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              <div className="bg-green-50 p-3 rounded-lg mr-4 group-hover:bg-green-500 transition-colors">
                <Search className="w-6 h-6 text-green-600 group-hover:text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Join Workspace</h3>
                <p className="text-sm text-gray-500">Find and join an existing space.</p>
              </div>
            </button>
            <button 
              onClick={() => {
                if (workspaces.length === 0) {
                  onOpen('createWorkspace');
                } else {
                  // Default to inviting to the first workspace if none selected, or let user pick.
                  // For now, pass the first workspace ID. 
                  onOpen('inviteMember', { workspaceId: workspaces[0].id });
                }
              }}
              className="flex items-start p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md hover:ring-1 hover:ring-blue-500 transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="bg-blue-50 p-3 rounded-lg mr-4 group-hover:bg-blue-500 transition-colors">
                <Users className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Invite Members</h3>
                <p className="text-sm text-gray-500">Grow your team by sending invites.</p>
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workspace Overview */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Your Workspaces</h2>
            
            {workspaces.length === 0 ? (
              <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Server className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No workspaces yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm">
                  You haven't joined or created any workspaces. Create your first workspace to start collaborating!
                </p>
                <button 
                  onClick={() => onOpen('createWorkspace')}
                  className="bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-5 rounded-lg transition-colors flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create your first workspace
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workspaces.map(ws => (
                  <Link 
                    key={ws.id}
                    to={`/workspaces/${ws.id}`}
                    className="flex flex-col p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        {ws.logo ? (
                          <img src={ws.logo} alt={ws.name} className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 text-primary flex items-center justify-center font-bold text-xl uppercase border border-indigo-100 shadow-sm group-hover:shadow-md transition-shadow">
                            {ws.name.substring(0, 2)}
                          </div>
                        )}
                        <div className="ml-3">
                          <h3 className="font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors">{ws.name}</h3>
                          <p className="text-xs text-gray-500 capitalize flex items-center mt-0.5">
                            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${ws.visibility === 'PUBLIC' ? 'bg-green-500' : 'bg-orange-400'}`}></span>
                            {ws.visibility}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {ws.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                        {ws.description}
                      </p>
                    )}
                    
                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                      <div className="flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        <span>-- members</span>
                      </div>
                      <span className="text-primary group-hover:underline">Open</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Notifications & Bookmarks */}
          <div className="lg:col-span-1 flex flex-col space-y-8">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Recent Notifications</h2>
              
              <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[150px]">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 relative">
                  <Bell className="w-6 h-6 text-gray-300" />
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-1">All caught up!</h3>
                <p className="text-xs text-gray-500">
                  When you get mentioned, it will show up here.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Recent Bookmarks</h2>
              
              <div className="bg-white border border-gray-200 rounded-xl p-6 min-h-[150px]">
                {bookmarks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-6">
                    <Bookmark className="w-10 h-10 text-gray-200 mb-3" />
                    <p className="text-sm text-gray-500">No bookmarks yet. Save messages or files to easily find them later.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookmarks.slice(0, 3).map((bookmark) => (
                      <div key={bookmark.id} className="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <Bookmark className="w-4 h-4 text-primary mt-1 shrink-0 mr-3" />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm text-gray-900 font-medium truncate">
                            {bookmark.message?.content || bookmark.note || 'Bookmarked item'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(bookmark.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">My Tasks</h2>
              
              <div className="bg-white border border-gray-200 rounded-xl p-6 min-h-[150px] flex flex-col">
                <div className="flex flex-col items-center justify-center h-full text-center py-6 flex-1">
                  <CheckSquare className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-500">Track your to-dos and action items here.</p>
                </div>
                <Link to="/dashboard/tasks" className="mt-2 text-center text-sm text-primary font-medium hover:underline w-full p-2 bg-indigo-50 rounded-lg">
                  View all tasks
                </Link>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
