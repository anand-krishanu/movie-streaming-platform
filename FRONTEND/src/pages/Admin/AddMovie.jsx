import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../api/axiosInstance';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const AddMovie = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imdbRating: '',
    genres: [],
    poster: '',
    file: null
  });

  const availableGenres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music',
    'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenreToggle = (genre) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (video files)
      const validTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid video file (MP4, MPEG, MOV, AVI)');
        e.target.value = '';
        return;
      }
      
      // Validate file size (max 2GB)
      const maxSize = 2 * 1024 * 1024 * 1024; // 2GB in bytes
      if (file.size > maxSize) {
        toast.error('File size must be less than 2GB');
        e.target.value = '';
        return;
      }

      setFormData(prev => ({
        ...prev,
        file: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a movie title');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a movie description');
      return;
    }

    if (!formData.imdbRating || formData.imdbRating < 0 || formData.imdbRating > 10) {
      toast.error('Please enter a valid IMDB rating (0-10)');
      return;
    }

    if (formData.genres.length === 0) {
      toast.error('Please select at least one genre');
      return;
    }

    if (!formData.file) {
      toast.error('Please select a video file');
      return;
    }

    setLoading(true);

    try {
      // Create FormData for multipart upload
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('imdbRating', parseFloat(formData.imdbRating));
      
      // Append each genre separately
      formData.genres.forEach(genre => {
        uploadData.append('genres', genre);
      });
      
      if (formData.poster.trim()) {
        uploadData.append('poster', formData.poster);
      }
      
      uploadData.append('file', formData.file);

      console.log('[UPLOAD] Uploading movie...');
      const response = await axiosInstance.post('/movies/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percentCompleted}%`);
        }
      });

      console.log('[SUCCESS] Movie uploaded successfully:', response.data);
      toast.success('Movie uploaded successfully! Processing will begin shortly.');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        imdbRating: '',
        genres: [],
        poster: '',
        file: null
      });
      
      // Clear file input
      document.getElementById('videoFile').value = '';

      // Navigate to home page after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('[ERROR] Error uploading movie:', error);
      toast.error(error.response?.data?.message || 'Failed to upload movie. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Add New Movie</h1>

          <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-lg p-8 space-y-6">
            
            {/* Movie Title */}
            <div>
              <label htmlFor="title" className="block text-lg font-semibold mb-2">
                Movie Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
                placeholder="Enter movie title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-lg font-semibold mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="5"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 text-white resize-none"
                placeholder="Enter movie description"
                required
              />
            </div>

            {/* IMDB Rating */}
            <div>
              <label htmlFor="imdbRating" className="block text-lg font-semibold mb-2">
                IMDB Rating * (0-10)
              </label>
              <input
                type="number"
                id="imdbRating"
                name="imdbRating"
                value={formData.imdbRating}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                max="10"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
                placeholder="e.g., 8.5"
                required
              />
            </div>

            {/* Genres */}
            <div>
              <label className="block text-lg font-semibold mb-3">
                Genres * (Select at least one)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableGenres.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => handleGenreToggle(genre)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      formData.genres.includes(genre)
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-gray-300 hover:border-red-500'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              {formData.genres.length > 0 && (
                <p className="mt-2 text-sm text-gray-400">
                  Selected: {formData.genres.join(', ')}
                </p>
              )}
            </div>

            {/* Poster URL */}
            <div>
              <label htmlFor="poster" className="block text-lg font-semibold mb-2">
                Poster URL (Optional)
              </label>
              <input
                type="url"
                id="poster"
                name="poster"
                value={formData.poster}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 text-white"
                placeholder="https://example.com/poster.jpg"
              />
              <p className="mt-1 text-sm text-gray-400">
                Provide a URL to the movie poster image
              </p>
            </div>

            {/* Video File */}
            <div>
              <label htmlFor="videoFile" className="block text-lg font-semibold mb-2">
                Video File * (Max 2GB)
              </label>
              <input
                type="file"
                id="videoFile"
                accept="video/*"
                onChange={handleFileChange}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer"
                required
              />
              {formData.file && (
                <p className="mt-2 text-sm text-green-400">
                  ✓ Selected: {formData.file.name} ({(formData.file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
              <p className="mt-1 text-sm text-gray-400">
                Supported formats: MP4, MPEG, MOV, AVI
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold text-lg transition-all ${
                  loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  'Upload Movie'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
                className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>

          </form>

          {/* Info Section */}
          <div className="mt-8 bg-zinc-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Processing Information</h2>
            <ul className="space-y-2 text-gray-400">
              <li>• After upload, the video will be processed for HLS streaming</li>
              <li>• Thumbnails will be automatically generated</li>
              <li>• Processing time depends on video length and size</li>
              <li>• You can add a poster URL now or update it later</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AddMovie;
