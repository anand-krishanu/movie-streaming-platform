package com.anand.backend.controller;

import com.anand.backend.service.PlaylistService;
import com.anand.backend.service.VideoAccessService;
import com.anand.backend.service.VideoTokenService;
import com.google.firebase.auth.FirebaseToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * REST controller for secure HLS video streaming with token-based authorization.
 * <p>
 * Provides three-step streaming workflow:
 * <ol>
 *   <li>Player initialization - validates user and generates master playlist token</li>
 *   <li>Playlist delivery - serves rewritten m3u8 with tokenized segment URLs</li>
 *   <li>Segment delivery - validates tokens and serves individual .ts files</li>
 * </ol>
 * <p>
 * Security features:
 * <ul>
 *   <li>Firebase JWT for user authentication</li>
 *   <li>Custom JWT for segment authorization with 5-10 minute TTL</li>
 *   <li>Redis-cached permission checks for performance</li>
 *   <li>Segment-specific tokens to prevent reuse</li>
 * </ul>
 * 
 * @author Your Team Name
 * @version 1.0
 * @since 2025-12-29
 */
@RestController
@RequestMapping("/api/videos")
public class VideoStreamController {
    
    private static final Logger logger = LoggerFactory.getLogger(VideoStreamController.class);
    
    @Autowired
    private VideoTokenService tokenService;
    
    @Autowired
    private VideoAccessService accessService;
    
    @Autowired
    private PlaylistService playlistService;
    
    @Value("${video.processed.dir}")
    private String processedDir;
    
    /**
     * Initializes video player session and returns tokenized playlist URL.
     * <p>
     * Validates user authentication via Firebase token, checks access permissions
     * (with Redis caching), and generates a master playlist token valid for 10 minutes.
     *
     * @param videoId the video identifier from path variable
     * @param authentication Spring Security authentication object containing Firebase token
     * @return ResponseEntity with playlist URL and metadata, or 401/403 on failure
     */
    @GetMapping("/{videoId}/player")
    public ResponseEntity<Map<String, String>> getPlayer(
            @PathVariable String videoId,
            Authentication authentication) {
        
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        FirebaseToken firebaseToken = (FirebaseToken) authentication.getPrincipal();
        String userId = firebaseToken.getUid();
        
        if (!accessService.hasAccess(userId, videoId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        String token = tokenService.generateMasterPlaylistToken(userId, videoId);
        
        Map<String, String> response = new HashMap<>();
        response.put("playlistUrl", "/api/videos/" + videoId + "/master.m3u8?token=" + token);
        response.put("videoId", videoId);
        response.put("expiresIn", "600");
        
        logger.info("Generated player for user {} and video {}", userId, videoId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Serves HLS master playlist with tokenized segment URLs.
     * <p>
     * Validates the master playlist token, reads the original m3u8 file,
     * and rewrites each segment URL with a unique 5-minute token.
     * Response is not cached to ensure fresh tokens on each request.
     *
     * @param videoId the video identifier from path variable
     * @param token the master playlist JWT token
     * @return ResponseEntity with modified playlist content
     * @throws IOException if playlist file cannot be read
     */
    @GetMapping("/{videoId}/master.m3u8")
    public ResponseEntity<String> getMasterPlaylist(
            @PathVariable String videoId,
            @RequestParam String token) throws IOException {
        
        VideoTokenService.TokenClaims claims = tokenService.verifyToken(token);
        
        if (claims == null || 
            !claims.getVideoId().equals(videoId) || 
            !"master".equals(claims.getType())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        String playlist = playlistService.generatePlaylist(videoId, claims.getUserId());
        
        logger.info("Served master playlist for video {} to user {}", videoId, claims.getUserId());
        
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/vnd.apple.mpegurl"))
            .cacheControl(CacheControl.noCache().noStore().mustRevalidate())
            .body(playlist);
    }
    
    /**
     * Serves individual HLS video segment with token validation.
     * <p>
     * Validates segment-specific JWT token, verifies user access (Redis-cached),
     * and serves the requested .ts file. Content is cacheable by CDN for 1 hour,
     * but token validation occurs on every request. Supports byte-range requests
     * for video seeking.
     *
     * @param videoId the video identifier from path variable
     * @param segmentFile the segment filename from path variable
     * @param token the segment-specific JWT token
     * @return ResponseEntity with video segment file
     */
    @GetMapping("/{videoId}/segments/{segmentFile}")
    public ResponseEntity<Resource> getSegment(
            @PathVariable String videoId,
            @PathVariable String segmentFile,
            @RequestParam String token) {
        
        VideoTokenService.TokenClaims claims = tokenService.verifyToken(token);
        
        if (claims == null || 
            !claims.getVideoId().equals(videoId) || 
            !claims.getSegmentFile().equals(segmentFile) ||
            !"segment".equals(claims.getType())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        if (!accessService.hasAccess(claims.getUserId(), videoId)) {
            logger.warn("Access denied for user {} to video {} segment {}", 
                       claims.getUserId(), videoId, segmentFile);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        Path segmentPath = Paths.get(processedDir, videoId, segmentFile);
        Resource resource = new FileSystemResource(segmentPath);
        
        if (!resource.exists()) {
            logger.error("Segment not found: {}", segmentPath);
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("video/MP2T"))
            .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic())
            .header(HttpHeaders.ACCEPT_RANGES, "bytes")
            .body(resource);
    }
}
