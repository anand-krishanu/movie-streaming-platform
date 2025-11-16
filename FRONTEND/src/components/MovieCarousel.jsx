import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import movieApi from '../api/movieApi';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import './MovieCarousel.css';

const MovieCarousel = () => {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRandomMovies = async () => {
      try {
        // Fetch all movies and pick 3 random ones
        const response = await movieApi.fetchMovies();
        const allMovies = response.movies || [];
        
        // Get 3 random movies
        const shuffled = [...allMovies].sort(() => 0.5 - Math.random());
        const randomMovies = shuffled.slice(0, 3);
        
        setFeaturedMovies(randomMovies);
      } catch (error) {
        console.error('Error fetching random movies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRandomMovies();
  }, []);

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
        {featuredMovies.map((movie, index) => (
          <SwiperSlide key={movie._id || index}>
            <div className="carousel-item-wrapper">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <img
                    src={movie.poster}
                    className="d-block w-100 carousel-image"
                    alt={movie.title}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/500x750?text=Movie+Poster';
                    }}
                  />
                </div>
                <div className="col-md-6 p-4 carousel-content">
                  <h2 className="carousel-title">{movie.title}</h2>
                  <p className="carousel-detail">
                    <strong>Genre:</strong> {
                      Array.isArray(movie.genre) 
                        ? movie.genre.join(', ') 
                        : movie.genre || 'Unknown'
                    }
                  </p>
                  <p className="carousel-detail">
                    <strong>Rating:</strong> ⭐ {movie.rating}/10
                  </p>
                  <p className="carousel-detail">
                    <strong>Year:</strong> {movie.year}
                  </p>
                  <p className="carousel-detail">
                    <strong>Duration:</strong> {movie.duration} min
                  </p>
                  <p className="carousel-description">
                    {movie.description}
                  </p>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}

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