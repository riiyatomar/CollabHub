import { useState, useEffect } from 'react';
import { Tldraw, createTLStore, defaultShapeUtils, setUserPreferences } from 'tldraw';
import 'tldraw/tldraw.css';
import { getSocket } from '../../api/socket';
import { useAuthStore } from '../../store/useAuthStore';
import InsertWorkspaceImageButton from './InsertWorkspaceImageButton';

interface CollaborativeCanvasProps {
  whiteboardId: string;
  initialData?: any[];
}

export default function CollaborativeCanvas({ whiteboardId, initialData = [] }: CollaborativeCanvasProps) {
  const { user } = useAuthStore();
  const [store] = useState(() => {
    const newStore = createTLStore({ shapeUtils: defaultShapeUtils });
    
    // Load initial data
    if (initialData.length > 0) {
      const records = initialData.map(obj => obj.data);
      newStore.mergeRemoteChanges(() => {
        newStore.put(records);
      });
    }
    return newStore;
  });

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (user) {
      setUserPreferences({ id: user.id, name: user.name || user.username || 'Collaborator', color: (user as any).color || '#3b82f6' });
    }
  }, [user]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !whiteboardId) return;

    socket.emit('whiteboard:join', { whiteboardId });
    setConnected(true);

    const handleUpdate = ({ userId, added, updated, removed }: any) => {
      // Ignore our own broadcasted messages just in case
      if (userId === user?.id) return;

      try {
        store.mergeRemoteChanges(() => {
          if (added && Object.values(added).length > 0) store.put(Object.values(added));
          if (updated && Object.values(updated).length > 0) store.put(Object.values(updated));
          if (removed && Object.values(removed).length > 0) {
            store.remove(Object.values(removed).map((r: any) => r.id));
          }
        });
      } catch (err) {
        console.error('Failed to merge remote changes', err);
      }
    };

    const handleClear = () => {
      // Clear all non-essential shapes from the store
      const allRecordIds = Array.from(store.allRecords()).map(r => r.id);
      store.mergeRemoteChanges(() => {
        store.remove(allRecordIds.filter(id => id.startsWith('shape:')));
      });
    };

    socket.on('whiteboard:objects:update', handleUpdate);
    socket.on('whiteboard:clear', handleClear);

    const unlisten = store.listen((entry) => {
      if (entry.source === 'user') {
        socket.emit('whiteboard:objects:update', {
          whiteboardId,
          added: entry.changes.added,
          updated: entry.changes.updated,
          removed: entry.changes.removed
        });
      }
    });

    return () => {
      socket.off('whiteboard:objects:update', handleUpdate);
      socket.off('whiteboard:clear', handleClear);
      socket.emit('whiteboard:leave', { whiteboardId });
      unlisten();
    };
  }, [whiteboardId, store, user?.id]);

  return (
    <div className="w-full h-full relative" style={{ isolation: 'isolate' }}>
      <Tldraw 
        store={store} 
        className="z-0"
      />
      <InsertWorkspaceImageButton store={store} />
      {!connected && (
        <div className="absolute top-4 right-4 z-50 bg-red-500 text-white text-xs px-2 py-1 rounded shadow">
          Disconnected
        </div>
      )}
    </div>
  );
}
