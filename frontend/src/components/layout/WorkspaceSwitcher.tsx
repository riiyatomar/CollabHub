import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useModalStore } from '../../store/useModalStore';
import { Plus, Home, Search } from 'lucide-react';
import { cn } from '../../utils/cn';
import Tooltip from '../Tooltip';

export default function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, fetchWorkspaces } = useWorkspaceStore();
  const { user } = useAuthStore();
  const { onOpen } = useModalStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <div className="w-[72px] bg-[#1E1F22] dark:bg-black flex flex-col items-center py-4 shrink-0 shadow-lg z-20 transition-colors duration-200">
      {/* Home / Dashboard Link */}
      <Tooltip content="Dashboard" position="right">
        <Link 
          to="/dashboard"
          className={cn(
            "relative flex items-center justify-center w-12 h-12 rounded-[24px] bg-[#313338] text-gray-300 hover:bg-primary hover:text-white hover:rounded-[16px] transition-all duration-200 group",
            !activeWorkspace && "bg-primary text-white rounded-[16px]"
          )}
        >
          <Home className="w-6 h-6" />
          {/* Active Indicator Line */}
          <div className={cn(
            "absolute -left-3 w-1.5 bg-white rounded-r-md transition-all duration-300",
            !activeWorkspace ? "h-10" : "h-0 group-hover:h-5 opacity-0 group-hover:opacity-100"
          )} />
        </Link>
      </Tooltip>
      
      <div className="w-8 h-[2px] bg-[#313338] rounded-full my-3" />

      {/* Workspace List */}
      <div className="flex-1 w-full flex flex-col items-center space-y-2 overflow-y-auto no-scrollbar">
        {workspaces.map((workspace) => (
          <Tooltip key={workspace.id} content={workspace.name} position="right">
            <button
              onClick={() => navigate(`/workspaces/${workspace.id}`)}
              className={cn(
                "relative flex items-center justify-center w-12 h-12 rounded-[24px] bg-[#313338] text-gray-300 font-semibold text-lg uppercase hover:bg-primary hover:text-white hover:rounded-[16px] transition-all duration-200 group",
                activeWorkspace?.id === workspace.id && "bg-primary text-white rounded-[16px]"
              )}
            >
              {workspace.logo ? (
                <img src={workspace.logo} alt={workspace.name} className="w-full h-full object-cover rounded-inherit" />
              ) : (
                workspace.name.substring(0, 2)
              )}
              {/* Active Indicator Line */}
              <div className={cn(
                "absolute -left-4 w-2 bg-white rounded-r-md transition-all duration-300",
                activeWorkspace?.id === workspace.id ? "h-10" : "h-0 group-hover:h-5 opacity-0 group-hover:opacity-100"
              )} />
            </button>
          </Tooltip>
        ))}

        {/* Create/Join Actions */}
        <Tooltip content="Create Workspace" position="right">
          <button 
            onClick={() => onOpen('createWorkspace')}
            className="flex items-center justify-center w-12 h-12 rounded-[24px] bg-[#313338] text-green-500 hover:bg-green-500 hover:text-white hover:rounded-[16px] transition-all duration-200 mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <Plus className="w-6 h-6" />
          </button>
        </Tooltip>
        
        <Tooltip content="Join Workspace" position="right">
          <button 
            onClick={() => onOpen('joinWorkspace')}
            className="flex items-center justify-center w-12 h-12 rounded-[24px] bg-[#313338] text-green-500 hover:bg-green-500 hover:text-white hover:rounded-[16px] transition-all duration-200 mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <Search className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>

      {/* Footer Settings / Profile Shortcut */}
      <div className="mt-auto pt-4 flex flex-col space-y-3">
        <Tooltip content="User Settings" position="right">
          <Link to="/profile" className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-[#313338] transition-colors relative">
            {user?.avatar ? (
               <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold uppercase text-sm">
                {user?.username?.substring(0, 2)}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#1E1F22] rounded-full"></div>
          </Link>
        </Tooltip>
      </div>
    </div>
  );
}
