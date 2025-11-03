package com.anand.backend.controller;

import com.anand.backend.entity.User;
import com.anand.backend.entity.WatchHistory;
import com.anand.backend.entity.WatchLater;
import com.anand.backend.service.WatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/watch")
@RequiredArgsConstructor
public class WatchController {

    private final WatchService watchService;

    /** Add to Watch Later **/
    @PostMapping("/later/{movieId}")
    public User addToWatchLater(@AuthenticationPrincipal OAuth2User principal,
                                @PathVariable String movieId) {
        if (principal == null) return null;
        String email = principal.getAttribute("email");
        return watchService.addToWatchLater(email, movieId);
    }

    /** Remove from Watch Later **/
    @DeleteMapping("/later/{movieId}")
    public User removeFromWatchLater(@AuthenticationPrincipal OAuth2User principal,
                                     @PathVariable String movieId) {
        if (principal == null) return null;
        String email = principal.getAttribute("email");
        return watchService.removeFromWatchLater(email, movieId);
    }

    /** Get Watch Later list **/
    @GetMapping("/later")
    public List<WatchLater> getWatchLater(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) return List.of();
        String email = principal.getAttribute("email");
        return watchService.getWatchLater(email);
    }

    /** Add or update Watch History **/
    @PostMapping("/history/{movieId}")
    public User addToHistory(@AuthenticationPrincipal OAuth2User principal,
                             @PathVariable String movieId,
                             @RequestParam(defaultValue = "100") int progress) {
        if (principal == null) return null;
        String email = principal.getAttribute("email");
        return watchService.addToWatchHistory(email, movieId, progress);
    }

    /** Get Watch History **/
    @GetMapping("/history")
    public List<WatchHistory> getHistory(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) return List.of();
        String email = principal.getAttribute("email");
        return watchService.getWatchHistory(email);
    }

    /** Clear Watch History **/
    @DeleteMapping("/history/clear")
    public void clearHistory(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) return;
        String email = principal.getAttribute("email");
        watchService.clearWatchHistory(email);
    }
}
