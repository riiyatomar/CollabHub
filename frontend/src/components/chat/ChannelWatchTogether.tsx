import { useRef, useEffect, useState, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { useWatchStore } from '../../store/useWatchStore';
import { getSocket } from '../../api/socket';
import { useAuthStore } from '../../store/useAuthStore';
import { mediaSessionApi } from '../../api/meeting';
import { PlaySquare } from 'lucide-react';
import { toast } from 'sonner';

const Player = (ReactPlayer as any).default || ReactPlayer;

interface ChannelWatchTogetherProps {
  channelId: string;
}

export default function ChannelWatchTogether({ channelId }: ChannelWatchTogetherProps) {
  const { activeSession, setActiveSession, hasJoined, setHasJoined, leaveSession } = useWatchStore();
  const { user } = useAuthStore();
  const playerRef = useRef<any>(null);
  
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const isHost = activeSession?.hostId === user?.id;

  // Initialize and clean up socket listeners for the session
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeSession || !hasJoined) return;

    const handlePlay = (data: { position: number }) => {
      if (isHost) return;
      setPlaying(true);
      if (playerRef.current) {
        const currentPos = playerRef.current.getCurrentTime();
        if (Math.abs(currentPos - data.position) > 0.5) {
          playerRef.current.seekTo(data.position, 'seconds');
        }
      }
    };

    const handlePause = (data: { position: number }) => {
      if (isHost) return;
      setPlaying(false);
      if (playerRef.current) {
        playerRef.current.seekTo(data.position, 'seconds');
      }
    };

    const handleSeek = (data: { position: number }) => {
      if (isHost) return;
      if (playerRef.current) {
        playerRef.current.seekTo(data.position, 'seconds');
      }
    };

    const handleSync = (data: { position: number, rate: number, status: string }) => {
      if (isHost) return;
      
      setPlaybackRate(data.rate);
      setPlaying(data.status === 'PLAYING');
      
      if (playerRef.current) {
        const currentPos = playerRef.current.getCurrentTime();
        if (Math.abs(currentPos - data.position) > 0.5) {
          playerRef.current.seekTo(data.position, 'seconds');
        }
      }
    };
    
    const handleEnd = () => {
      toast.info('The watch session has been ended by the host');
      leaveSession();
    };

    socket.on('media:play', handlePlay);
    socket.on('media:pause', handlePause);
    socket.on('media:seek', handleSeek);
    socket.on('media:sync', handleSync);
    socket.on('media:session:end', handleEnd);

    return () => {
      socket.off('media:play', handlePlay);
      socket.off('media:pause', handlePause);
      socket.off('media:seek', handleSeek);
      socket.off('media:sync', handleSync);
      socket.off('media:session:end', handleEnd);
    };
  }, [activeSession, hasJoined, isHost, leaveSession]);

  // Periodic Sync emitted by Host
  useEffect(() => {
    if (!isHost || !activeSession || !hasJoined) return;
    
    const interval = setInterval(() => {
      if (playerRef.current) {
        const socket = getSocket();
        if (socket) {
          socket.emit('media:sync', {
            sessionId: activeSession.id,
            position: playerRef.current.getCurrentTime(),
            rate: playbackRate,
            status: playing ? 'PLAYING' : 'PAUSED'
          });
        }
      }
    }, 2000); // sync every 2 seconds

    return () => clearInterval(interval);
  }, [isHost, activeSession, hasJoined, playing, playbackRate]);

  // Check for active session in channel on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await mediaSessionApi.getChannelSession(channelId);
        if (res.data.data) {
          setActiveSession(res.data.data);
        } else {
          setActiveSession(null);
        }
      } catch (error) {
        console.error('Error fetching channel session:', error);
      }
    };
    
    fetchSession();
    
    // Listen for new sessions created by others in this channel
    const socket = getSocket();
    if (socket) {
      socket.on('media:session:create', (session) => {
        if (session.channelId === channelId) {
          setActiveSession(session);
        }
      });
    }
    
    return () => {
      if (socket) socket.off('media:session:create');
    };
  }, [channelId, setActiveSession]);
  
  // Set initial state when joining
  useEffect(() => {
    if (activeSession && hasJoined) {
      setPlaying(activeSession.status === 'PLAYING');
      setPlaybackRate(activeSession.playbackRate || 1);
    }
  }, [activeSession, hasJoined]);

  // Host playback handlers
  const handlePlay = useCallback(() => {
    setPlaying(true);
    if (isHost && activeSession) {
      const socket = getSocket();
      if (socket && playerRef.current) {
        socket.emit('media:play', { 
          sessionId: activeSession.id,
          position: playerRef.current.getCurrentTime()
        });
      }
    }
  }, [isHost, activeSession]);

  const handlePause = useCallback(() => {
    setPlaying(false);
    if (isHost && activeSession) {
      const socket = getSocket();
      if (socket && playerRef.current) {
        socket.emit('media:pause', { 
          sessionId: activeSession.id,
          position: playerRef.current.getCurrentTime()
        });
      }
    }
  }, [isHost, activeSession]);

  const handleSeek = (seconds: number) => {
    if (isHost && activeSession) {
      const socket = getSocket();
      if (socket) {
        socket.emit('media:seek', { 
          sessionId: activeSession.id,
          position: seconds
        });
      }
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      await mediaSessionApi.end(activeSession.id);
      const socket = getSocket();
      if (socket) {
        socket.emit('media:session:end', { sessionId: activeSession.id });
      }
      leaveSession();
    } catch (err) {
      toast.error('Failed to end session');
    }
  };

  if (!activeSession) return null;

  // Banner view (not joined yet)
  if (!hasJoined) {
    return (
      <div className="mx-6 my-2 bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3 text-indigo-900">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <PlaySquare className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Live Watch Together Session</h3>
            <p className="text-xs text-indigo-600/80">Hosted by an active member</p>
          </div>
        </div>
        <button 
          onClick={() => setHasJoined(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Join Session
        </button>
      </div>
    );
  }

  // Player view (joined)
  return (
    <div className="mx-6 my-2 bg-black rounded-lg overflow-hidden border border-gray-200 relative aspect-video flex-shrink-0">
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/60 to-transparent z-10 flex items-center justify-between px-4 pointer-events-none">
        <div className="flex items-center space-x-2 text-white/90">
          <PlaySquare className="w-4 h-4" />
          <span className="text-sm font-medium">Watch Together</span>
          {!isHost && (
             <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-2">Syncing</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2 pointer-events-auto">
          {!isHost ? (
            <button 
              onClick={leaveSession}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded transition-colors"
            >
              Leave
            </button>
          ) : (
            <button 
              onClick={handleEndSession}
              className="px-3 py-1 bg-red-500/80 hover:bg-red-600 text-white text-xs font-medium rounded transition-colors"
            >
              End Session
            </button>
          )}
        </div>
      </div>
      
      <div className="w-full h-full" style={{ pointerEvents: isHost ? 'auto' : 'none' }}>
        <Player
          ref={playerRef}
          url={activeSession.mediaUrl}
          width="100%"
          height="100%"
          playing={playing}
          playbackRate={playbackRate}
          controls={isHost}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeek={handleSeek}
          onPlaybackRateChange={handlePlaybackRateChange}
          config={{
            youtube: {
              playerVars: { disablekb: isHost ? 0 : 1, modestbranding: 1 }
            }
          } as any}
        />
      </div>
    </div>
  );
}
