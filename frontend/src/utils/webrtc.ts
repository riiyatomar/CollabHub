import { getSocket } from '../api/socket';
import { useMeetingStore } from '../store/useMeetingStore';
import { useAuthStore } from '../store/useAuthStore';

const peers: Record<string, RTCPeerConnection> = {}; // key: socketId

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const createPeerConnection = (targetSocketId: string, targetUserId: string, localStream: MediaStream, initiator: boolean) => {
  if (peers[targetSocketId]) {
    peers[targetSocketId].close();
  }

  const pc = new RTCPeerConnection(ICE_SERVERS);
  peers[targetSocketId] = pc;

  // Add local tracks
  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const socket = getSocket();
      if (socket) {
        socket.emit('meeting:signal', {
          to: targetSocketId,
          fromUserId: useAuthStore.getState().user?.id,
          signal: { type: 'candidate', candidate: event.candidate }
        });
      }
    }
  };

  // Handle remote tracks
  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      useMeetingStore.getState().addRemoteStream(targetUserId, event.streams[0]);
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log(`ICE Connection State for ${targetUserId}:`, pc.iceConnectionState);
    if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
      console.warn(`Connection lost with ${targetUserId}. Removing peer.`);
      removePeerConnection(targetSocketId, targetUserId);
    }
  };

  // If initiator, create offer
  if (initiator) {
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        const socket = getSocket();
        if (socket) {
          socket.emit('meeting:signal', {
            to: targetSocketId,
            fromUserId: useAuthStore.getState().user?.id,
            signal: pc.localDescription
          });
        }
      })
      .catch(console.error);
  }

  return pc;
};

export const handleSignalingData = async (fromSocketId: string, fromUserId: string, signal: any, localStream: MediaStream) => {
  let pc = peers[fromSocketId];

  if (!pc) {
    pc = createPeerConnection(fromSocketId, fromUserId, localStream, false);
  }

  if (signal.type === 'offer') {
    await pc.setRemoteDescription(new RTCSessionDescription(signal));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    const socket = getSocket();
    if (socket) {
      socket.emit('meeting:signal', {
        to: fromSocketId,
        fromUserId: useAuthStore.getState().user?.id,
        signal: pc.localDescription
      });
    }
  } else if (signal.type === 'answer') {
    await pc.setRemoteDescription(new RTCSessionDescription(signal));
  } else if (signal.type === 'candidate') {
    await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
  }
};

export const removePeerConnection = (socketId: string, userId: string) => {
  if (peers[socketId]) {
    peers[socketId].close();
    delete peers[socketId];
  }
  useMeetingStore.getState().removeRemoteStream(userId);
};

export const destroyAllPeerConnections = () => {
  Object.keys(peers).forEach(socketId => {
    peers[socketId].close();
    delete peers[socketId];
  });
};

export const replaceVideoTrack = (newVideoTrack: MediaStreamTrack) => {
  Object.values(peers).forEach(pc => {
    try {
      const senders = pc.getSenders();
      const videoSender = senders.find(s => s.track?.kind === 'video');
      if (videoSender) {
        videoSender.replaceTrack(newVideoTrack).catch(err => console.error('Failed to replace track', err));
      }
    } catch (err) {
      console.error('Error getting senders for track replacement', err);
    }
  });
};
