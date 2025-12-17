package com.anand.backend.service;

import com.anand.backend.entity.WatchParty;
import com.anand.backend.repository.WatchPartyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service class for managing Watch Party logic and state.
 * <p>
 * This service handles the creation, management, and cleanup of watch party rooms.
 * It maintains the state of participants and playback synchronization.
 * </p>
 */
@Service
@RequiredArgsConstructor
public class WatchPartyService {
    
    private final WatchPartyRepository watchPartyRepository;
    
    /**
     * Creates a new watch party room.
     *
     * @param movieId    The ID of the movie to be watched.
     * @param hostUserId The ID of the user creating the room (host).
     * @return The newly created WatchParty entity.
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
     * Adds a participant to an existing watch party.
     *
     * @param roomId The ID of the room.
     * @param userId The ID of the user joining.
     * @return The updated WatchParty entity.
     */
    public WatchParty joinRoom(String roomId, String userId) {
        WatchParty watchParty = watchPartyRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Watch party not found"));
        
        watchParty.addParticipant(userId);
        watchParty.setLastUpdated(LocalDateTime.now());
        
        return watchPartyRepository.save(watchParty);
    }
    
    /**
     * Removes a participant from a watch party.
     * <p>
     * If the host leaves, or if the room becomes empty, the watch party is deleted.
     * </p>
     *
     * @param roomId The ID of the room.
     * @param userId The ID of the user leaving.
     * @return The updated WatchParty entity, or null if the room was deleted.
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
     * Updates the playback state of the watch party.
     *
     * @param roomId      The ID of the room.
     * @param currentTime The current playback timestamp.
     * @param isPlaying   The playback status (true for playing, false for paused).
     * @return The updated WatchParty entity.
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
     * Retrieves the current state of a watch party.
     *
     * @param roomId The ID of the room.
     * @return An Optional containing the WatchParty if found.
     */
    public Optional<WatchParty> getRoomState(String roomId) {
        return watchPartyRepository.findById(roomId);
    }
    
    /**
     * Checks if a specific user is the host of the watch party.
     *
     * @param roomId The ID of the room.
     * @param userId The ID of the user to check.
     * @return true if the user is the host, false otherwise.
     */
    public boolean isHost(String roomId, String userId) {
        return watchPartyRepository.findById(roomId)
                .map(party -> party.isHost(userId))
                .orElse(false);
    }
}
