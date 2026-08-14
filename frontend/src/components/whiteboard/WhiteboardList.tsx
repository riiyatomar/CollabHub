import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWhiteboardStore } from '../../store/useWhiteboardStore';
import { Plus, Clock, Trash2, PenTool } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../Button';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

export default function WhiteboardList() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { whiteboards, fetchWhiteboards, createWhiteboard, deleteWhiteboard, isLoading } = useWhiteboardStore();
  const { activeWorkspace } = useWorkspaceStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (workspaceId) {
      fetchWhiteboards(workspaceId);
    }
  }, [workspaceId, fetchWhiteboards]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !newName.trim()) return;
    
    const w = await createWhiteboard(workspaceId, newName.trim());
    if (w) {
      setIsCreating(false);
      setNewName('');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this whiteboard?')) {
      await deleteWhiteboard(id);
    }
  };

  if (isLoading && whiteboards.length === 0) {
    return <div className="p-8 text-gray-500">Loading whiteboards...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <PenTool className="w-6 h-6 mr-3 text-primary" />
              Whiteboards
            </h1>
            <p className="text-gray-500 mt-1">
              Collaborate in real-time with your team in {activeWorkspace?.name || 'this workspace'}.
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            New Whiteboard
          </Button>
        </div>

        {isCreating && (
          <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Create New Whiteboard</h3>
            <form onSubmit={handleCreate} className="flex gap-4">
              <input
                type="text"
                placeholder="Whiteboard Name (e.g., Sprint Planning, Architecture Diagram)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <Button type="submit" disabled={!newName.trim() || isLoading}>
                Create
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </form>
          </div>
        )}

        {whiteboards.length === 0 && !isCreating ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <PenTool className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No whiteboards yet</h3>
            <p className="text-gray-500 mb-4">Create your first whiteboard to start collaborating.</p>
            <Button onClick={() => setIsCreating(true)} variant="outline">
              Create Whiteboard
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whiteboards.map((board) => (
              <Link
                key={board.id}
                to={`/workspaces/${workspaceId}/whiteboards/${board.id}`}
                className="group block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all hover:border-primary/30"
              >
                <div className="aspect-video bg-gray-50 border-b border-gray-100 flex items-center justify-center relative overflow-hidden">
                  <PenTool className="w-12 h-12 text-gray-200 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 truncate pr-4">{board.name}</h3>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => handleDelete(e, board.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      {board.createdBy?.avatar ? (
                        <img src={board.createdBy.avatar} alt="" className="w-5 h-5 rounded-full mr-2 border border-gray-200" />
                      ) : (
                        <div className="w-5 h-5 rounded-full mr-2 bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                          {board.createdBy?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="truncate max-w-[100px]">{board.createdBy?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center" title={new Date(board.updatedAt).toLocaleString()}>
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
