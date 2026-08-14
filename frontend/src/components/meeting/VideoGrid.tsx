import VideoBox from './VideoBox';
import { useMeetingStore } from '../../store/useMeetingStore';
import { useAuthStore } from '../../store/useAuthStore';

const VideoGrid = () => {
  const { currentMeeting, localStream, remoteStreams, participantsStatus } = useMeetingStore();
  const { user } = useAuthStore();

  if (!currentMeeting || !user) return null;

  // Combine local user and remote participants
  const allParticipants = [
    {
      id: user.id,
      user,
      stream: localStream,
      isLocal: true,
      status: participantsStatus[user.id]
    },
    ...currentMeeting.participants
      .filter(p => p.userId !== user.id)
      .map(p => ({
        id: p.userId,
        user: p.user,
        stream: remoteStreams[p.userId] || null,
        isLocal: false,
        status: participantsStatus[p.userId]
      }))
  ];

  const count = allParticipants.length;
  let gridClass = 'grid-cols-1';
  if (count === 2) gridClass = 'grid-cols-1 md:grid-cols-2';
  else if (count === 3 || count === 4) gridClass = 'grid-cols-2';
  else if (count > 4 && count <= 6) gridClass = 'grid-cols-2 md:grid-cols-3';
  else if (count > 6) gridClass = 'grid-cols-3 md:grid-cols-4';

  return (
    <div className={`grid ${gridClass} gap-4 p-4 h-full w-full auto-rows-fr`}>
      {allParticipants.map((p) => (
        <VideoBox
          key={p.id}
          stream={p.stream}
          isLocal={p.isLocal}
          user={p.user}
          status={p.status}
        />
      ))}
    </div>
  );
};

export default VideoGrid;
