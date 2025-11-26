import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import movieApi from '../api/movieApi';
import useAuthStore from '../context/useAuthStore';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import './MovieCarousel.css';

const MovieCarousel = () => {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, authInitialized } = useAuthStore();

  useEffect(() => {
    if (!user || !authInitialized) {
      console.log('[AUTH] Carousel: Waiting for auth...');
      setLoading(false);
      return; // Don't fetch if not logged in or auth not initialized
    }

    const fetchRandomMovies = async () => {
      console.log('[FETCH] Fetching carousel movies...');
      try {
        // Fetch movies with a reasonable page size to get variety for carousel
        const response = await movieApi.fetchMovies({ page: 0, size: 50 });
        const allMovies = response.content || [];
        console.log('[SUCCESS] Carousel movies fetched:', allMovies.length);
        
        // Get 3 random movies
        const shuffled = [...allMovies].sort(() => 0.5 - Math.random());
        const randomMovies = shuffled.slice(0, 3);
        
        setFeaturedMovies(randomMovies);
      } catch (error) {
        console.error('[ERROR] Carousel error:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response,
          status: error.response?.status
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRandomMovies();
  }, [user, authInitialized]);

  if (loading) {
    return (
      <div className="carousel-container">
        <div className="flex justify-center items-center h-96">
          <div className="text-white text-xl">Loading featured movies...</div>
        </div>
      </div>
    );
  }

  if (featuredMovies.length === 0) {
    return null;
  }

  return (
    <div 
      className="carousel-container mx-auto mb-8" 
      style={{ 
        width: '100%',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          prevEl: '.carousel-control-prev',
          nextEl: '.carousel-control-next',
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={true}
        className="movie-carousel"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {featuredMovies.map((movie, index) => {
          const movieId = movie.movieId || movie._id || movie.id;
          const title = movie.movieTitle || movie.title || 'Unknown Title';
          
          // Use thumbnailSpriteUrl for carousel display
          const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
          let poster = movie.videoDetails?.thumbnailSpriteUrl;
          
          // If thumbnail is relative path, make it absolute
          if (poster && !poster.startsWith('http')) {
            // Remove /api prefix if it exists since baseURL already includes it
            const cleanPath = poster.startsWith('/api') ? poster.substring(4) : poster;
            poster = baseURL + cleanPath;
          } else if (!poster) {
            poster = 'https://via.placeholder.com/500x750?text=Movie+Poster';
          }
          
          const genres = movie.genres || movie.genre || [];
          const rating = movie.imdbRating || movie.rating || 'N/A';
          const description = movie.movieDescription || movie.description || 'No description available';
          const duration = movie.videoDetails?.durationSeconds ? Math.floor(movie.videoDetails.durationSeconds / 60) : (movie.duration || 'N/A');
          const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : (movie.year || 'N/A');
          
          return (
          <SwiperSlide key={movieId}>
            <div className="carousel-item-wrapper">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <img
                    src={poster}
                    className="d-block w-100 carousel-image"
                    alt={title}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/500x750?text=Movie+Poster';
                    }}
                  />
                </div>
                <div className="col-md-6 p-4 carousel-content">
                  <h2 className="carousel-title">{title}</h2>
                  <p className="carousel-detail">
                    <strong>Genre:</strong> {
                      Array.isArray(genres) 
                        ? genres.join(', ') 
                        : genres || 'Unknown'
                    }
                  </p>
                  <p className="carousel-detail">
                    <strong>Rating:</strong> {rating}/10
                  </p>
                  <p className="carousel-detail">
                    <strong>Year:</strong> {year}
                  </p>
                  <p className="carousel-detail">
                    <strong>Duration:</strong> {duration} min
                  </p>
                  <p className="carousel-description">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          </SwiperSlide>
        )})}


        {/* Custom Navigation Buttons */}
        <button className="carousel-control-prev" type="button">
          <ChevronLeftIcon className="carousel-control-prev-icon" aria-hidden="true" />
          <span className="visually-hidden">Previous</span>
        </button>
        <button className="carousel-control-next" type="button">
          <ChevronRightIcon className="carousel-control-next-icon" aria-hidden="true" />
          <span className="visually-hidden">Next</span>
        </button>
      </Swiper>
    </div>
  );
};

export default MovieCarousel;