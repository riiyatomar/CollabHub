import { useEffect, useRef, useState } from 'react';
import { Bell, Check, Trash2, MessageSquare, AtSign, FileUp, Zap } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    initializeSocketListeners
  } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    initializeSocketListeners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'MENTION': return <AtSign className="w-4 h-4 text-primary" />;
      case 'REPLY': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'FILE_UPLOADED': return <FileUp className="w-4 h-4 text-green-500" />;
      default: return <Zap className="w-4 h-4 text-orange-500" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[85vh]">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead()}
                className="text-xs font-medium text-primary hover:text-primary-dark flex items-center"
              >
                <Check className="w-3 h-3 mr-1" /> Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1 p-2">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-900">All caught up!</p>
                <p className="text-xs text-gray-500 mt-1">You have no new notifications.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group",
                      !notif.isRead ? "bg-indigo-50/40" : "bg-transparent"
                    )}
                  >
                    <div className="shrink-0 mr-3 mt-1">
                      {notif.sender?.avatar ? (
                        <img src={notif.sender.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          {getIcon(notif.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium truncate">{notif.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      {!notif.isRead && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                          className="p-1.5 text-primary hover:bg-indigo-50 rounded-md"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
            <button className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
              View Notification Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
