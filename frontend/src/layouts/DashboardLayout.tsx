import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, User, Menu, Settings, Palette } from 'lucide-react';
import apiClient from '../api/axios';
import WorkspaceSwitcher from '../components/layout/WorkspaceSwitcher';
import ChannelSidebar from '../components/layout/ChannelSidebar';
import { useEffect, useRef } from 'react';
import { useModalStore } from '../store/useModalStore';
import NotificationCenter from '../components/notifications/NotificationCenter';
import GlobalSearch from '../components/search/GlobalSearch';
import BookmarksSidebar from '../components/bookmarks/BookmarksSidebar';
import { Bookmark } from 'lucide-react';
import { usePresenceStore } from '../store/usePresenceStore';
import Tooltip from '../components/Tooltip';
import { cn } from '../utils/cn';
import { AiAssistant } from '../components/workspace/AiAssistant';
import { useAiStore } from '../store/useAiStore';
import { Bot } from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { type, isOpen, onOpen, onClose } = useModalStore();
  const isIdle = usePresenceStore(state => state.isIdle);
  const toggleAiOpen = useAiStore(state => state.toggleOpen);
  const isAiOpen = useAiStore(state => state.isOpen);

  const showProfileMenu = isOpen && type === 'userProfileDropdown';

  const profileTriggerRef = useRef<HTMLButtonElement>(null);

  const prevShowProfileMenu = useRef(showProfileMenu);
  useEffect(() => {
    if (prevShowProfileMenu.current && !showProfileMenu) {
      profileTriggerRef.current?.focus();
    }
    prevShowProfileMenu.current = showProfileMenu;
  }, [showProfileMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.error('Logout failed:', e);
    } finally {
      logout();
      onClose();
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      {/* 1. Global Workspace Switcher */}
      <WorkspaceSwitcher />

      {/* 2. Secondary Sidebar */}
      <ChannelSidebar />

      {/* 3. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 z-50 transition-colors duration-200">
          <div className="flex items-center md:hidden">
            <button className="text-gray-500 hover:text-gray-700 mr-4 w-11 h-11 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg transition-all">
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl hidden md:flex items-center ml-4">
            <GlobalSearch />
          </div>
          
          <div className="flex items-center space-x-3 ml-auto">
            {/* Bookmarks */}
            <div className="relative">
              <Tooltip content="Bookmarks" position="bottom">
                <button 
                  className={cn(
                    "hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg w-11 h-11 flex items-center justify-center",
                    type === 'bookmarksDrawer' && isOpen ? "text-gray-900 bg-gray-100" : "text-gray-400"
                  )}
                  onClick={() => isOpen && type === 'bookmarksDrawer' ? onClose() : onOpen('bookmarksDrawer')}
                >
                  <Bookmark className="w-5 h-5" />
                </button>
              </Tooltip>
              <BookmarksSidebar />
            </div>

            {/* Notification Center */}
            <div className="relative">
              <NotificationCenter />
            </div>

            {/* AI Assistant Toggle */}
            <div className="relative">
              <Tooltip content="AI Assistant" position="bottom">
                <button 
                  onClick={toggleAiOpen}
                  className={cn(
                    "hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg w-11 h-11 flex items-center justify-center",
                    isAiOpen ? "text-primary bg-indigo-50" : "text-gray-400"
                  )}
                >
                  <Bot className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <Tooltip content="Profile Menu" position="bottom">
                <button 
                  ref={profileTriggerRef}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full w-11 h-11 flex items-center justify-center"
                  onClick={() => showProfileMenu ? onClose() : onOpen('userProfileDropdown')}
                >
                  <div className="relative">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-primary flex items-center justify-center font-bold text-sm border border-indigo-200">
                        {user?.username?.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    {/* Online Indicator */}
                    <span className={cn(
                      "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white",
                      isIdle ? "bg-amber-400" : "bg-green-500"
                    )} />
                  </div>
                </button>
              </Tooltip>

              {/* Dropdown Content */}
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={onClose} />
                  <div className="absolute right-0 top-full mt-2.5 w-64 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] bg-white border border-gray-100 z-50 transition-all duration-200 transform scale-100 origin-top-right animate-in fade-in slide-in-from-top-1">
                    <div className="py-2 p-2" role="menu" aria-orientation="vertical">
                      <div className="px-3 py-3 border-b border-gray-100 mb-1 flex items-center space-x-2.5">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-primary flex items-center justify-center font-bold text-base border border-indigo-200">
                            {user?.username?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{user?.username}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                      </div>
                      
                      <Link 
                        to="/profile" 
                        onClick={onClose} 
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors" 
                        role="menuitem"
                      >
                        <User className="mr-3 h-4 w-4 text-gray-400" />
                        Profile
                      </Link>
                      
                      <button 
                        onClick={onClose} 
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-left" 
                        role="menuitem"
                      >
                        <Settings className="mr-3 h-4 w-4 text-gray-400" />
                        Settings
                      </button>

                      <button 
                        onClick={() => {
                          setTheme(theme === 'dark' ? 'light' : 'dark');
                          onClose();
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors text-left" 
                        role="menuitem"
                      >
                        <Palette className="mr-3 h-4 w-4 text-gray-400" />
                        <span className="flex-1">Theme</span>
                        <span className="text-xs text-gray-500 capitalize">{theme}</span>
                      </button>
                      
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors text-left" 
                        role="menuitem"
                      >
                        <LogOut className="mr-3 h-4 w-4 text-red-500" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-white flex flex-col relative min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global AI Assistant */}
      <AiAssistant />
    </div>
  );
}
