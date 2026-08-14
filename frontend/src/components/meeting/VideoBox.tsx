import { useEffect, useRef } from 'react';
import { MicOff, VideoOff, Hand } from 'lucide-react';
import type { ParticipantStatus } from '../../store/useMeetingStore';
import { useMeetingStore } from '../../store/useMeetingStore';
import type { User } from '../../store/useAuthStore';
import { useAudioVolume } from '../../hooks/useAudioVolume';

interface VideoBoxProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  user?: User;
  status?: ParticipantStatus;
}

const VideoBox = ({ stream, isLocal, user, status }: VideoBoxProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const presenterId = useMeetingStore(state => state.presenterId);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const isVideoOff = status?.isVideoOff || (isLocal && stream?.getVideoTracks()[0]?.enabled === false);
  const isMuted = status?.isMuted || (isLocal && stream?.getAudioTracks()[0]?.enabled === false);
  const isHandRaised = status?.isHandRaised;
  const isPresenter = presenterId && user?.id === presenterId;
  const isSpeaking = useAudioVolume(stream);

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center w-full h-full aspect-video transition-all duration-200 ${isSpeaking && !isMuted ? 'ring-4 ring-green-500 ring-offset-2 ring-offset-black' : 'ring-0'}`}>
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal && !isPresenter ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4">
            {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <p className="text-gray-400 font-medium">Video Off</p>
        </div>
      )}

      {/* Overlays */}
      <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-md flex items-center space-x-2 text-white">
        <span className="font-medium text-sm truncate max-w-[150px]">
          {isLocal ? 'You' : user?.name || user?.username}
        </span>
        {isMuted && <MicOff size={14} className="text-red-400" />}
        {isVideoOff && <VideoOff size={14} className="text-gray-400" />}
      </div>

      {isHandRaised && (
        <div className="absolute top-4 right-4 bg-yellow-500 text-white p-2 rounded-full animate-bounce">
          <Hand size={18} />
        </div>
      )}

      {isPresenter && (
        <div className="absolute top-4 left-4 bg-green-500/90 text-white px-2 py-1 text-xs font-bold rounded shadow-md border border-green-400">
          PRESENTER
        </div>
      )}
    </div>
  );
};

export default VideoBox;
