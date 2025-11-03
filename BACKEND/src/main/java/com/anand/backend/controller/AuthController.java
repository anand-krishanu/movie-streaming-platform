package com.anand.backend.controller;

import com.anand.backend.entity.User;
import com.anand.backend.entity.WatchHistory;
import com.anand.backend.entity.WatchLater;
import com.anand.backend.repository.UserRepository;
import com.anand.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserRepository userRepository;

    private final UserService userService;

    @GetMapping("/user")
    public User getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) return null;

        String email = principal.getAttribute("email");
        Optional<User> user = userRepository.findByEmail(email);
        return user.orElse(null);
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/watchlater")
    public ResponseEntity<User> addToWatchLater(
            @RequestParam String email,
            @RequestBody WatchLater movie) {
        return ResponseEntity.ok(userService.addToWatchLater(email, movie));
    }


    @PostMapping("/{email}/history/{movieId}")
    public User addToHistory(@PathVariable String email, @PathVariable WatchHistory movie) {
        return userService.addToWatchHistory(email, movie);
    }
}