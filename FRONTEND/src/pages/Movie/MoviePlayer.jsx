import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import SyncedVideoPlayer from "../../components/SyncedVideoPlayer";
import ParticipantsList from "../../components/ParticipantsList";
import SimilarMoviesRow from "../../components/SimilarMoviesRow";
import WatchPartyModal from "../../components/WatchPartyModal";
import movieApi from "../../api/movieApi";
import { getWatchParty } from "../../api/watchPartyApi";
import useAuthStore from "../../context/useAuthStore";
import { FaThumbsUp, FaEye, FaHeart, FaUsers, FaShare, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";

export default function MoviePlayer() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [viewIncremented, setViewIncremented] = useState(false);
  const [showWatchPartyModal, setShowWatchPartyModal] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const { dbUser, userData, toggleFavorite, authInitialized } = useAuthStore();
  
  // Check if movie is in user's favorites
  const isLiked = userData?.favoriteMovieIds?.includes(id);

  // Check for roomId in URL and fetch room data
  useEffect(() => {
    const roomId = searchParams.get('roomId');
    if (roomId) {
      setActiveRoomId(roomId);
      
      // Fetch room data
      getWatchParty(roomId)
        .then(data => {
          setRoomData(data);
          toast.success('Joined watch party! 🎉');
        })
        .catch(error => {
          console.error('Error fetching room:', error);
          toast.error('Failed to join watch party');
          // Remove invalid roomId from URL
          setSearchParams({});
        });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    // STEP 1: Wait for auth to fully initialize
    if (!authInitialized) {
      console.log('⏳ Waiting for auth to initialize...');
      return;
    }

    // STEP 2: Wait for userData to be synced (this confirms Firebase auth is complete)
    if (!userData || !userData.id) {
      console.log('⏳ Waiting for user data to sync...');
      return;
    }

    // STEP 3: Check if user is authenticated (after userData is loaded)
    if (!dbUser || dbUser._isFallback) {
      console.log('❌ User not authenticated, redirecting to login...');
      // Save the current URL (including roomId) to redirect back after login
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem('redirectAfterLogin', currentPath);
      toast.warning('Please login to view this movie');
      navigate('/login');
      return;
    }

    // STEP 4: Fetch movie (only after auth is fully complete)
    const fetchMovie = async () => {
      try {
        const data = await movieApi.getMovieById(id);
        setMovie(data);
        
        // Increment view count once when movie loads
        if (!viewIncremented) {
          await movieApi.incrementView(id);
          setViewIncremented(true);
          console.log('✅ View count incremented');
        }
      } catch (error) {
        console.error("Error fetching movie:", error);
        toast.error("Failed to load movie");
      }
    };

    fetchMovie();
  }, [id, viewIncremented, authInitialized, dbUser, userData, navigate]);

  const handleLike = async () => {
    if (!dbUser || dbUser._isFallback) {
      toast.warning("Please login to like this movie.");
      return;
    }
    
    if (!userData || !userData.id) {
      toast.warning("Please wait, syncing user data...");
      return;
    }
    
    try {
      // Store current state for toast message
      const wasLiked = isLiked;
      
      // Toggle favorite in backend
      await toggleFavorite(id);
      
      // Wait a bit for backend to update, then refresh movie data
      setTimeout(async () => {
        const updatedMovie = await movieApi.getMovieById(id);
        setMovie(updatedMovie);
      }, 300);
      
      // Show success message based on previous state
      toast.success(wasLiked ? "Removed from favorites! 💔" : "Added to favorites! ❤️");
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorites");
    }
  };

  const handleRoomCreated = (roomId) => {
    setActiveRoomId(roomId);
    
    // Update URL with roomId
    setSearchParams({ roomId });
    
    // Fetch room data
    getWatchParty(roomId)
      .then(data => setRoomData(data))
      .catch(error => console.error('Error fetching room:', error));
  };

  const handleShareRoom = () => {
    if (!activeRoomId) return;
    
    const shareUrl = `${window.location.origin}/player/${id}?roomId=${activeRoomId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => toast.success('Room link copied to clipboard! 📋'))
      .catch(() => toast.error('Failed to copy link'));
  };

  const handleLeaveRoom = () => {
    setActiveRoomId(null);
    setRoomData(null);
    setSearchParams({});
    toast.info('Left watch party');
  };

  if (!movie) {
    return (
      <div className="bg-black min-h-screen text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-20">
        {/* Video Player */}
        <div className="mb-8">
          <SyncedVideoPlayer
            movieId={id}
            title={movie.movieTitle}
            description={movie.movieDescription}
            poster={movie.moviePoster}
            roomId={activeRoomId}
            isHost={roomData?.hostUserId === dbUser?.id}
          />
        </div>

        <div className={`max-w-6xl mx-auto ${activeRoomId ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : ''}`}>
          {/* Main Content - Left Side */}
          <div className={activeRoomId ? 'lg:col-span-2' : 'max-w-4xl mx-auto'}>
            {/* Movie Info Section */}
            <div className="bg-zinc-900 rounded-lg p-6 md:p-8">
            
            {/* Title and Action Buttons */}
            <div className="flex items-start justify-between mb-4 gap-3">
              <h1 className="text-3xl md:text-4xl font-bold flex-1">
                {movie.movieTitle}
              </h1>
              
              <div className="flex items-center gap-3">
                {/* Watch Together Button */}
                <button
                  onClick={() => setShowWatchPartyModal(true)}
                  disabled={!dbUser || dbUser._isFallback || activeRoomId}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    activeRoomId
                      ? 'bg-zinc-700 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } ${
                    !dbUser || dbUser._isFallback ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FaUsers />
                  <span>{activeRoomId ? 'In Party' : 'Watch Together'}</span>
                </button>

                {/* Share Room Button (only if in room) */}
                {activeRoomId && (
                  <button
                    onClick={handleShareRoom}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-all"
                  >
                    <FaShare />
                    <span>Share</span>
                  </button>
                )}

                {/* Like Button */}
                <button
                  onClick={handleLike}
                  disabled={!dbUser || dbUser._isFallback}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    isLiked
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  } ${
                    !dbUser || dbUser._isFallback ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FaHeart className={isLiked ? 'text-white' : 'text-gray-300'} />
                  <span>{isLiked ? 'Liked' : 'Like'}</span>
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-6 mb-6 text-gray-300">
              {/* Rating */}
              {movie.imdbRating && (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-xl">⭐</span>
                  <span className="font-semibold text-lg">{movie.imdbRating}/10</span>
                </div>
              )}

              {/* Views */}
              <div className="flex items-center gap-2">
                <FaEye className="text-gray-400" />
                <span>{movie.statistics?.views || 0} views</span>
              </div>

              {/* Likes */}
              <div className="flex items-center gap-2">
                <FaThumbsUp className="text-gray-400" />
                <span>{movie.statistics?.likes || 0} likes</span>
              </div>

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  <span>{movie.genres.join(', ')}</span>
                </div>
              )}

              {/* Release Date */}
              {movie.releaseDate && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  <span>{new Date(movie.releaseDate).getFullYear()}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {movie.movieDescription && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3 text-gray-200">Description</h2>
                <p className="text-gray-300 leading-relaxed text-lg">
                  {movie.movieDescription}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Watch Party Info */}
        {activeRoomId && (
          <div className="lg:col-span-1 space-y-4">
            {/* Room Info Card */}
            <div className="bg-zinc-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Watch Party</h3>
                <button
                  onClick={handleLeaveRoom}
                  className="text-red-500 hover:text-red-400 transition"
                  title="Leave party"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">Room ID:</span>
                  <p className="text-white font-mono text-xs bg-zinc-800 p-2 rounded mt-1 break-all">
                    {activeRoomId}
                  </p>
                </div>
              </div>
            </div>

            {/* Participants List */}
            <ParticipantsList
              roomId={activeRoomId}
              hostUserId={roomData?.hostUserId}
            />
          </div>
        )}
      </div>

      {/* Similar Movies Section */}
      {!activeRoomId && (
        <div className="max-w-6xl mx-auto mt-8">
          <SimilarMoviesRow movieId={id} />
        </div>
      )}
    </div>

    {/* Watch Party Modal */}
    <WatchPartyModal
      isOpen={showWatchPartyModal}
      onClose={() => setShowWatchPartyModal(false)}
      movieId={id}
      onRoomCreated={handleRoomCreated}
    />
  </div>
  );
}