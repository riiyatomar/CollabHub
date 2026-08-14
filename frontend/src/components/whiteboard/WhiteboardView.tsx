import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWhiteboardStore } from '../../store/useWhiteboardStore';
import CollaborativeCanvas from './CollaborativeCanvas';
import { ChevronLeft, Share2 } from 'lucide-react';
import { Button } from '../Button';

export default function WhiteboardView() {
  const { workspaceId, whiteboardId } = useParams<{ workspaceId: string; whiteboardId: string }>();
  const { currentWhiteboard, getWhiteboard, isLoading } = useWhiteboardStore();

  useEffect(() => {
    if (whiteboardId) {
      getWhiteboard(whiteboardId);
    }
  }, [whiteboardId, getWhiteboard]);

  if (isLoading || !currentWhiteboard) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 animate-pulse">Loading Whiteboard...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10 shadow-sm relative">
        <div className="flex items-center space-x-3">
          <Link 
            to={`/workspaces/${workspaceId}/whiteboards`}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="h-4 w-px bg-gray-300" />
          <h1 className="font-semibold text-gray-900">{currentWhiteboard.name}</h1>
        </div>
        <div className="flex items-center space-x-3">
          {/* We could show live collaborators here based on presence */}
          <Button variant="outline" className="text-gray-600 border-gray-200">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
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
