import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { insightApi, type WorkspaceInsights } from '../../api/insight';
import { MessageSquare, FileUp, Bell, Users, Hash, Database, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Props {
  workspaceId: string;
}

export default function AdminDashboard({ workspaceId }: Props) {
  const { members } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [insights, setInsights] = useState<WorkspaceInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true);
        const res = await insightApi.getWorkspaceInsights(workspaceId);
        setInsights(res.data.data);
      } catch (error) {
        console.error('Failed to load insights', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, [workspaceId]);

  const currentUserRole = members.find(m => m.userId === user?.id)?.role;
  const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'OWNER';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!insights) return null;

  const StatCard = ({ title, value, icon, colorClass }: { title: string, value: string | number, icon: React.ReactNode, colorClass: string }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-500 text-sm">{title}</h3>
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", colorClass)}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-primary" />
          My Productivity Today
        </h2>
        <p className="text-sm text-gray-500 mt-1">Your personal activity in this workspace</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Messages Sent" 
          value={insights.messagesToday} 
          icon={<MessageSquare className="w-5 h-5" />} 
          colorClass="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          title="Files Uploaded" 
          value={insights.filesUploaded} 
          icon={<FileUp className="w-5 h-5" />} 
          colorClass="bg-green-50 text-green-600" 
        />
        <StatCard 
          title="Pending Tasks/Notifications" 
          value={insights.pendingNotifications} 
          icon={<Bell className="w-5 h-5" />} 
          colorClass="bg-orange-50 text-orange-600" 
        />
      </div>

      {isAdmin && (
        <>
          <div className="pt-6 border-t border-gray-100 mt-8">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Database className="w-5 h-5 mr-2 text-indigo-500" />
              Workspace Analytics
            </h2>
            <p className="text-sm text-gray-500 mt-1">High-level metrics for workspace administrators</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Members" 
              value={insights.totalMembers || 0} 
              icon={<Users className="w-5 h-5" />} 
              colorClass="bg-purple-50 text-purple-600" 
            />
            <StatCard 
              title="Online Members" 
              value={insights.onlineMembers || 0} 
              icon={<Activity className="w-5 h-5" />} 
              colorClass="bg-emerald-50 text-emerald-600" 
            />
            <StatCard 
              title="Active Channels" 
              value={insights.activeChannels || 0} 
              icon={<Hash className="w-5 h-5" />} 
              colorClass="bg-pink-50 text-pink-600" 
            />
            <StatCard 
              title="Total Volume" 
              value={insights.totalMessageVolume || 0} 
              icon={<MessageSquare className="w-5 h-5" />} 
              colorClass="bg-indigo-50 text-indigo-600" 
            />
          </div>
        </>
      )}
    </div>
  );
}
