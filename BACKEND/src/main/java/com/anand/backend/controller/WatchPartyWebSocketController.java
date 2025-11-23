package com.anand.backend.controller;

import com.anand.backend.entity.WatchParty;
import com.anand.backend.service.WatchPartyService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Optional;

@Controller
@RequiredArgsConstructor
public class WatchPartyWebSocketController {
    
    private final WatchPartyService watchPartyService;
    private final SimpMessagingTemplate messagingTemplate;
    
    /**
     * Handle playback synchronization events (play, pause, seek)
     * Messages sent to: /app/watch-party/{roomId}/sync
     */
    @MessageMapping("/watch-party/{roomId}/sync")
    public void handleSync(@DestinationVariable String roomId, @Payload SyncMessage message) {
        // Update the room state
        WatchParty updatedParty = watchPartyService.updatePlaybackState(
            roomId, 
            message.getCurrentTime(), 
            message.getIsPlaying()
        );
        
        // Broadcast to all participants in the room
        messagingTemplate.convertAndSend(
            "/topic/watch-party/" + roomId, 
            message
        );
    }
    
    /**
     * Handle user joining the watch party
     * Messages sent to: /app/watch-party/{roomId}/join
     */
    @MessageMapping("/watch-party/{roomId}/join")
    public void handleJoin(@DestinationVariable String roomId, @Payload JoinMessage message) {
        try {
            WatchParty watchParty = watchPartyService.joinRoom(roomId, message.getUserId());
            
            // Notify all participants about the new user
            ParticipantUpdate update = new ParticipantUpdate();
            update.setType("join");
            update.setUserId(message.getUserId());
            update.setParticipants(watchParty.getParticipants());
            
            messagingTemplate.convertAndSend(
                "/topic/watch-party/" + roomId + "/participants", 
                update
            );
            
            // Send current state to the new user
            Optional<WatchParty> currentState = watchPartyService.getRoomState(roomId);
            currentState.ifPresent(party -> {
                SyncMessage syncMessage = new SyncMessage();
                syncMessage.setCurrentTime(party.getCurrentTime());
                syncMessage.setIsPlaying(party.getIsPlaying());
                syncMessage.setUserId("system");
                
                messagingTemplate.convertAndSendToUser(
                    message.getUserId(),
                    "/topic/watch-party/" + roomId,
                    syncMessage
                );
            });
        } catch (Exception e) {
            // Send error message
            messagingTemplate.convertAndSendToUser(
                message.getUserId(),
                "/topic/watch-party/" + roomId + "/error",
                new ErrorMessage("Failed to join room: " + e.getMessage())
            );
        }
    }
    
    /**
     * Handle user leaving the watch party
     * Messages sent to: /app/watch-party/{roomId}/leave
     */
    @MessageMapping("/watch-party/{roomId}/leave")
    public void handleLeave(@DestinationVariable String roomId, @Payload LeaveMessage message) {
        try {
            WatchParty watchParty = watchPartyService.leaveRoom(roomId, message.getUserId());
            
            if (watchParty != null) {
                // Notify remaining participants
                ParticipantUpdate update = new ParticipantUpdate();
                update.setType("leave");
                update.setUserId(message.getUserId());
                update.setParticipants(watchParty.getParticipants());
                
                messagingTemplate.convertAndSend(
                    "/topic/watch-party/" + roomId + "/participants", 
                    update
                );
            } else {
                // Room was deleted (host left or empty)
                messagingTemplate.convertAndSend(
                    "/topic/watch-party/" + roomId + "/participants",
                    new ErrorMessage("Room has been closed")
                );
            }
        } catch (Exception e) {
            messagingTemplate.convertAndSendToUser(
                message.getUserId(),
                "/topic/watch-party/" + roomId + "/error",
                new ErrorMessage("Failed to leave room: " + e.getMessage())
            );
        }
    }
    
    // Message DTOs
    @Data
    public static class SyncMessage {
        private String userId;
        private Double currentTime;
        private Boolean isPlaying;
        private String action; // "play", "pause", "seek"
    }
    
    @Data
    public static class JoinMessage {
        private String userId;
        private String userName;
    }
    
    @Data
    public static class LeaveMessage {
        private String userId;
    }
    
    @Data
    public static class ParticipantUpdate {
        private String type; // "join" or "leave"
        private String userId;
        private java.util.List<String> participants;
    }
    
    @Data
    public static class ErrorMessage {
        private String message;
        
        public ErrorMessage(String message) {
            this.message = message;
        }
    }
}
