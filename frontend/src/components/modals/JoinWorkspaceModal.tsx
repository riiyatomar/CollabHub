import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinWorkspaceModal({ isOpen, onClose }: Props) {
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { joinWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    // Extract token if user pasted a full link
    let finalToken = token.trim();
    if (finalToken.includes('/invite/')) {
      finalToken = finalToken.split('/invite/')[1].split('/')[0];
    }

    setIsSubmitting(true);
    try {
      const workspaceId = await joinWorkspace(finalToken);
      toast.success('Successfully joined the workspace!');
      onClose();
      navigate(`/workspaces/${workspaceId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to join workspace. Invalid or expired token.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Join Workspace</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                Invite Link or Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste invite link or code here"
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  required
                  autoFocus
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Ask your workspace admin for an invite link to join their workspace.
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !token.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Joining...' : 'Join Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
