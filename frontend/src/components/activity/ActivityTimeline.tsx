import { useEffect } from 'react';
import { useActivityStore } from '../../store/useActivityStore';
import { formatDistanceToNow } from 'date-fns';
import { UserPlus, UserMinus, Shield, Hash, MessageSquare, Plus, CheckCircle, FileText } from 'lucide-react';

interface Props {
  workspaceId: string;
}

export default function ActivityTimeline({ workspaceId }: Props) {
  const { activities, isLoading, hasMore, fetchActivities } = useActivityStore();

  useEffect(() => {
    fetchActivities(workspaceId);
  }, [workspaceId, fetchActivities]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'WORKSPACE_INVITE': return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'MEMBER_JOINED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'MEMBER_LEFT': return <UserMinus className="w-4 h-4 text-red-500" />;
      case 'ROLE_CHANGED': return <Shield className="w-4 h-4 text-purple-500" />;
      case 'CHANNEL_CREATED': return <Hash className="w-4 h-4 text-indigo-500" />;
      case 'CHANNEL_ARCHIVED': return <Hash className="w-4 h-4 text-gray-500" />;
      case 'MESSAGE_PINNED': return <MessageSquare className="w-4 h-4 text-orange-500" />;
      case 'FILE_UPLOADED': return <FileText className="w-4 h-4 text-teal-500" />;
      default: return <Plus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionText = (activity: any) => {
    const actor = activity.user?.name || 'Someone';
    switch (activity.action) {
      case 'WORKSPACE_INVITE': return `${actor} invited a new member`;
      case 'MEMBER_JOINED': return `${actor} joined the workspace`;
      case 'MEMBER_LEFT': return `${actor} left the workspace`;
      case 'ROLE_CHANGED': return `${actor}'s role was updated to ${activity.details?.newRole || 'a new role'}`;
      case 'CHANNEL_CREATED': return `${actor} created channel #${activity.channel?.name || 'unknown'}`;
      case 'CHANNEL_ARCHIVED': return `${actor} archived channel #${activity.channel?.name || 'unknown'}`;
      case 'MESSAGE_PINNED': return `${actor} pinned a message in #${activity.channel?.name || 'unknown'}`;
      case 'FILE_UPLOADED': return `${actor} uploaded a file in #${activity.channel?.name || 'unknown'}`;
      default: return `${actor} performed an action`;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-bold text-gray-900">Activity Timeline</h3>
        <p className="text-xs text-gray-500 mt-1">Recent events in this workspace</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activities.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium">No recent activity</p>
          </div>
        ) : (
          <div className="relative border-l border-gray-200 ml-3 space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="relative pl-6 group">
                <div className="absolute -left-[17px] bg-white p-1 rounded-full border border-gray-200 group-hover:border-primary transition-colors">
                  {getActionIcon(activity.action)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {getActionText(activity)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="py-4 text-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}

        {hasMore && !isLoading && (
          <button 
            onClick={() => fetchActivities(workspaceId, useActivityStore.getState().nextCursor || undefined)}
            className="mt-6 w-full py-2 text-sm font-medium text-primary hover:bg-indigo-50 rounded-lg transition-colors"
          >
            Load More Activity
          </button>
        )}
      </div>
    </div>
  );
}
