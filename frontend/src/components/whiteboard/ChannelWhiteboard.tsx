import { useEffect, useState } from 'react';
import { useWhiteboardStore } from '../../store/useWhiteboardStore';
import CollaborativeCanvas from './CollaborativeCanvas';
import { Button } from '../Button';
import { Trash2, Download } from 'lucide-react';
import { getSocket } from '../../api/socket';

interface ChannelWhiteboardProps {
  workspaceId: string;
  channelId: string;
}

export default function ChannelWhiteboard({ workspaceId, channelId }: ChannelWhiteboardProps) {
  const { currentWhiteboard, fetchChannelWhiteboard, isLoading } = useWhiteboardStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (workspaceId && channelId) {
      fetchChannelWhiteboard(workspaceId, channelId);
    }
  }, [workspaceId, channelId, fetchChannelWhiteboard]);

  const handleClearBoard = () => {
    const socket = getSocket();
    if (socket && currentWhiteboard) {
      socket.emit('whiteboard:clear', { whiteboardId: currentWhiteboard.id });
      setShowClearConfirm(false);
    }
  };

  const handleExport = () => {
    // tldraw has built-in export in its menu, but we can trigger a custom event or just let users use the menu
    // We'll leave this button as an additional UI element if desired, or we can just rely on tldraw's native "Export as image"
    // For now, tldraw handles it nicely via its hamburger menu.
    alert('Please use the export options within the drawing menu (Hamburger icon -> Edit -> Export).');
  };

  if (isLoading || !currentWhiteboard) {
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-50 items-center justify-center">
        <div className="text-gray-500 animate-pulse">Loading Collaborative Whiteboard...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 relative overflow-hidden bg-white border-l border-gray-200">
      {/* Whiteboard Header */}
      <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10 shadow-sm relative">
        <h2 className="font-semibold text-sm text-gray-700 flex items-center">
          Channel Whiteboard
        </h2>
        
        <div className="flex items-center space-x-2">
          {showClearConfirm ? (
            <div className="flex items-center space-x-2 animate-in fade-in zoom-in duration-200">
              <span className="text-xs text-red-600 font-medium">Clear entire board?</span>
              <Button variant="outline" onClick={() => setShowClearConfirm(false)} className="h-7 text-xs px-2 py-0">Cancel</Button>
              <Button variant="danger" onClick={handleClearBoard} className="h-7 text-xs px-2 py-0 bg-red-600 text-white hover:bg-red-700">Clear</Button>
            </div>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="h-8 text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1"
                onClick={() => setShowClearConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Clear
              </Button>
              <Button 
                variant="ghost" 
                className="h-8 text-gray-500 hover:text-gray-900 px-2 py-1"
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <CollaborativeCanvas 
          whiteboardId={currentWhiteboard.id} 
          initialData={currentWhiteboard.objects || []} 
        />
      </div>
    </div>
  );
}
