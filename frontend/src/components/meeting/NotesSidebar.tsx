import { useState, useEffect } from 'react';
import { useMeetingStore } from '../../store/useMeetingStore';
import { getSocket } from '../../api/socket';

const NotesSidebar = () => {
  const { isNotesOpen, currentMeeting } = useMeetingStore();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!isNotesOpen || !currentMeeting) return;

    const socket = getSocket();
    if (!socket) return;

    // Fetch initial notes
    socket.emit('notes:get', { meetingId: currentMeeting.id });

    socket.on('notes:sync', ({ content: syncContent }) => {
      setContent(syncContent || '');
    });

    socket.on('notes:update', ({ content: updateContent }) => {
      setContent(updateContent);
    });

    return () => {
      socket.off('notes:sync');
      socket.off('notes:update');
    };
  }, [isNotesOpen, currentMeeting]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    if (currentMeeting) {
      const socket = getSocket();
      if (socket) {
        socket.emit('notes:update', { meetingId: currentMeeting.id, content: newContent });
      }
    }
  };

  if (!isNotesOpen || !currentMeeting) return null;

  return (
    <div className="w-96 border-l border-gray-800 bg-gray-900 flex flex-col relative h-full">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-white font-semibold">Shared Notes</h2>
        <span className="text-xs text-gray-400">Markdown Supported</span>
      </div>
      <div className="flex-1 p-4 overflow-hidden relative">
        <textarea
          value={content}
          onChange={handleChange}
          className="w-full h-full bg-gray-800 text-gray-100 rounded-md p-4 outline-none resize-none font-mono text-sm border border-gray-700 focus:border-blue-500"
          placeholder="Type notes here... They synchronize in real-time."
        />
      </div>
    </div>
  );
};

export default NotesSidebar;
