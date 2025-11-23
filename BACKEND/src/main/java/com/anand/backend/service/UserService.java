package com.anand.backend.service;

import com.anand.backend.entity.Movie;
import com.anand.backend.entity.User;
import com.anand.backend.entity.WatchProgress;
import com.anand.backend.repository.MovieRepository;
import com.anand.backend.repository.UserRepository;
import com.anand.backend.repository.WatchProgressRepository;
import com.google.firebase.auth.FirebaseToken; // Import Firebase
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final WatchProgressRepository watchProgressRepository;
    private final MovieRepository movieRepository;

    // --- FIREBASE SYNC (Replaces OAuth2 Logic) ---
    // This ensures the Firebase User exists in MongoDB
    public User syncUser(FirebaseToken token) {

        return userRepository.findById(token.getUid())
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .id(token.getUid())   // IMPORTANT
                            .email(token.getEmail())
                            .name(token.getName())
                            .picture(token.getPicture())
                            .build();
                    return userRepository.save(newUser);
                });
    }


    // --- 1. FAVORITES/LIKES LOGIC (MERGED) ---
    @Transactional
    public void toggleFavorite(String userId, String movieId) {
        log.info("========================================");
        log.info("SERVICE METHOD CALLED!!!");
        log.info("========================================");
        log.info("🔄 toggleFavorite called - userId: {}, movieId: {}", userId, movieId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        
        boolean isRemoving = user.getFavoriteMovieIds().contains(movieId);
        log.info("📊 Current state - isRemoving: {}, currentLikes: {}", isRemoving,
            (movie.getStatistics() != null ? movie.getStatistics().getLikes() : "null"));
        
        // Initialize statistics if null
        if (movie.getStatistics() == null) {
            log.info("⚠️ Statistics was null, initializing...");
            movie.setStatistics(Movie.Statistics.builder()
                    .views(0)
                    .likes(0)
                    .likedByUserIds(new java.util.ArrayList<>())
                    .build());
        }
        
        long beforeLikes = movie.getStatistics().getLikes();
        
        // Toggle user's favorite list and movie's like count
        if (isRemoving) {
            user.getFavoriteMovieIds().remove(movieId);
            // Decrement movie like count
            if (movie.getStatistics().getLikes() > 0) {
                movie.getStatistics().setLikes(movie.getStatistics().getLikes() - 1);
            }
            // Remove user from likedByUserIds
            movie.getStatistics().getLikedByUserIds().remove(userId);
            log.info("➖ Removed from favorites");
        } else {
            user.getFavoriteMovieIds().add(movieId);
            // Increment movie like count
            movie.getStatistics().setLikes(movie.getStatistics().getLikes() + 1);
            // Add user to likedByUserIds
            if (!movie.getStatistics().getLikedByUserIds().contains(userId)) {
                movie.getStatistics().getLikedByUserIds().add(userId);
            }
            log.info("➕ Added to favorites");
        }
        
        long afterLikes = movie.getStatistics().getLikes();
        log.info("💚 Like count change: {} → {}", beforeLikes, afterLikes);
        
        User savedUser = userRepository.save(user);
        Movie savedMovie = movieRepository.save(movie);
        
        log.info("✅ Saved - User favorites: {}, Movie likes: {}", 
            savedUser.getFavoriteMovieIds().size(), savedMovie.getStatistics().getLikes());
    }

    // --- 2. WATCH LATER LOGIC ---
    @Transactional
    public void toggleWatchLater(String userId, String movieId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getWatchLaterMovieIds().contains(movieId)) {
            user.getWatchLaterMovieIds().remove(movieId);
        } else {
            user.getWatchLaterMovieIds().add(movieId);
        }
        userRepository.save(user);
    }

    // --- 3. WATCH PROGRESS (HEARTBEAT) ---
    public void updateWatchProgress(String userId, String movieId, Double seconds, Double totalDuration) {
        WatchProgress progress = watchProgressRepository.findByUserIdAndMovieId(userId, movieId)
                .orElse(WatchProgress.builder()
                        .userId(userId)
                        .movieId(movieId)
                        .build());

        progress.setTimestampSeconds(seconds);
        progress.setTotalDurationSeconds(totalDuration);
        progress.setLastWatchedAt(Instant.now());

        // Mark completed if watched > 90%
        if (totalDuration > 0) {
            double percentage = (seconds / totalDuration) * 100;
            progress.setCompleted(percentage > 90);
        }

        watchProgressRepository.save(progress);
    }

    public List<WatchProgress> getContinueWatching(String userId) {
        return watchProgressRepository.findByUserIdOrderByLastWatchedAtDesc(userId);
    }

    // --- BASIC GETTERS ---
    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}