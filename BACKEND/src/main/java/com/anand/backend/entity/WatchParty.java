package com.anand.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a Watch Party session.
 * <p>
 * This document stores the state of a collaborative viewing session, including the
 * movie being watched, the host, the list of participants, and the current playback state.
 * </p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "watch_parties")
public class WatchParty {
    
    @Id
    private String id;
    
    private String movieId;
    
    private String hostUserId;
    
    private List<String> participants = new ArrayList<>();
    
    private Double currentTime; // Current playback time in seconds
    
    private Boolean isPlaying;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime lastUpdated;
    
    public void addParticipant(String userId) {
        if (!participants.contains(userId)) {
            participants.add(userId);
        }
    }
    
    public void removeParticipant(String userId) {
        participants.remove(userId);
    }
    
    public boolean isHost(String userId) {
        return hostUserId.equals(userId);
    }
}
