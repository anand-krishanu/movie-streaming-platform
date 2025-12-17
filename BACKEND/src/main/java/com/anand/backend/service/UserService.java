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

/**
 * Service class for managing User entities and their interactions.
 * <p>
 * This service handles business logic for:
 * <ul>
 *   <li>User synchronization with Firebase Authentication</li>
 *   <li>Managing user favorites and "Watch Later" lists</li>
 *   <li>Tracking and updating movie watch progress</li>
 * </ul>
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final WatchProgressRepository watchProgressRepository;
    private final MovieRepository movieRepository;

    /**
     * Synchronizes a Firebase user with the local MongoDB database.
     * <p>
     * If the user does not exist in the local database, a new record is created
     * using details from the Firebase token. If the user exists, the existing record is returned.
     * </p>
     *
     * @param token The Firebase authentication token containing user details.
     * @return The synchronized User entity.
     */
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


    /**
     * Toggles the favorite status of a movie for a specific user.
     * <p>
     * This method handles the bidirectional relationship:
     * <ul>
     *   <li>Adding/Removing the movie ID from the user's favorites list.</li>
     *   <li>Incrementing/Decrementing the movie's global like count.</li>
     *   <li>Updating the list of users who liked the movie.</li>
     * </ul>
     * </p>
     *
     * @param userId  The ID of the user.
     * @param movieId The ID of the movie.
     */
    @Transactional
    public void toggleFavorite(String userId, String movieId) {
        log.info("========================================");
        log.info("SERVICE METHOD CALLED!!!");
        log.info("========================================");
        log.info("🔄 toggleFavorite called - userId: {}, movieId: {}", userId, movieId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        boolean isRemoving = user.getFavoriteMovieIds().contains(movieId);

        Optional<Movie> movieOpt = movieRepository.findById(movieId);
        
        if (movieOpt.isEmpty()) {
            if (isRemoving) {
                log.warn("⚠️ Movie {} not found, but removing from user favorites (cleanup)", movieId);
                user.getFavoriteMovieIds().remove(movieId);
                userRepository.save(user);
                return;
            }
            throw new RuntimeException("Movie not found");
        }

        Movie movie = movieOpt.get();

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

    /**
     * Toggles the "Watch Later" status of a movie for a specific user.
     *
     * @param userId  The ID of the user.
     * @param movieId The ID of the movie.
     */
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

    /**
     * Updates the watch progress for a user on a specific movie.
     * <p>
     * This method records the current timestamp and calculates if the movie
     * should be marked as "completed" (e.g., if > 90% watched).
     * </p>
     *
     * @param userId        The ID of the user.
     * @param movieId       The ID of the movie.
     * @param seconds       The current playback position in seconds.
     * @param totalDuration The total duration of the movie in seconds.
     */
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

    /**
     * Retrieves the watch history for a user.
     *
     * @param userId The ID of the user.
     * @return A list of WatchProgress records, sorted by last watched time.
     */
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