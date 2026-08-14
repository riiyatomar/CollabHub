import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMeetingStore } from '../../store/useMeetingStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getSocket } from '../../api/socket';
import { handleSignalingData, removePeerConnection, destroyAllPeerConnections, createPeerConnection } from '../../utils/webrtc';

import VideoGrid from './VideoGrid';
import MeetingControls from './MeetingControls';
import ParticipantSidebar from './ParticipantSidebar';
import WhiteboardSidebar from './WhiteboardSidebar';
import NotesSidebar from './NotesSidebar';
import { WatchTogether } from './WatchTogether';
import { WatchUrlDialog } from './WatchUrlDialog';
import MeetingLobby from './MeetingLobby';
import ChatSidebar from './ChatSidebar';

const MeetingTimer = ({ startTime }: { startTime: string }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const diff = Math.floor((now - start) / 1000);
      const hours = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      setElapsed(`${hours > 0 ? hours + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };
    
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <span className="font-mono text-gray-300">{elapsed}</span>;
};

const MeetingRoom = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { 
    setMeeting: _setMeeting, 
    setLocalStream: _setLocalStream, 
    updateParticipantStatus, 
    currentMeeting, 
    localStream, 
    leaveMeeting,
    setPresenterId,
    toggleWhiteboard,
    toggleNotes,
    toggleChat,
    isWhiteboardOpen,
    isNotesOpen,
    isChatOpen,
    isJoined,
    watchSession,
    setWatchSession: _setWatchSession,
    toggleWatchUrlDialog
  } = useMeetingStore();
  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (isJoined) {
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('action') === 'watch') {
        toggleWatchUrlDialog(true);
      }
    }
  }, [isJoined, location.search, toggleWatchUrlDialog]);

  useEffect(() => {
    if (!isJoined || !meetingId || !localStream) return;

    const connectMeeting = async () => {
      try {
        // Socket and signaling connection happens here now that we are joined
        const socket = getSocket();
        if (socket) {
          // Join meeting socket room
          socket.emit('meeting:join', { meetingId });

          // Socket listeners
          socket.on('meeting:user-joined', ({ userId, socketId }: { userId: string, socketId: string }) => {
            if (localStream) {
              createPeerConnection(socketId, userId, localStream, true); // true = initiator
            }
          });

          socket.on('meeting:user-left', ({ userId, socketId }: { userId: string, socketId: string }) => {
            removePeerConnection(socketId, userId);
          });

          socket.on('meeting:signal', ({ signal, fromUserId, socketId }: { signal: any, fromUserId: string, socketId: string }) => {
            if (localStream) {
              handleSignalingData(socketId, fromUserId, signal, localStream);
            }
          });

          socket.on('meeting:media-toggled', ({ userId, type, isMuted }: { userId: string, type: string, isMuted: boolean }) => {
            if (type === 'audio') updateParticipantStatus(userId, { isMuted });
            if (type === 'video') updateParticipantStatus(userId, { isVideoOff: isMuted });
          });

          socket.on('meeting:hand-raised', ({ userId, isRaised }: { userId: string, isRaised: boolean }) => {
            updateParticipantStatus(userId, { isHandRaised: isRaised });
          });

          // Screen share events
          socket.on('screen:start', ({ presenterId }: { presenterId: string }) => {
            setPresenterId(presenterId);
          });
          
          socket.on('screen:stop', ({ presenterId: _presenterId }: { presenterId: string }) => {
            // Note: If multiple presenters are implemented later, we'd check if presenterId matches the current presenter
            setPresenterId(null);
          });

          socket.on('screen:replace', ({ presenterId, targetUserId: _targetUserId }: { presenterId: string, targetUserId: string }) => {
            setPresenterId(presenterId);
          });

          socket.on('watch:start', (session: any) => {
            _setWatchSession(session);
          });

          // Host control events
          socket.on('meeting:kicked', ({ targetUserId }: { targetUserId: string }) => {
            if (user?.id === targetUserId) {
              alert('You have been removed from the meeting by the host.');
              leaveMeeting();
              navigate(-1);
            }
          });

          socket.on('meeting:force-muted', ({ targetUserId }: { targetUserId: string }) => {
            if (user?.id === targetUserId && localStream) {
              const audioTrack = localStream.getAudioTracks()[0];
              if (audioTrack && audioTrack.enabled) {
                audioTrack.enabled = false;
                updateParticipantStatus(user.id, { isMuted: true });
                socket.emit('meeting:toggle-media', { meetingId, type: 'audio', isMuted: true });
              }
            }
          });

          socket.on('meeting:ended-by-host', () => {
            alert('The meeting has been ended by the host.');
            leaveMeeting();
            navigate(-1);
          });
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to connect to meeting sockets');
      }
    };

    connectMeeting();

    return () => {
      // Cleanup
      const socket = getSocket();
      if (socket) {
        socket.off('meeting:user-joined');
        socket.off('meeting:user-left');
        socket.off('meeting:signal');
        socket.off('meeting:media-toggled');
        socket.off('meeting:hand-raised');
        socket.off('screen:start');
        socket.off('screen:stop');
        socket.off('screen:replace');
        socket.off('watch:start');
        socket.off('meeting:kicked');
        socket.off('meeting:force-muted');
        socket.off('meeting:ended-by-host');
      }
      
      destroyAllPeerConnections();
      leaveMeeting();
    };
  }, [meetingId, isJoined, localStream, updateParticipantStatus, setPresenterId, leaveMeeting]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in notes or chat
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'b':
          toggleWhiteboard();
          break;
        case 'n':
          toggleNotes();
          break;
        case 'c':
          toggleChat();
          break;
        case ' ': // spacebar for play/pause
          if (watchSession) {
            e.preventDefault(); // prevent scrolling
            const socket = getSocket();
            if (watchSession.hostId === user?.id && socket) {
              // we don't have direct access to player here, so we let the WatchTogether component handle it
              // actually it's easier to dispatch a custom event
              window.dispatchEvent(new CustomEvent('toggle-watch-play'));
            }
          }
          break;
        case 's':
          // The screen share logic involves browser API, better triggered via button, 
          // but we can simulate the click or we'd need to extract toggleScreenShare from MeetingControls
          // Since it's requested as a shortcut, we should trigger it.
          // For simplicity, we can fire a custom event or let the user click.
          // Wait, the requirement says "S -> Screen Share". We will dispatch a custom event.
          window.dispatchEvent(new CustomEvent('toggle-screen-share'));
          break;
        case 'escape':
          if (isWhiteboardOpen) toggleWhiteboard();
          if (isNotesOpen) toggleNotes();
          if (isChatOpen) toggleChat();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleWhiteboard, toggleNotes, toggleChat, isWhiteboardOpen, isNotesOpen, isChatOpen, watchSession, user]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-700">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-6 px-4 py-2 bg-primary text-white rounded-md">
          Go Back
        </button>
      </div>
    );
  }

  if (!isJoined && meetingId) {
    return <MeetingLobby meetingId={meetingId} />;
  }

  if (!currentMeeting || !localStream) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden relative">
      <WatchUrlDialog />
      <div className="flex flex-col flex-1">
        {/* Top Toolbar */}
        <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center space-x-4">
            <h1 className="text-white font-semibold text-lg">{currentMeeting.title}</h1>
            <div className="h-4 w-px bg-gray-700"></div>
            <MeetingTimer startTime={currentMeeting.createdAt} />
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex -space-x-2 mr-2">
              {currentMeeting.participants.slice(0, 3).map(p => (
                p.user.avatar ? 
                  <img key={p.id} src={p.user.avatar} className="w-8 h-8 rounded-full border-2 border-gray-900" alt="" /> :
                  <div key={p.id} className="w-8 h-8 rounded-full border-2 border-gray-900 bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                    {(p.user.name || p.user.username).charAt(0)}
                  </div>
              ))}
              {currentMeeting.participants.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-gray-900 bg-gray-800 text-gray-300 flex items-center justify-center text-xs font-bold">
                  +{currentMeeting.participants.length - 3}
                </div>
              )}
            </div>
            <span className="text-sm text-green-400 font-medium flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Live
            </span>
          </div>
        </div>

        <div className="flex-1 relative flex overflow-hidden">
          {watchSession && (
            <div className="flex-[3] relative">
              <WatchTogether />
            </div>
          )}
          <div className={`relative ${watchSession ? 'flex-1 border-l border-gray-800' : 'flex-1'}`}>
            <VideoGrid />
          </div>
          <WhiteboardSidebar />
          <NotesSidebar />
          <ChatSidebar />
        </div>
        <MeetingControls />
      </div>
      <ParticipantSidebar />
    </div>
  );
};

export default MeetingRoom;
