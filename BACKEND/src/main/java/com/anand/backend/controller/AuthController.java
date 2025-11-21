package com.anand.backend.controller;

import com.anand.backend.entity.User;
import com.anand.backend.repository.UserRepository;
import com.anand.backend.service.UserService;
import com.google.firebase.auth.FirebaseToken; // Import Firebase
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserRepository userRepository;
    private final UserService userService;

    // --- 1. SYNC ENDPOINT (Called by React 'upsertUser') ---
    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncUser(@AuthenticationPrincipal Object principal) {
        // The Filter sets the principal as a FirebaseToken object
        FirebaseToken token = (FirebaseToken) principal;

        User user = userService.syncUser(token);

        return ResponseEntity.ok(Map.of(
                "user", user,
                "isNewUser", false,
                "message", "User synced successfully"
        ));
    }

    // --- 2. GET CURRENT USER ---
    @GetMapping("/user")
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal Object principal) {
        FirebaseToken token = (FirebaseToken) principal;
        if (token == null) return ResponseEntity.status(401).build();

        return userRepository.findByEmail(token.getEmail())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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
}