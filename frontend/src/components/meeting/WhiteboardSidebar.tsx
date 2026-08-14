import { Suspense, lazy } from 'react';
import { useMeetingStore } from '../../store/useMeetingStore';

const Whiteboard = lazy(() => import('./Whiteboard'));

const WhiteboardSidebar = () => {
  const { isWhiteboardOpen, currentMeeting } = useMeetingStore();

  if (!isWhiteboardOpen || !currentMeeting) return null;

  return (
    <div className="w-96 border-l border-gray-800 bg-gray-900 flex flex-col relative h-full">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-white font-semibold">Collaborative Whiteboard</h2>
      </div>
      <div className="flex-1 overflow-hidden relative bg-white">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-500">Loading Whiteboard...</div>}>
          <Whiteboard meetingId={currentMeeting.id} />
        </Suspense>
      </div>
    </div>
  );
};

export default WhiteboardSidebar;
