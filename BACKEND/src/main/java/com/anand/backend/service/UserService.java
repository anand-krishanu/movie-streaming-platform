package com.anand.backend.service;

import com.anand.backend.entity.User;
import com.anand.backend.entity.WatchProgress;
import com.anand.backend.repository.UserRepository;
import com.anand.backend.repository.WatchProgressRepository;
import com.google.firebase.auth.FirebaseToken; // Import Firebase
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final WatchProgressRepository watchProgressRepository;

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


    // --- 1. FAVORITES LOGIC ---
    @Transactional
    public void toggleFavorite(String userId, String movieId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getFavoriteMovieIds().contains(movieId)) {
            user.getFavoriteMovieIds().remove(movieId);
        } else {
            user.getFavoriteMovieIds().add(movieId);
        }
        userRepository.save(user);
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