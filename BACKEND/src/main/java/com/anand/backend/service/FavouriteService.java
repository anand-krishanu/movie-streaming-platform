package com.anand.backend.service;

import com.anand.backend.entity.Favorite;
import com.anand.backend.entity.User;
import com.anand.backend.repository.MovieRepository;
import com.anand.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class FavouriteService {
    private final UserRepository userRepository;
    private final MovieRepository movieRepository;

    public com.anand.backend.entity.User addToFavorites(String email, Favorite favoriteMovie) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean alreadyExists = user.getFavorites().stream()
                .anyMatch(f -> f.getMovieId().equals(favoriteMovie.getMovieId()));

        if (!alreadyExists) {
            favoriteMovie.setFavoritedAt(Instant.now());
            user.getFavorites().add(favoriteMovie);
        }

        movieRepository.findById(favoriteMovie.getMovieId()).ifPresent(movie -> {
            movie.setFavoritesCount(movie.getFavoritesCount() + 1);
            movieRepository.save(movie);
        });

        return userRepository.save(user);
    }

    public User removeFromFavorites(String email, String movieId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean removed = user.getFavorites().removeIf(f -> f.getMovieId().equals(movieId));
        userRepository.save(user);

        // 🆕 decrement favorite count
        if (removed) {
            movieRepository.findById(movieId).ifPresent(movie -> {
                movie.setFavoritesCount(Math.max(0, movie.getFavoritesCount() - 1));
                movieRepository.save(movie);
            });
        }

        return user;
    }
}
