package com.anand.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Collectors;

/**
 * Service for generating tokenized HLS playlists.
 * <p>
 * Transforms standard HLS master.m3u8 playlists by replacing segment filenames
 * with tokenized URLs. Each segment receives a unique, time-limited JWT token
 * to prevent unauthorized access and URL sharing.
 * 
 * @author Your Team Name
 * @version 1.0
 * @since 2025-12-29
 */
@Service
public class PlaylistService {
    
    @Autowired
    private VideoTokenService tokenService;
    
    @Value("${video.processed.dir}")
    private String processedDir;
    
    /**
     * Generates a tokenized master playlist for HLS streaming.
     * <p>
     * Reads the original m3u8 file and replaces segment filenames with
     * fully-qualified URLs containing unique JWT tokens. Metadata lines
     * (e.g., #EXTM3U, #EXT-X-VERSION) are preserved unchanged.
     *
     * @param videoId the video identifier
     * @param userId the requesting user identifier
     * @return modified playlist content with tokenized segment URLs
     * @throws IOException if playlist file cannot be read
     */
    public String generatePlaylist(String videoId, String userId) throws IOException {
        Path playlistPath = Paths.get(processedDir, videoId, "master.m3u8");
        
        if (!Files.exists(playlistPath)) {
            throw new IOException("Playlist not found for video: " + videoId);
        }
        
        return Files.lines(playlistPath)
            .map(line -> {
                if (line.trim().endsWith(".ts")) {
                    String segmentFile = line.trim();
                    String token = tokenService.generateSegmentToken(userId, videoId, segmentFile);
                    return String.format("/api/videos/%s/segments/%s?token=%s", 
                                       videoId, segmentFile, token);
                } else {
                    return line;
                }
            })
            .collect(Collectors.joining("\n"));
    }
}
