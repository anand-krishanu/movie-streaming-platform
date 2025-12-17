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

/**
 * REST Controller for managing Watch Party sessions.
 * <p>
 * This controller handles the lifecycle of a watch party, including:
 * <ul>
 *   <li>Creating new watch party rooms</li>
 *   <li>Retrieving room state and details</li>
 *   <li>Handling user join/leave actions via HTTP (initial handshake)</li>
 * </ul>
 * </p>
 */
@RestController
@RequestMapping("/api/watch-party")
@RequiredArgsConstructor
public class WatchPartyController {
    
    private final WatchPartyService watchPartyService;
    
    /**
     * Creates a new watch party room for a specific movie.
     *
     * @param request   The request body containing the movieId.
     * @param principal The authenticated user creating the room.
     * @return A ResponseEntity containing the initial room details.
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
     * Retrieves the current state of a watch party.
     *
     * @param roomId The ID of the watch party room.
     * @return The WatchParty entity if found, or 404 Not Found.
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
     * Adds a user to an existing watch party.
     *
     * @param roomId    The ID of the room to join.
     * @param principal The authenticated user joining the room.
     * @return The updated WatchParty entity.
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
     * Removes a user from a watch party.
     *
     * @param roomId    The ID of the room to leave.
     * @param principal The authenticated user leaving the room.
     * @return A success message.
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
