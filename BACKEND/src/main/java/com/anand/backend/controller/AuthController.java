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

/**
 * REST Controller for handling user authentication and synchronization.
 * <p>
 * This controller manages the synchronization of user data between the Firebase Authentication
 * service and the local MongoDB database. It also provides endpoints for retrieving user details.
 * </p>
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserRepository userRepository;
    private final UserService userService;

    /**
     * Synchronizes the authenticated user's data with the database.
     * <p>
     * This endpoint is typically called by the frontend immediately after a successful Firebase login.
     * It ensures that the user record in MongoDB is up-to-date with the information from the Firebase token.
     * </p>
     *
     * @param principal The authenticated user principal (FirebaseToken).
     * @return A ResponseEntity containing the synced User object and status message.
     */
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

    /**
     * Retrieves the currently authenticated user's profile.
     *
     * @param principal The authenticated user principal.
     * @return The User entity if found, or 404 Not Found.
     */
    @GetMapping("/user")
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal Object principal) {
        FirebaseToken token = (FirebaseToken) principal;
        if (token == null) return ResponseEntity.status(401).build();

        return userRepository.findByEmail(token.getEmail())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Retrieves all users (Admin only).
     *
     * @param principal The authenticated user principal.
     * @return A list of all users if the requester is an Admin, otherwise 403 Forbidden.
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal Object principal) {
        FirebaseToken token = (FirebaseToken) principal;
        User currentUser = userService.getUserByEmail(token.getEmail()).orElse(null);

        if (currentUser == null || currentUser.getRole() != com.anand.backend.enums.UserRole.ADMIN) {
            return ResponseEntity.status(403).body("Access Denied: Admins only");
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * Retrieves a specific user by ID.
     * <p>
     * Access is restricted to Administrators or the user themselves.
     * </p>
     *
     * @param id        The ID of the user to retrieve.
     * @param principal The authenticated user principal.
     * @return The User entity if authorized and found, otherwise 403 Forbidden or 404 Not Found.
     */
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