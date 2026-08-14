import React, { useState } from 'react';
import { useMeetingStore } from '../../store/useMeetingStore';
import { watchApi } from '../../api/meeting';
import { getSocket } from '../../api/socket';
import { X, PlayCircle } from 'lucide-react';

export const WatchUrlDialog: React.FC = () => {
  const { isWatchUrlDialogOpen, toggleWatchUrlDialog, currentMeeting, setWatchSession } = useMeetingStore();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isWatchUrlDialogOpen || !currentMeeting) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    try {
      setLoading(true);
      const res = await watchApi.create(currentMeeting.id, url);
      setWatchSession(res.data.data);
      
      const socket = getSocket();
      if (socket) {
        socket.emit('watch:start', res.data.data);
      }
      
      toggleWatchUrlDialog(false);
      setUrl('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start watch session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <PlayCircle className="w-5 h-5 mr-2 text-indigo-400" />
            Watch Together
          </h2>
          <button
            onClick={() => toggleWatchUrlDialog(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-400 mb-4">
            Enter a media URL to watch together in sync with the room. Supports YouTube, Vimeo, and direct MP4/WebM links.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Media URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => toggleWatchUrlDialog(false)}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Start Watching'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
