import React, { useState } from 'react';
import { X, Hash, Volume2, Megaphone } from 'lucide-react';
import { useChannelStore } from '../../store/useChannelStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
}

export default function CreateChannelModal({ isOpen, onClose, workspaceId }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'GENERAL' | 'TEXT' | 'ANNOUNCEMENT'>('TEXT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createChannel } = useChannelStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workspaceId) return;

    if (name.length < 1 || name.length > 50) {
      toast.error('Channel name must be between 1 and 50 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const newChannel = await createChannel(workspaceId, { name, description, type });
      toast.success('Channel created successfully!');
      
      // Reset form
      setName('');
      setDescription('');
      setType('TEXT');
      
      onClose();
      navigate(`/workspaces/${workspaceId}/channels/${newChannel.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create a Channel</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Channel Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="e.g. general-chat"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                required
                maxLength={50}
                autoFocus
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this channel about?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel Type
              </label>
              <div className="space-y-2">
                <label className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${type === 'TEXT' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="type"
                      value="TEXT"
                      checked={type === 'TEXT'}
                      onChange={() => setType('TEXT')}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                    />
                  </div>
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900 flex items-center">
                      <Hash className="w-4 h-4 mr-1 text-gray-500" /> Text Channel
                    </span>
                    <span className="block text-xs text-gray-500">Standard text conversation and file sharing.</span>
                  </div>
                </label>
                
                <label className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${type === 'GENERAL' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="type"
                      value="GENERAL"
                      checked={type === 'GENERAL'}
                      onChange={() => setType('GENERAL')}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                    />
                  </div>
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900 flex items-center">
                      <Volume2 className="w-4 h-4 mr-1 text-gray-500" /> Voice & Text
                    </span>
                    <span className="block text-xs text-gray-500">Supports video calls, voice meetings, and text.</span>
                  </div>
                </label>

                <label className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${type === 'ANNOUNCEMENT' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="type"
                      value="ANNOUNCEMENT"
                      checked={type === 'ANNOUNCEMENT'}
                      onChange={() => setType('ANNOUNCEMENT')}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                    />
                  </div>
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900 flex items-center">
                      <Megaphone className="w-4 h-4 mr-1 text-gray-500" /> Announcement
                    </span>
                    <span className="block text-xs text-gray-500">Only admins can post. Everyone can read.</span>
                  </div>
                </label>
              </div>
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
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
