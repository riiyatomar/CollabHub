import { useEffect } from 'react';
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';
import { usePresenceStore } from '../../../store/usePresenceStore';
import { X, User } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface Props {
  workspaceId: string;
  onClose: () => void;
}

export default function ChatMembersSidebar({ workspaceId, onClose }: Props) {
  const { members, fetchWorkspaceMembers } = useWorkspaceStore();
  const onlineUsers = usePresenceStore(state => state.onlineUsers);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceMembers(workspaceId);
    }
  }, [workspaceId, fetchWorkspaceMembers]);

  return (
    <div className="w-80 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] bg-white border border-gray-100 flex flex-col overflow-hidden max-h-[calc(100vh-120px)]">
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white shrink-0">
        <h3 className="font-bold text-gray-900">Members</h3>
        <button 
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="space-y-4">
          {members.map((member: any) => (
            <div key={member.id} className="flex items-center group">
              <div className="relative mr-3 shrink-0">
                {member.user.avatar ? (
                  <img src={member.user.avatar} alt={member.user.name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    {member.user.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                  </div>
                )}
                {onlineUsers[member.user.id] && (
                  <span className={cn(
                    "absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full",
                    onlineUsers[member.user.id] === 'AWAY' ? "bg-amber-400" : "bg-green-500"
                  )}></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {member.user.name}
                  </p>
                  <span className="text-[10px] font-medium text-gray-500 ml-2 uppercase tracking-wide bg-gray-100 px-1.5 py-0.5 rounded">
                    {member.role.toLowerCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">@{member.user.username}</p>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 py-12">
              <User className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium">No members found</p>
              <p className="text-xs mt-1">This workspace is currently empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
