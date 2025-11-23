package com.anand.backend.controller;

import com.anand.backend.entity.WatchParty;
import com.anand.backend.service.WatchPartyService;
import com.google.firebase.auth.FirebaseToken;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/watch-party")
@RequiredArgsConstructor
public class WatchPartyController {
    
    private final WatchPartyService watchPartyService;
    
    /**
     * Create a new watch party room
     */
    @PostMapping("/create")
    public ResponseEntity<?> createWatchParty(
            @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal Object principal
    ) {
        try {
            String userId = getCurrentUserId(principal);
            WatchParty watchParty = watchPartyService.createRoom(request.getMovieId(), userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("roomId", watchParty.getId());
            response.put("movieId", watchParty.getMovieId());
            response.put("hostUserId", watchParty.getHostUserId());
            response.put("participants", watchParty.getParticipants());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get watch party details
     */
    @GetMapping("/{roomId}")
    public ResponseEntity<?> getWatchParty(@PathVariable String roomId) {
        return watchPartyService.getRoomState(roomId)
                .map(watchParty -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("roomId", watchParty.getId());
                    response.put("movieId", watchParty.getMovieId());
                    response.put("hostUserId", watchParty.getHostUserId());
                    response.put("participants", watchParty.getParticipants());
                    response.put("currentTime", watchParty.getCurrentTime());
                    response.put("isPlaying", watchParty.getIsPlaying());
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Join an existing watch party
     */
    @PostMapping("/{roomId}/join")
    public ResponseEntity<?> joinWatchParty(
            @PathVariable String roomId,
            @AuthenticationPrincipal Object principal
    ) {
        try {
            String userId = getCurrentUserId(principal);
            WatchParty watchParty = watchPartyService.joinRoom(roomId, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("roomId", watchParty.getId());
            response.put("movieId", watchParty.getMovieId());
            response.put("participants", watchParty.getParticipants());
            response.put("currentTime", watchParty.getCurrentTime());
            response.put("isPlaying", watchParty.getIsPlaying());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Leave a watch party
     */
    @PostMapping("/{roomId}/leave")
    public ResponseEntity<?> leaveWatchParty(
            @PathVariable String roomId,
            @AuthenticationPrincipal Object principal
    ) {
        try {
            String userId = getCurrentUserId(principal);
            watchPartyService.leaveRoom(roomId, userId);
            return ResponseEntity.ok(Map.of("message", "Left room successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    private String getCurrentUserId(Object principal) {
        if (principal instanceof FirebaseToken) {
            return ((FirebaseToken) principal).getUid();
        }
        throw new RuntimeException("User not authenticated");
    }
    
    @Data
    public static class CreateRoomRequest {
        private String movieId;
    }
}
