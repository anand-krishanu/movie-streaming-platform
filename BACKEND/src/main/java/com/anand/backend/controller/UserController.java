package com.anand.backend.controller;

import com.anand.backend.entity.WatchProgress;
import com.anand.backend.service.UserService;
import com.google.firebase.auth.FirebaseToken; // Import Firebase
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for managing user-specific interactions.
 * <p>
 * This controller handles operations related to user preferences and activity, such as:
 * <ul>
 *   <li>Toggling favorite movies</li>
 *   <li>Managing the "Watch Later" list</li>
 *   <li>Tracking video playback progress (heartbeat)</li>
 *   <li>Retrieving "Continue Watching" history</li>
 * </ul>
 * </p>
 */
@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;

    /**
     * Helper to extract the MongoDB User ID from the Firebase Token.
     * We use the email from the token to look up the DB ID.
     */
    private String getUserId(Object principal) {
        if (principal == null) throw new RuntimeException("Not authenticated");

        FirebaseToken token = (FirebaseToken) principal;
        
        log.info("Looking up user by email: {}", token.getEmail());

        // Efficient: Fetch ID by email
        return userService.getUserByEmail(token.getEmail())
                .map(user -> {
                    log.info("User found: id={}, email={}", user.getId(), user.getEmail());
                    return user.getId();
                })
                .orElseThrow(() -> {
                    log.error("User not found in DB for email: {}", token.getEmail());
                    return new RuntimeException("User not synced in DB");
                });
    }

    /**
     * Toggles a movie in the user's favorites list.
     *
     * @param movieId   The ID of the movie to toggle.
     * @param principal The authenticated user principal.
     * @return A success message.
     */
    @PostMapping("/favorite/{movieId}")
    public ResponseEntity<String> toggleFavorite(
            @PathVariable String movieId,
            @AuthenticationPrincipal Object principal
    ) {
        try {
            log.info("🎯 toggleFavorite endpoint called for movieId: {}", movieId);
            String userId = getUserId(principal);
            log.info("👤 User ID resolved: {}", userId);
            log.info("🔧 About to call userService.toggleFavorite...");
            userService.toggleFavorite(userId, movieId);
            log.info("✅ userService.toggleFavorite returned");
            return ResponseEntity.ok("Favorite toggled");
        } catch (Exception e) {
            log.error("❌ Error in toggleFavorite: ", e);
            throw e;
        }
    }

    /**
     * Toggles a movie in the user's "Watch Later" list.
     *
     * @param movieId   The ID of the movie to toggle.
     * @param principal The authenticated user principal.
     * @return A success message.
     */
    @PostMapping("/watch-later/{movieId}")
    public ResponseEntity<String> toggleWatchLater(
            @PathVariable String movieId,
            @AuthenticationPrincipal Object principal
    ) {
        String userId = getUserId(principal);
        userService.toggleWatchLater(userId, movieId);
        return ResponseEntity.ok("Watch Later toggled");
    }

    /**
     * Updates the watch progress for a specific movie.
     * <p>
     * This endpoint acts as a heartbeat, receiving periodic updates from the video player
     * to track how much of the movie the user has watched.
     * </p>
     *
     * @param payload   A map containing 'movieId', 'seconds' (current timestamp), and 'duration' (total length).
     * @param principal The authenticated user principal.
     * @return A success message.
     */
    @PostMapping("/progress")
    public ResponseEntity<String> updateProgress(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal Object principal
    ) {
        String userId = getUserId(principal);

        String movieId = (String) payload.get("movieId");
        // Handle potential casting issues (Integer vs Double) from JSON
        Double seconds = Double.valueOf(payload.get("seconds").toString());
        Double duration = Double.valueOf(payload.get("duration").toString());

        userService.updateWatchProgress(userId, movieId, seconds, duration);
        return ResponseEntity.ok("Progress updated");
    }

    /**
     * Retrieves the user's "Continue Watching" list.
     *
     * @param principal The authenticated user principal.
     * @return A list of WatchProgress entries, sorted by most recently watched.
     */
    @GetMapping("/continue-watching")
    public ResponseEntity<List<WatchProgress>> getContinueWatching(
            @AuthenticationPrincipal Object principal
    ) {
        String userId = getUserId(principal);
        return ResponseEntity.ok(userService.getContinueWatching(userId));
    }

    /**
     * Retrieves the playback progress for a specific movie.
     * <p>
     * Used by the video player to resume playback from the last saved position.
     * Returns 404 Not Found if the user has not started watching this movie.
     * </p>
     *
     * @param movieId   The ID of the movie.
     * @param principal The authenticated user principal.
     * @return The WatchProgress if found, or 404 if not.
     */
    @GetMapping("/progress/{movieId}")
    public ResponseEntity<WatchProgress> getMovieProgress(
            @PathVariable String movieId,
            @AuthenticationPrincipal Object principal
    ) {
        String userId = getUserId(principal);
        return ResponseEntity.of(userService.getWatchProgress(userId, movieId));
    }
}