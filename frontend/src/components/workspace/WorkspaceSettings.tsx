import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useWorkspaceAdminStore } from '../../store/useWorkspaceAdminStore';
import { toast } from 'sonner';
import { Input } from '../Input';
import { Button } from '../Button';
import ImageCropper from '../ImageCropper';
import WorkspaceMembers from './WorkspaceMembers';
import { cn } from '../../utils/cn';

interface WorkspaceSettingsProps {
  workspaceId: string;
}

export default function WorkspaceSettings({ workspaceId }: WorkspaceSettingsProps) {
  const { activeWorkspace } = useWorkspaceStore();
  const { updateWorkspaceSettings, uploadBanner, removeBanner, revokeInvitation, getInvitations } = useWorkspaceAdminStore();
  
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'MEMBERS' | 'ROLES' | 'INVITES' | 'INTEGRATIONS' | 'WEBHOOKS'>('GENERAL');
  const [invitations, setInvitations] = useState<any[]>([]);

  const [name, setName] = useState(activeWorkspace?.name || '');
  const [description, setDescription] = useState(activeWorkspace?.description || '');
  
  useEffect(() => {
    if (activeTab === 'INVITES') {
      getInvitations(workspaceId).then(setInvitations).catch(console.error);
    }
  }, [activeTab, workspaceId]);

  const handleUpdateGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateWorkspaceSettings(workspaceId, { name, description });
      toast.success('Workspace updated successfully');
    } catch (error) {
      // error handled in store
    }
  };

  const handleBannerUpload = async (file: File) => {
    try {
      await uploadBanner(workspaceId, file);
      toast.success('Banner updated');
    } catch (error) {}
  };

  const handleBannerRemove = async () => {
    try {
      await removeBanner(workspaceId);
      toast.success('Banner removed');
    } catch (error) {}
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('GENERAL')}
          className={cn("px-6 py-3 font-medium text-sm transition-colors", activeTab === 'GENERAL' ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200")}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={cn("px-6 py-3 font-medium text-sm transition-colors", activeTab === 'MEMBERS' ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200")}
        >
          Members
        </button>
        <button
          onClick={() => setActiveTab('ROLES')}
          className={cn("px-6 py-3 font-medium text-sm transition-colors", activeTab === 'ROLES' ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200")}
        >
          Roles
        </button>
        <button
          onClick={() => setActiveTab('INVITES')}
          className={cn("px-6 py-3 font-medium text-sm transition-colors", activeTab === 'INVITES' ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200")}
        >
          Invites
        </button>
        <button
          onClick={() => setActiveTab('INTEGRATIONS')}
          className={cn("px-6 py-3 font-medium text-sm transition-colors", activeTab === 'INTEGRATIONS' ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200")}
        >
          Integrations
        </button>
        <button
          onClick={() => setActiveTab('WEBHOOKS')}
          className={cn("px-6 py-3 font-medium text-sm transition-colors", activeTab === 'WEBHOOKS' ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200")}
        >
          Webhooks
        </button>
      </div>

      <div className="p-6 md:p-8">
        {activeTab === 'GENERAL' && (
          <div className="space-y-8">
            <form onSubmit={handleUpdateGeneral} className="max-w-md space-y-4">
              <Input
                label="Workspace Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button type="submit">Save Changes</Button>
            </form>

            <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Workspace Banner</h3>
              <ImageCropper 
                currentImageUrl={(activeWorkspace as any)?.banner}
                onUpload={handleBannerUpload}
                onRemove={(activeWorkspace as any)?.banner ? handleBannerRemove : undefined}
                title="Upload Banner"
                aspectRatio={3}
                circularCrop={false}
              />
            </div>
          </div>
        )}

        {activeTab === 'MEMBERS' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Manage Members</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">View and manage members of this workspace.</p>
            <WorkspaceMembers workspaceId={workspaceId} />
          </div>
        )}

        {activeTab === 'ROLES' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Roles & Permissions</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Configure roles for workspace members.</p>
            <div className="text-gray-500 italic">Role management UI goes here...</div>
          </div>
        )}

        {activeTab === 'INVITES' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pending Invites</h3>
            <div className="space-y-4">
              {invitations.length === 0 ? (
                <p className="text-gray-500">No pending invitations.</p>
              ) : (
                invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{inv.email}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Role: {inv.role}</p>
                    </div>
                    <Button 
                      variant="danger" 
                      onClick={async () => {
                        await revokeInvitation(workspaceId, inv.id);
                        setInvitations(invitations.filter(i => i.id !== inv.id));
                        toast.success('Invitation revoked');
                      }}
                    >
                      Revoke
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {activeTab === 'INTEGRATIONS' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Integrations</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Connect your workspace to other tools.</p>
            <div className="text-gray-500 italic p-8 border-2 border-dashed border-gray-200 rounded-xl text-center">
              Integration settings coming soon.
            </div>
          </div>
        )}

        {activeTab === 'WEBHOOKS' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Webhooks</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Manage incoming and outgoing webhooks.</p>
            <div className="text-gray-500 italic p-8 border-2 border-dashed border-gray-200 rounded-xl text-center">
              Webhook management coming soon.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
