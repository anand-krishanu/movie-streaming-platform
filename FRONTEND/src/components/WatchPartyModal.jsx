import { useState } from 'react';
import { FaUsers, FaTimes } from 'react-icons/fa';
import { createWatchParty, joinWatchParty } from '../api/watchPartyApi';
import { toast } from 'react-toastify';

export default function WatchPartyModal({ isOpen, onClose, movieId, onRoomCreated }) {
  const [mode, setMode] = useState('select'); // 'select', 'create', 'join'
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const data = await createWatchParty(movieId);
      toast.success('Watch party created!');
      onRoomCreated(data.roomId);
      onClose();
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create watch party');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      toast.warning('Please enter a room ID');
      return;
    }

    setLoading(true);
    try {
      await joinWatchParty(roomId.trim());
      toast.success('Joined watch party!');
      onRoomCreated(roomId.trim());
      onClose();
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join watch party. Check room ID.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <FaTimes size={24} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <FaUsers className="text-red-600" size={32} />
          <h2 className="text-2xl font-bold text-white">Watch Together</h2>
        </div>

        {/* Selection Mode */}
        {mode === 'select' && (
          <div className="space-y-4">
            <p className="text-gray-300 mb-6">
              Watch this movie with friends in sync!
            </p>
            
            <button
              onClick={() => setMode('create')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Create New Room
            </button>
            
            <button
              onClick={() => setMode('join')}
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 rounded-lg transition"
            >
              Join Existing Room
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-transparent hover:bg-zinc-800 text-gray-400 font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Create Room Mode */}
        {mode === 'create' && (
          <div className="space-y-4">
            <p className="text-gray-300 mb-4">
              You'll be the host. Share the room ID with friends to watch together.
            </p>
            
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
            
            <button
              onClick={() => setMode('select')}
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 rounded-lg transition"
            >
              Back
            </button>
          </div>
        )}

        {/* Join Room Mode */}
        {mode === 'join' && (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Enter Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Paste room ID here"
                className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                autoFocus
              />
            </div>
            
            <button
              onClick={handleJoinRoom}
              disabled={loading || !roomId.trim()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
            
            <button
              onClick={() => setMode('select')}
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 rounded-lg transition"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
