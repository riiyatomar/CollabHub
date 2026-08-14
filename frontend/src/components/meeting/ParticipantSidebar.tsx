import { Users, MicOff, VideoOff, Hand, MoreVertical, Mic, UserMinus } from 'lucide-react';
import { useMeetingStore } from '../../store/useMeetingStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getSocket } from '../../api/socket';
import { useState } from 'react';
import { useAudioVolume } from '../../hooks/useAudioVolume';

const ParticipantRow = ({ p, isHost, isMe, status, stream }: any) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const isSpeaking = useAudioVolume(stream);
  const { currentMeeting } = useMeetingStore();

  const getInitials = (name?: string, username?: string) => {
    return name?.charAt(0) || username?.charAt(0) || 'U';
  };

  const showHostMenu = isHost && !isMe;

  const handleKick = () => {
    const socket = getSocket();
    if (socket && currentMeeting) {
      socket.emit('meeting:kick', { meetingId: currentMeeting.id, targetUserId: p.userId });
    }
    setOpenMenuId(null);
  };

  const handleForceMute = () => {
    const socket = getSocket();
    if (socket && currentMeeting) {
      socket.emit('meeting:force-mute', { meetingId: currentMeeting.id, targetUserId: p.userId });
    }
    setOpenMenuId(null);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3 truncate">
        <div className="relative">
          {p.user.avatar ? (
            <img src={p.user.avatar} alt="Avatar" className={`w-8 h-8 rounded-full object-cover ${isSpeaking && !status.isMuted ? 'ring-2 ring-green-500 ring-offset-1' : ''}`} />
          ) : (
            <div className={`w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm ${isSpeaking && !status.isMuted ? 'ring-2 ring-green-500 ring-offset-1' : ''}`}>
              {getInitials(p.user.name, p.user.username)}
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-gray-700 truncate max-w-[140px]">
          {p.user.name || p.user.username} {isMe && '(You)'}
          {p.userId === currentMeeting?.hostId && <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Host</span>}
        </span>
      </div>
      <div className="flex items-center space-x-2 text-gray-500 relative">
        {status.isHandRaised && <Hand size={14} className="text-yellow-500" />}
        {status.isMuted && <MicOff size={14} className="text-red-400" />}
        {status.isVideoOff && <VideoOff size={14} className="text-gray-400" />}
        
        {showHostMenu && (
          <div className="relative">
            <button 
              onClick={() => setOpenMenuId(openMenuId === p.userId ? null : p.userId)}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
            >
              <MoreVertical size={14} />
            </button>
            
            {openMenuId === p.userId && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-20 overflow-hidden">
                  <button 
                    onClick={handleForceMute}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Mic size={14} className="text-gray-400" /> Mute
                  </button>
                  <button 
                    onClick={handleKick}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <UserMinus size={14} className="text-red-400" /> Remove
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ParticipantSidebar = () => {
  const { currentMeeting, participantsStatus, localStream, remoteStreams } = useMeetingStore();
  const { user } = useAuthStore();

  if (!currentMeeting || !user) return null;

  const isHost = currentMeeting.hostId === user.id;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Users size={18} />
          Participants ({currentMeeting.participants.length})
        </h2>
      </div>
      <div className="overflow-y-auto flex-1 p-4 space-y-4">
        {currentMeeting.participants.map((p) => {
          const status = participantsStatus[p.userId] || { isMuted: false, isVideoOff: false, isHandRaised: false };
          const isMe = p.userId === user.id;
          const stream = isMe ? localStream : remoteStreams[p.userId];

          return (
            <ParticipantRow key={p.id} p={p} isHost={isHost} isMe={isMe} status={status} stream={stream} />
          );
        })}
      </div>
    </div>
  );
};

export default ParticipantSidebar;
