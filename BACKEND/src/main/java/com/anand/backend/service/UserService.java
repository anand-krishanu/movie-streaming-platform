package com.anand.backend.service;

import com.anand.backend.entity.User;
import com.anand.backend.entity.WatchLater;
import com.anand.backend.entity.WatchHistory;
import com.anand.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    // --- GOOGLE LOGIN / OAUTH2 ---
    public User saveOrUpdateUser(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");

        return userRepository.findByEmail(email)
                .map(existing -> {
                    existing.setName(name);
                    existing.setPicture(picture);
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .name(name)
                                .email(email)
                                .picture(picture)
                                .build()
                ));
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // --- WATCH LATER LOGIC ---
    public User addToWatchLater(String email, WatchLater watchLaterItem) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean alreadyExists = user.getWatchLater().stream()
                .anyMatch(w -> w.getMovieId().equals(watchLaterItem.getMovieId()));

        if (!alreadyExists) {
            watchLaterItem.setAddedAt(Instant.now());
            user.getWatchLater().add(watchLaterItem);
        }

        return userRepository.save(user);
    }

    public User removeFromWatchLater(String email, String movieId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.getWatchLater().removeIf(w -> w.getMovieId().equals(movieId));
        return userRepository.save(user);
    }

    // --- WATCH HISTORY LOGIC ---
    public User addToWatchHistory(String email, WatchHistory historyItem) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean alreadyExists = user.getWatchHistory().stream()
                .anyMatch(w -> w.getMovieId().equals(historyItem.getMovieId()));

        if (!alreadyExists) {
            historyItem.setWatchedAt(Instant.now());
            user.getWatchHistory().add(historyItem);
        }

        return userRepository.save(user);
    }

    // --- ADMIN OR PROFILE USE ---
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }
}