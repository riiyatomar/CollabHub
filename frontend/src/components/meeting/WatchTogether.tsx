import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { useMeetingStore } from '../../store/useMeetingStore';
import { getSocket } from '../../api/socket';
import { useAuthStore } from '../../store/useAuthStore';
import { Maximize, X } from 'lucide-react';
import { watchApi } from '../../api/meeting';

const Player = (ReactPlayer as any).default || ReactPlayer;

export const WatchTogether: React.FC = () => {
  const { watchSession, setWatchSession, currentMeeting } = useMeetingStore();
  const { user } = useAuthStore();
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const isHost = watchSession?.hostId === user?.id;

  // Listen to socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !watchSession || !currentMeeting) return;

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
        // If drift is more than 0.5s, sync it
        if (Math.abs(currentPos - data.position) > 0.5) {
          playerRef.current.seekTo(data.position, 'seconds');
        }
      }
    };

    socket.on('watch:play', handlePlay);
    socket.on('watch:pause', handlePause);
    socket.on('watch:seek', handleSeek);
    socket.on('watch:sync', handleSync);

    return () => {
      socket.off('watch:play', handlePlay);
      socket.off('watch:pause', handlePause);
      socket.off('watch:seek', handleSeek);
      socket.off('watch:sync', handleSync);
    };
  }, [watchSession, currentMeeting, isHost]);

  // Periodic Sync emitted by Host
  useEffect(() => {
    if (!isHost || !currentMeeting || !watchSession) return;
    
    const interval = setInterval(() => {
      if (playerRef.current) {
        const socket = getSocket();
        if (socket) {
          socket.emit('watch:sync', {
            meetingId: currentMeeting.id,
            position: playerRef.current.getCurrentTime(),
            rate: playbackRate,
            status: playing ? 'PLAYING' : 'PAUSED'
          });
        }
      }
    }, 2000); // sync every 2 seconds

    return () => clearInterval(interval);
  }, [isHost, currentMeeting, watchSession, playing, playbackRate]);

  // Initialize state based on session
  useEffect(() => {
    if (watchSession) {
      setPlaying(watchSession.status === 'PLAYING');
      setPlaybackRate(watchSession.playbackRate || 1);
    }
  }, [watchSession]);

  const handlePlay = useCallback(() => {
    setPlaying(true);
    if (isHost && currentMeeting) {
      const socket = getSocket();
      if (socket && playerRef.current) {
        socket.emit('watch:play', { 
          meetingId: currentMeeting.id,
          position: playerRef.current.getCurrentTime()
        });
      }
    }
  }, [isHost, currentMeeting]);

  const handlePause = useCallback(() => {
    setPlaying(false);
    if (isHost && currentMeeting) {
      const socket = getSocket();
      if (socket && playerRef.current) {
        socket.emit('watch:pause', { 
          meetingId: currentMeeting.id,
          position: playerRef.current.getCurrentTime()
        });
      }
    }
  }, [isHost, currentMeeting]);

  useEffect(() => {
    const handleTogglePlay = () => {
      if (playing) {
        handlePause();
      } else {
        handlePlay();
      }
    };
    window.addEventListener('toggle-watch-play', handleTogglePlay);
    return () => window.removeEventListener('toggle-watch-play', handleTogglePlay);
  }, [playing, handlePlay, handlePause]);

  const handleSeek = (seconds: number) => {
    if (isHost && currentMeeting) {
      const socket = getSocket();
      if (socket) {
        socket.emit('watch:seek', { 
          meetingId: currentMeeting.id,
          position: seconds
        });
      }
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    // sync will pick it up on next interval
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleClose = async () => {
    if (isHost && currentMeeting) {
      try {
        await watchApi.end(currentMeeting.id);
        const socket = getSocket();
        if (socket) {
          socket.emit('watch:end', { meetingId: currentMeeting.id });
        }
      } catch (err) {
        console.error('Failed to end watch session', err);
      }
    }
    setWatchSession(null);
  };

  if (!watchSession) return null;

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black w-full h-full flex flex-col items-center justify-center ${isFullscreen ? 'fixed inset-0 z-50' : 'rounded-lg overflow-hidden'}`}
    >
      <div className="absolute top-4 right-4 z-10 flex space-x-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={toggleFullscreen}
          className="bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition"
          title="Fullscreen"
        >
          <Maximize className="w-5 h-5" />
        </button>
        {isHost && (
          <button 
            onClick={handleClose}
            className="bg-red-500/80 p-2 rounded-full text-white hover:bg-red-600 transition"
            title="End Session"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="w-full h-full relative" style={{ pointerEvents: isHost ? 'auto' : 'none' }}>
        <Player
          ref={playerRef}
          url={watchSession.mediaUrl}
          width="100%"
          height="100%"
          playing={playing}
          playbackRate={playbackRate}
          controls={isHost}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeek={handleSeek}
          onPlaybackRateChange={handlePlaybackRateChange}
          config={
            {
              youtube: {
                playerVars: { disablekb: isHost ? 0 : 1, modestbranding: 1 }
              }
            } as any
          }
        />
        {!isHost && (
          <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-white text-sm">
            Watching with {watchSession.hostId} (Syncing)
          </div>
        )}
      </div>
    </div>
  );
};
