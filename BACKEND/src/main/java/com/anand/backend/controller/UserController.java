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

    // ----------------------------------------------------
    // 1. TOGGLE FAVORITE
    // ----------------------------------------------------
    @PostMapping("/favorite/{movieId}")
    public ResponseEntity<String> toggleFavorite(
            @PathVariable String movieId,
            @AuthenticationPrincipal Object principal
    ) {
        String userId = getUserId(principal);
        userService.toggleFavorite(userId, movieId);
        return ResponseEntity.ok("Favorite toggled");
    }

    // ----------------------------------------------------
    // 2. TOGGLE WATCH LATER
    // ----------------------------------------------------
    @PostMapping("/watch-later/{movieId}")
    public ResponseEntity<String> toggleWatchLater(
            @PathVariable String movieId,
            @AuthenticationPrincipal Object principal
    ) {
        String userId = getUserId(principal);
        userService.toggleWatchLater(userId, movieId);
        return ResponseEntity.ok("Watch Later toggled");
    }

    // ----------------------------------------------------
    // 3. HEARTBEAT (Update Watch Progress)
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // 4. GET CONTINUE WATCHING ROW
    // ----------------------------------------------------
    @GetMapping("/continue-watching")
    public ResponseEntity<List<WatchProgress>> getContinueWatching(
            @AuthenticationPrincipal Object principal
    ) {
        String userId = getUserId(principal);
        return ResponseEntity.ok(userService.getContinueWatching(userId));
    }
}