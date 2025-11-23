package com.anand.backend.service;

import com.anand.backend.entity.WatchParty;
import com.anand.backend.repository.WatchPartyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WatchPartyService {
    
    private final WatchPartyRepository watchPartyRepository;
    
    /**
     * Create a new watch party room
     */
    public WatchParty createRoom(String movieId, String hostUserId) {
        WatchParty watchParty = new WatchParty();
        watchParty.setMovieId(movieId);
        watchParty.setHostUserId(hostUserId);
        watchParty.addParticipant(hostUserId);
        watchParty.setCurrentTime(0.0);
        watchParty.setIsPlaying(false);
        watchParty.setCreatedAt(LocalDateTime.now());
        watchParty.setLastUpdated(LocalDateTime.now());
        
        return watchPartyRepository.save(watchParty);
    }
    
    /**
     * Join an existing watch party room
     */
    public WatchParty joinRoom(String roomId, String userId) {
        WatchParty watchParty = watchPartyRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Watch party not found"));
        
        watchParty.addParticipant(userId);
        watchParty.setLastUpdated(LocalDateTime.now());
        
        return watchPartyRepository.save(watchParty);
    }
    
    /**
     * Leave a watch party room
     */
    public WatchParty leaveRoom(String roomId, String userId) {
        WatchParty watchParty = watchPartyRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Watch party not found"));
        
        watchParty.removeParticipant(userId);
        watchParty.setLastUpdated(LocalDateTime.now());
        
        // If host leaves, delete the room
        if (watchParty.isHost(userId)) {
            watchPartyRepository.delete(watchParty);
            return null;
        }
        
        // If no participants left, delete the room
        if (watchParty.getParticipants().isEmpty()) {
            watchPartyRepository.delete(watchParty);
            return null;
        }
        
        return watchPartyRepository.save(watchParty);
    }
    
    /**
     * Update playback state (time, play/pause)
     */
    public WatchParty updatePlaybackState(String roomId, Double currentTime, Boolean isPlaying) {
        WatchParty watchParty = watchPartyRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Watch party not found"));
        
        if (currentTime != null) {
            watchParty.setCurrentTime(currentTime);
        }
        if (isPlaying != null) {
            watchParty.setIsPlaying(isPlaying);
        }
        watchParty.setLastUpdated(LocalDateTime.now());
        
        return watchPartyRepository.save(watchParty);
    }
    
    /**
     * Get current room state
     */
    public Optional<WatchParty> getRoomState(String roomId) {
        return watchPartyRepository.findById(roomId);
    }
    
    /**
     * Check if user is the host
     */
    public boolean isHost(String roomId, String userId) {
        return watchPartyRepository.findById(roomId)
                .map(party -> party.isHost(userId))
                .orElse(false);
    }
}
