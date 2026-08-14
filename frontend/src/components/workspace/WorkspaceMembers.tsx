import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { cn } from '../../utils/cn';

interface WorkspaceMembersProps {
  workspaceId: string;
}

export default function WorkspaceMembers({ workspaceId }: WorkspaceMembersProps) {
  const { members, fetchWorkspaceMembers } = useWorkspaceStore();
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    fetchWorkspaceMembers(workspaceId).catch(console.error);
  }, [workspaceId, fetchWorkspaceMembers]);

  const filteredMembers = members.filter(member => 
    member.user.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
    member.user.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4 max-w-md">
        <input
          type="text"
          placeholder="Search members by name or email..."
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white"
        />
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500 text-sm">
                  No members found.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member: any) => (
                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="shrink-0 h-10 w-10 relative">
                        {member.user.avatar ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={member.user.avatar} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {member.user.name.charAt(0)}
                          </div>
                        )}
                        <div className={cn(
                          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800",
                          member.user.presence?.status === 'ONLINE' ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{member.user.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{member.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                      member.role === 'OWNER' ? "bg-purple-100 text-purple-800" :
                      member.role === 'ADMIN' ? "bg-blue-100 text-blue-800" :
                      "bg-green-100 text-green-800"
                    )}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
