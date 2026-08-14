import { useState, useEffect, useRef } from 'react';

export function useAudioVolume(stream: MediaStream | null, threshold = 15) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) return;

    // Check if there is an active audio track
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) {
      setIsSpeaking(false);
      return;
    }

    try {
      // Re-use or create AudioContext
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }

      const audioCtx = audioContextRef.current;
      analyserRef.current = audioCtx.createAnalyser();
      analyserRef.current.fftSize = 512;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      analyserRef.current.smoothingTimeConstant = 0.4;

      sourceRef.current = audioCtx.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        
        const average = sum / bufferLength;
        setIsSpeaking(average > threshold);

        rafRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.warn("Failed to initialize audio volume analyzer", err);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
    };
  }, [stream, threshold]);

  return isSpeaking;
}
