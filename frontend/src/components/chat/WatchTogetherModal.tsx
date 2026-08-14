import { useState } from 'react';
import { useWatchStore } from '../../store/useWatchStore';
import { mediaSessionApi } from '../../api/meeting';
import { X, Play, Link as LinkIcon } from 'lucide-react';
import ReactPlayer from 'react-player';
import { toast } from 'sonner';

interface WatchTogetherModalProps {
  workspaceId: string;
  channelId: string;
}

const Player = (ReactPlayer as any).default || ReactPlayer;

export default function WatchTogetherModal({ workspaceId, channelId }: WatchTogetherModalProps) {
  const { isWatchModalOpen, setWatchModalOpen, setActiveSession, setHasJoined } = useWatchStore();
  const [url, setUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isWatchModalOpen) return null;

  const handlePreview = () => {
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }
    if (!Player.canPlay(url)) {
      toast.error('This media source is not supported by CollabHub yet.');
      return;
    }
    setPreviewUrl(url);
  };

  const handleStartSession = async () => {
    if (!previewUrl) return;
    try {
      setIsLoading(true);
      const res = await mediaSessionApi.create(previewUrl, workspaceId, channelId);
      setActiveSession(res.data.data);
      setHasJoined(true);
      setWatchModalOpen(false);
      toast.success('Watch Together session started!');
    } catch (error) {
      toast.error('Failed to start session');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setWatchModalOpen(false);
    setUrl('');
    setPreviewUrl('');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={closeModal} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg pointer-events-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Share Media Link</h2>
            <button 
              onClick={closeModal}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Media URL</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (previewUrl && e.target.value !== previewUrl) setPreviewUrl('');
                    }}
                    placeholder="https://youtube.com/watch?v=..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
                <button
                  onClick={handlePreview}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Preview
                </button>
              </div>
            </div>

            {previewUrl && (
              <div className="mt-4 aspect-video bg-black rounded-lg overflow-hidden border border-gray-200 relative">
                <Player
                  url={previewUrl}
                  width="100%"
                  height="100%"
                  controls={true}
                  light={false}
                />
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={handleStartSession}
              disabled={!previewUrl || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Start Session
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
