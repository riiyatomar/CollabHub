import { Mic, MicOff, Video, VideoOff, Hand, Settings, PhoneOff, MonitorUp, Edit3, FileText, PlaySquare, MessageSquare } from 'lucide-react';
import { useMeetingStore } from '../../store/useMeetingStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getSocket } from '../../api/socket';
import { useNavigate, useParams } from 'react-router-dom';
import { replaceVideoTrack } from '../../utils/webrtc';
import { useEffect, useCallback, useState } from 'react';
import { meetingApi } from '../../api/meeting';

const MeetingControls = () => {
  const { 
    currentMeeting, 
    localStream, 
    participantsStatus, 
    updateParticipantStatus, 
    leaveMeeting,
    presenterId,
    setPresenterId,
    toggleWhiteboard,
    toggleNotes,
    toggleChat,
    isWhiteboardOpen,
    isNotesOpen,
    isChatOpen,
    toggleWatchUrlDialog,
    watchSession
  } = useMeetingStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [showLeaveMenu, setShowLeaveMenu] = useState(false);

  const status = user ? participantsStatus[user.id] || { isMuted: false, isVideoOff: false, isHandRaised: false } : { isMuted: false, isVideoOff: false, isHandRaised: false };
  const isPresenting = user && presenterId === user.id;

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack && user && currentMeeting) {
        audioTrack.enabled = !audioTrack.enabled;
        const isMuted = !audioTrack.enabled;
        updateParticipantStatus(user.id, { isMuted });
        const socket = getSocket();
        if (socket) {
          socket.emit('meeting:toggle-media', { meetingId: currentMeeting.id, type: 'audio', isMuted });
        }
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack && user && currentMeeting) {
        videoTrack.enabled = !videoTrack.enabled;
        const isVideoOff = !videoTrack.enabled;
        updateParticipantStatus(user.id, { isVideoOff });
        const socket = getSocket();
        if (socket) {
          socket.emit('meeting:toggle-media', { meetingId: currentMeeting.id, type: 'video', isMuted: isVideoOff });
        }
      }
    }
  };

  const toggleHand = () => {
    if (!user || !currentMeeting) return;
    const isHandRaised = !status.isHandRaised;
    updateParticipantStatus(user.id, { isHandRaised });
    const socket = getSocket();
    if (socket) {
      socket.emit('meeting:raise-hand', { meetingId: currentMeeting.id, isRaised: isHandRaised });
    }
  };

  const handleLeave = () => {
    if (isPresenting && currentMeeting) {
      const socket = getSocket();
      if (socket) socket.emit('screen:stop', { meetingId: currentMeeting.id });
    }
    leaveMeeting();
    if (workspaceId) {
      navigate(`/workspaces/${workspaceId}`);
    } else {
      navigate(-1);
    }
  };

  const handleEndMeeting = async () => {
    if (!currentMeeting) return;
    try {
      await meetingApi.end(currentMeeting.id);
      const socket = getSocket();
      if (socket) {
        socket.emit('meeting:end-session', { meetingId: currentMeeting.id });
      }
      leaveMeeting();
      if (workspaceId) {
        navigate(`/workspaces/${workspaceId}`);
      } else {
        navigate(-1);
      }
    } catch (error) {
      console.error('Failed to end meeting', error);
    }
  };

  const toggleScreenShare = useCallback(async () => {
    if (!currentMeeting || !user) return;
    try {
      const socket = getSocket();
      if (isPresenting) {
        // Stop screen sharing
        const videoTrack = localStream?.getVideoTracks()[0];
        if (videoTrack) {
          replaceVideoTrack(videoTrack);
        }
        setPresenterId(null);
        if (socket) {
          socket.emit('screen:stop', { meetingId: currentMeeting.id });
        }
      } else {
        // Start screen sharing
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        
        screenTrack.onended = () => {
          // Revert when user stops sharing via browser UI
          const originalVideoTrack = localStream?.getVideoTracks()[0];
          if (originalVideoTrack) replaceVideoTrack(originalVideoTrack);
          setPresenterId(null);
          if (socket) socket.emit('screen:stop', { meetingId: currentMeeting.id });
        };

        replaceVideoTrack(screenTrack);
        setPresenterId(user.id);
        
        if (socket) {
          // If someone else was presenting, this effectively overrides them in the socket event logic on the server
          socket.emit('screen:start', { meetingId: currentMeeting.id });
        }
      }
    } catch (err) {
      console.error('Failed to share screen', err);
    }
  }, [isPresenting, localStream, currentMeeting, user, setPresenterId]);

  useEffect(() => {
    const handleToggle = () => toggleScreenShare();
    window.addEventListener('toggle-screen-share', handleToggle);
    return () => window.removeEventListener('toggle-screen-share', handleToggle);
  }, [toggleScreenShare]);

  if (!currentMeeting || !user) return null;

  return (
    <div className="flex items-center justify-center space-x-4 bg-gray-900/95 p-4 border-t border-gray-800">
      <button
        onClick={toggleMic}
        className={`p-4 rounded-full transition-colors ${status.isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
      >
        {status.isMuted ? <MicOff size={24} /> : <Mic size={24} />}
      </button>

      <button
        onClick={toggleVideo}
        className={`p-4 rounded-full transition-colors ${status.isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
      >
        {status.isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
      </button>

      <button
        onClick={toggleHand}
        className={`p-4 rounded-full transition-colors ${status.isHandRaised ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
      >
        <Hand size={24} />
      </button>

      {/* Settings would open the DeviceSelectorModal. Simplified for now. */}
      <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors">
        <Settings size={24} />
      </button>

      <div className="w-px h-10 bg-gray-700 mx-2"></div>

      <button
        onClick={toggleScreenShare}
        className={`p-4 rounded-full transition-colors ${isPresenting ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
      >
        <MonitorUp size={24} />
      </button>

      <button
        onClick={toggleWhiteboard}
        className={`p-4 rounded-full transition-colors ${isWhiteboardOpen ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
      >
        <Edit3 size={24} />
      </button>

      <button
        onClick={toggleNotes}
        className={`p-4 rounded-full transition-colors ${isNotesOpen ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
      >
        <FileText size={24} />
      </button>

      <button
        onClick={toggleChat}
        className={`p-4 rounded-full transition-colors ${isChatOpen ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
        title="Meeting Chat (C)"
      >
        <MessageSquare size={24} />
      </button>

      <button
        onClick={() => toggleWatchUrlDialog(true)}
        className={`p-4 rounded-full transition-colors ${watchSession ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
        title="Watch Together"
      >
        <PlaySquare size={24} />
      </button>

      <div className="relative">
        <button
          onClick={() => {
            if (currentMeeting.hostId === user.id) {
              setShowLeaveMenu(!showLeaveMenu);
            } else {
              handleLeave();
            }
          }}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors ml-8 flex items-center gap-2"
        >
          <PhoneOff size={24} />
        </button>

        {showLeaveMenu && currentMeeting.hostId === user.id && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowLeaveMenu(false)} />
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden">
              <button 
                onClick={handleLeave}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
              >
                Leave Meeting
              </button>
              <button 
                onClick={handleEndMeeting}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
              >
                End Meeting for All
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MeetingControls;
