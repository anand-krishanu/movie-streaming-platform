import { useEffect, useState } from 'react';
import { FaUser, FaCrown } from 'react-icons/fa';
import websocketService from '../utils/websocket';
import useAuthStore from '../context/useAuthStore';

export default function ParticipantsList({ roomId, hostUserId }) {
  const [participants, setParticipants] = useState([]);
  const { dbUser } = useAuthStore();

  useEffect(() => {
    if (!roomId) return;

    // Subscribe to participant updates
    websocketService.subscribe(
      `/topic/watch-party/${roomId}/participants`,
      (update) => {
        console.log('[PARTICIPANTS] Participant update:', update);
        
        if (update.participants) {
          setParticipants(update.participants);
        }
        
        // Handle join/leave notifications
        if (update.type === 'join') {
          console.log(`[JOIN] ${update.userId} joined`);
        } else if (update.type === 'leave') {
          console.log(`[LEAVE] ${update.userId} left`);
        }
      },
      `participants-${roomId}`
    );

    return () => {
      websocketService.unsubscribe(`participants-${roomId}`);
    };
  }, [roomId]);

  if (!roomId || participants.length === 0) return null;

  return (
    <div className="bg-zinc-900 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
        <FaUser />
        Watching Together ({participants.length})
      </h3>
      
      <div className="space-y-2">
        {participants.map((userId) => {
          const isHost = userId === hostUserId;
          const isCurrentUser = userId === dbUser?.id;
          
          return (
            <div
              key={userId}
              className="flex items-center gap-3 bg-zinc-800 p-3 rounded-lg"
            >
              {/* Avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-white font-bold">
                {userId.charAt(0).toUpperCase()}
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">
                    {isCurrentUser ? 'You' : `User ${userId.slice(0, 8)}`}
                  </span>
                  {isHost && (
                    <span className="flex items-center gap-1 text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                      <FaCrown size={10} />
                      Host
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
