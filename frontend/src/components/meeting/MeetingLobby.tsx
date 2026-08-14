import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useMeetingStore } from '../../store/useMeetingStore';
import { useAuthStore } from '../../store/useAuthStore';
import { meetingApi } from '../../api/meeting';
import { useNavigate } from 'react-router-dom';

interface MeetingLobbyProps {
  meetingId: string;
}

export default function MeetingLobby({ meetingId }: MeetingLobbyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { setMeeting, setLocalStream, setIsJoined, currentMeeting, updateParticipantStatus } = useMeetingStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const initLobby = async () => {
      try {
        const res = await meetingApi.get(meetingId);
        setMeeting(res.data.data);

        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error("Failed to init lobby", err);
        setError(err.response?.data?.message || 'Failed to access camera and microphone.');
      } finally {
        setIsInitializing(false);
      }
    };

    initLobby();

    return () => {
      // We don't stop the tracks here because we might want to pass them to MeetingRoom
    };
  }, [meetingId, setMeeting]);

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const handleJoin = () => {
    if (stream && user) {
      setLocalStream(stream);
      updateParticipantStatus(user.id, { isMuted, isVideoOff, isHandRaised: false });
      setIsJoined(true);
    }
  };

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

  if (isInitializing || !currentMeeting) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl w-full flex flex-col md:flex-row gap-8 items-center bg-gray-800 p-8 rounded-2xl shadow-2xl">
        <div className="flex-1 w-full max-w-lg flex flex-col items-center">
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-gray-700">
            {isVideoOff ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-bold">
                  {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            )}
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-4">
              <button
                onClick={toggleMic}
                className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-600/80 hover:bg-gray-500/80 text-white backdrop-blur-sm'}`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-600/80 hover:bg-gray-500/80 text-white backdrop-blur-sm'}`}
              >
                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full flex flex-col items-center md:items-start space-y-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{currentMeeting.title}</h1>
            <p className="text-gray-400">
              {currentMeeting.participants.length} participant{currentMeeting.participants.length !== 1 ? 's' : ''} already joined
            </p>
          </div>

          <button
            onClick={handleJoin}
            disabled={!stream}
            className="w-full md:w-auto px-8 py-4 bg-primary hover:bg-primary-dark transition-colors rounded-xl font-semibold text-lg flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Meeting
          </button>
        </div>
      </div>
    </div>
  );
}
