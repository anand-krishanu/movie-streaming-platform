package com.anand.backend.service;

import com.anand.backend.entity.User;
import com.anand.backend.entity.WatchHistory;
import com.anand.backend.entity.WatchLater;
import com.anand.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WatchService {

    private final UserRepository userRepository;

    /** Add movie to Watch Later list **/
    public User addToWatchLater(String userEmail, String movieId) {
        Optional<User> optionalUser = userRepository.findByEmail(userEmail);
        if (optionalUser.isEmpty()) return null;

        User user = optionalUser.get();

        boolean alreadyExists = user.getWatchLater().stream()
                .anyMatch(w -> w.getMovieId().equals(movieId));

        if (!alreadyExists) {
            user.getWatchLater().add(
                    WatchLater.builder()
                            .movieId(movieId)
                            .addedAt(Instant.now())
                            .build()
            );
            userRepository.save(user);
        }
        return user;
    }

    /** Remove movie from Watch Later **/
    public User removeFromWatchLater(String userEmail, String movieId) {
        Optional<User> optionalUser = userRepository.findByEmail(userEmail);
        if (optionalUser.isEmpty()) return null;

        User user = optionalUser.get();
        user.getWatchLater().removeIf(w -> w.getMovieId().equals(movieId));
        return userRepository.save(user);
    }

    /** Get user’s Watch Later list **/
    public List<WatchLater> getWatchLater(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .map(User::getWatchLater)
                .orElse(List.of());
    }

    /** Add or update Watch History **/
    public User addToWatchHistory(String userEmail, String movieId, int progress) {
        Optional<User> optionalUser = userRepository.findByEmail(userEmail);
        if (optionalUser.isEmpty()) return null;

        User user = optionalUser.get();

        // Remove any existing record for this movie
        user.getWatchHistory().removeIf(h -> h.getMovieId().equals(movieId));

        user.getWatchHistory().add(
                WatchHistory.builder()
                        .movieId(movieId)
                        .watchedAt(new Date())
                        .progress(progress)
                        .build()
        );

        return userRepository.save(user);
    }

    /** Get user’s Watch History **/
    public List<WatchHistory> getWatchHistory(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .map(User::getWatchHistory)
                .orElse(List.of());
    }

    /** Clear Watch History **/
    public void clearWatchHistory(String userEmail) {
        userRepository.findByEmail(userEmail).ifPresent(user -> {
            user.getWatchHistory().clear();
            userRepository.save(user);
        });
    }
}
