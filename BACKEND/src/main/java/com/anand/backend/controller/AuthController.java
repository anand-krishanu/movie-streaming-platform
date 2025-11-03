package com.anand.backend.controller;

import com.anand.backend.entity.User;
import com.anand.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    @GetMapping("/user")
    public User getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) return null;

        String email = principal.getAttribute("email");
        Optional<User> user = userRepository.findByEmail(email);
        return user.orElse(null);
    }
}