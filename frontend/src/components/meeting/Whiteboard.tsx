import { useState, useEffect } from 'react';
import { Tldraw, createTLStore, defaultShapeUtils } from 'tldraw';
import 'tldraw/tldraw.css';
import { getSocket } from '../../api/socket';

interface WhiteboardProps {
  meetingId: string;
}

export default function Whiteboard({ meetingId }: WhiteboardProps) {
  const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }));

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Listen for remote updates
    const handleUpdate = ({ data }: { data: any }) => {
      // In a real production app we would merge changes via Yjs.
      // For Phase 4B, we will do a best-effort merge or just rely on tldraw's internal diffs
      try {
        if (data && typeof data === 'object') {
          store.mergeRemoteChanges(() => {
            store.put(Object.values(data));
          });
        }
      } catch {
        // ignore merge errors
      }
    };

    socket.on('whiteboard:update', handleUpdate);

    // Listen for local changes and broadcast
    const unlisten = store.listen((entry) => {
      if (entry.source === 'user') {
        socket.emit('whiteboard:update', { meetingId, data: entry.changes.added });
        socket.emit('whiteboard:update', { meetingId, data: entry.changes.updated });
      }
    });

    return () => {
      socket.off('whiteboard:update', handleUpdate);
      unlisten();
    };
  }, [meetingId, store]);

  return (
    <div className="w-full h-full bg-white relative">
      <Tldraw store={store} />
    </div>
  );
}
