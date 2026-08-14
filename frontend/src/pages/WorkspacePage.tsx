import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useModalStore } from '../store/useModalStore';
import { Plus, MessageSquare, Users } from 'lucide-react';
import { cn } from '../utils/cn';
import WorkspaceFiles from '../components/workspace/WorkspaceFiles';
import ActivityTimeline from '../components/activity/ActivityTimeline';
import AdminDashboard from '../components/workspace/AdminDashboard';
import WorkspaceSettings from '../components/workspace/WorkspaceSettings';
import WorkspaceMembers from '../components/workspace/WorkspaceMembers';

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const { onOpen } = useModalStore();
  const [activeTab, setActiveTab] = useState<'CHANNELS' | 'ACTIVITY' | 'INSIGHTS' | 'FILES' | 'MEMBERS' | 'SETTINGS'>('CHANNELS');

  useEffect(() => {
    if (workspaceId && workspaces.length > 0) {
      const ws = workspaces.find(w => w.id === workspaceId);
      if (ws) {
        setActiveWorkspace(ws);
      }
    }
  }, [workspaceId, workspaces, setActiveWorkspace]);

  return (
    <div className="flex-1 overflow-y-auto bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            {activeWorkspace?.logo ? (
              <img src={activeWorkspace.logo} alt={activeWorkspace.name} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {activeWorkspace?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{activeWorkspace?.name || 'Workspace'}</h1>
              <p className="text-gray-500 mt-1">{activeWorkspace?.description || 'Collaborate and build together.'}</p>
            </div>
          </div>
          
          <button 
            onClick={() => onOpen('inviteMember', { workspaceId: activeWorkspace?.id })}
            className="bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-5 rounded-lg transition-colors flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Users className="w-5 h-5 mr-2" />
            Invite Members
          </button>
        </div>

        <div className="flex space-x-6 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('CHANNELS')}
            className={cn(
              "pb-4 font-medium text-sm transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-sm",
              activeTab === 'CHANNELS' ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Channels
          </button>
          <button
            onClick={() => setActiveTab('ACTIVITY')}
            className={cn(
              "pb-4 font-medium text-sm transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-sm",
              activeTab === 'ACTIVITY' ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Activity
          </button>
          <button
            onClick={() => setActiveTab('INSIGHTS')}
            className={cn(
              "pb-4 font-medium text-sm transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-sm",
              activeTab === 'INSIGHTS' ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('FILES')}
            className={cn(
              "pb-4 font-medium text-sm transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-sm",
              activeTab === 'FILES' ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Files
          </button>
          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={cn(
              "pb-4 font-medium text-sm transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-sm",
              activeTab === 'MEMBERS' ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={cn(
              "pb-4 font-medium text-sm transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-sm",
              activeTab === 'SETTINGS' ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Settings
          </button>
        </div>

        {activeTab === 'CHANNELS' && (
          <div className="bg-[#F9FAFB] rounded-xl border border-gray-100 p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 relative">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Workspace Channels</h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Select an existing channel from the sidebar or create a new one to start collaborating with your team.
            </p>
              <button 
                onClick={() => onOpen('createChannel', { workspaceId: activeWorkspace?.id })}
                className="bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-5 rounded-lg flex items-center shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create a Channel
              </button>
          </div>
        )}

        {activeTab === 'ACTIVITY' && activeWorkspace && (
          <div className="h-[600px] border border-gray-100 rounded-xl overflow-hidden shadow-sm relative">
             <ActivityTimeline workspaceId={activeWorkspace.id} />
          </div>
        )}

        {activeTab === 'INSIGHTS' && activeWorkspace && (
          <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-8 shadow-sm">
             <AdminDashboard workspaceId={activeWorkspace.id} />
          </div>
        )}

        {activeTab === 'FILES' && activeWorkspace && (
          <div className="h-[600px] border border-gray-100 rounded-xl overflow-hidden shadow-sm relative">
             <WorkspaceFiles workspaceId={activeWorkspace.id} />
          </div>
        )}

        {activeTab === 'MEMBERS' && activeWorkspace && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Workspace Members</h3>
            <WorkspaceMembers workspaceId={activeWorkspace.id} />
          </div>
        )}

        {activeTab === 'SETTINGS' && activeWorkspace && (
          <div className="mt-6">
            <WorkspaceSettings workspaceId={activeWorkspace.id} />
          </div>
        )}
      </div>
    </div>
  );
}
