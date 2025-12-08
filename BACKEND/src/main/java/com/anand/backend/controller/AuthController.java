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
    public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal Object principal) {
        FirebaseToken token = (FirebaseToken) principal;
        User currentUser = userService.getUserByEmail(token.getEmail()).orElse(null);

        if (currentUser == null || currentUser.getRole() != com.anand.backend.enums.UserRole.ADMIN) {
            return ResponseEntity.status(403).body("Access Denied: Admins only");
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id, @AuthenticationPrincipal Object principal) {
        FirebaseToken token = (FirebaseToken) principal;
        User currentUser = userService.getUserByEmail(token.getEmail()).orElse(null);

        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }

        // Allow if Admin OR if requesting own profile
        if (currentUser.getRole() == com.anand.backend.enums.UserRole.ADMIN || currentUser.getId().equals(id)) {
            return userService.getUserById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }

        return ResponseEntity.status(403).body("Access Denied");
    }
}